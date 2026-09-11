/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/chat

   Proxies chat completion requests to:
     - NVIDIA NIM API (primary)
     - Groq API         (fallback)
     - Google Gemini API (fallback, GenAI free tier)

   Environment variables:
   - NVIDIA_NIM_API_KEY   (primary)
   - GROQ_API_KEY          (fallback)
   - GEMINI_API_KEY        (fallback, get one at
                             https://aistudio.google.com/apikey)
   - LANGSEARCH_API_KEY    (web search, primary)
   - SERPER_API_KEY        (web search, fallback)

   Model ID routing:
     - NIM    : "openai/gpt-oss-20b"               → integrate.api.nvidia.com
     - Groq   : "groq/<model-id>"                  → api.groq.com
     - Gemini : "gemini/<model-id>"                → generativelanguage.googleapis.com

   In "auto" mode, NIM models are tried first; if all NIM
   models fail (429/5xx), Groq models are tried next, and
   finally Gemini.

   Web search (tool calling):
     - Round 1: non-streaming request with tool definition
     - If model returns tool_call → run search → inject results
     - Round 2: streaming request with search context
     - SSE events: {type:"searching",query} and {type:"search_done",resultsCount}
     - If search fails or model doesn't support tools → fallback
       to keyword detection + system prompt inject

   Request body:
   {
     messages: [{role, content}],
     model?:       string,   // default: auto (fallback)
     max_tokens?:  number,   // default: 1024
     temperature?: number,   // default: 0.2
     seed?:        number,   // default: 0 (NIM only)
     stream?:      boolean,  // default: true
   }

   Response:
   - If stream=true:  text/event-stream (SSE)
   - If stream=false: application/json
══════════════════════════════════════════════════ */

import { executeSearch, formatSearchContext } from './search.js'

const NIM_URL    = 'https://integrate.api.nvidia.com/v1/chat/completions'
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Fallback order for auto mode: NIM → Groq → Gemini
 *
 * Order is deliberate: NIM has the highest-quality default models,
 * Groq is fast & free, Gemini is the lowest-priority safety net
 * (free tier has tight RPM limits).
 */
const AUTO_FALLBACK_ORDER = [
  // --- NIM models (primary) ---
  { model: 'openai/gpt-oss-20b',                   provider: 'nim' },
  { model: 'moonshotai/kimi-k3',                   provider: 'nim' },
  { model: 'nvidia/nemotron-3-ultra-550b-a55b',    provider: 'nim' },
  { model: 'deepseek-ai/deepseek-v4-flash-0731',   provider: 'nim' },
  { model: 'deepseek-ai/deepseek-v4-pro-0813',     provider: 'nim' },
  // --- Groq models (fallback, 100% free) ---
  { model: 'groq/compound',                provider: 'groq' },
  { model: 'openai/gpt-oss-20b',           provider: 'groq' },
  { model: 'openai/gpt-oss-120b',           provider: 'groq' },
  { model: 'qwen/qwen3.6-27b',             provider: 'groq' },
  { model: 'groq/compound-mini',           provider: 'groq' },
  // --- Gemini models (last-resort fallback, free tier) ---
  // NOTE: Gemini 2.5 models have been deprecated. Using Gemini 3.x instead.
  { model: 'gemini-3.6-flash',     provider: 'gemini' },
  { model: 'gemini-3.5-flash-lite', provider: 'gemini' },
  { model: 'gemini-3.1-pro-preview', provider: 'gemini' },
  { model: 'gemini-flash-latest',  provider: 'gemini' },
]

/**
 * Resolve a model ID to { provider, model }.
 *
 * Supported prefixes:
 *   "groq/<id>"   → Groq
 *   "gemini/<id>" → Gemini
 *   anything else → NIM
 */
/** Map deprecated Gemini model IDs to their current replacements. */
const GEMINI_MODEL_REMAPS = {
  'gemini-2.5-flash':      'gemini-3.6-flash',
  'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
  'gemini-2.5-pro':        'gemini-3.1-pro-preview',
  'gemini-1.5-flash':      'gemini-3.6-flash',
  'gemini-1.5-pro':        'gemini-3.1-pro-preview',
}

function remapGeminiModel(modelId) {
  return GEMINI_MODEL_REMAPS[modelId] || modelId
}

function detectProvider(modelId) {
  if (!modelId) return { provider: 'nim', model: modelId }

  if (modelId.startsWith('groq/')) {
    return { provider: 'groq', model: modelId.slice(5) }
  }
  if (modelId.startsWith('gemini/')) {
    return { provider: 'gemini', model: remapGeminiModel(modelId.slice(7)) }
  }
  return { provider: 'nim', model: modelId }
}

function getProviderUrl(provider) {
  if (provider === 'groq')   return GROQ_URL
  if (provider === 'gemini') return GEMINI_URL
  return NIM_URL
}

/**
 * Build the request body for a given provider.
 * Each provider uses a slightly different JSON shape.
 *
 * Note: Gemini does NOT have a `role: "system"` turn. We merge the
 * system message into a `systemInstruction` field. If no system
 * message exists we still pass an empty placeholder so the API
 * returns consistent content.
 */
function buildRequestBody(provider, modelId, finalMessages, opts) {
  const { max_tokens, temperature, seed, stream } = opts

  if (provider === 'gemini') {
    // Extract system instruction (if any)
    const sysMsg = finalMessages.find(m => m.role === 'system')
    const conversation = finalMessages
      .filter(m => m.role !== 'system')
      .map(m => ({
        // Gemini uses "model" instead of "assistant"
        role:  m.role === 'assistant' ? 'model' : 'user',
        // Gemini expects parts: [{ text }]
        parts: [{ text: typeof m.content === 'string' ? m.content : extractText(m.content) }],
      }))

    // Gemini requires the conversation to start with `user`; if the first
    // turn is from the model we prepend a small user turn to keep it valid.
    if (conversation.length > 0 && conversation[0].role !== 'user') {
      conversation.unshift({ role: 'user', parts: [{ text: '(continue)' }] })
    }

    const body = {
      contents: conversation,
      generationConfig: {
        maxOutputTokens: max_tokens,
        temperature,
      },
    }

    // Gemini does NOT support `seed` at this time.
    // Gemini does NOT support SSE streaming through the
    // :streamGenerateContent endpoint with the GenAI REST API in a way
    // that maps cleanly onto OpenAI's SSE chunks. We use non-streaming
    // for simplicity, then format the response as a single SSE chunk
    // so the frontend streaming code keeps working unchanged.
    void seed

    if (sysMsg) {
      body.systemInstruction = {
        role:  'system', // ignored by Gemini but harmless
        parts: [{ text: typeof sysMsg.content === 'string' ? sysMsg.content : extractText(sysMsg.content) }],
      }
    }

    // `stream` is a hint: Gemini has its own streaming endpoint
    // (see callGemini) which we'll honor if this is `true`.
    void stream
    return body
  }

  // OpenAI-compatible (NIM and Groq)
  const body = provider === 'groq'
    ? { messages: finalMessages, model: modelId, max_tokens, temperature, stream }
    : { messages: finalMessages, model: modelId, max_tokens, temperature, seed, stream }
  return body
}

/** Flatten OpenAI multi-part content ([{type,text},...]) into plain text. */
function extractText(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(p => (typeof p === 'string' ? p : p?.text || ''))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

/**
 * Build the per-model request body that goes to a provider endpoint.
 * Returns { url, body, headers } for the configured provider.
 */
function buildProviderRequest({ provider, modelId, finalMessages, opts, geminiKey, nimKey, groqKey }) {
  const { stream, max_tokens, temperature, seed } = opts

  if (provider === 'gemini') {
    const body   = buildRequestBody('gemini', modelId, finalMessages, opts)
    // Use the streaming endpoint when stream=true, the non-streaming
    // endpoint otherwise. We append `alt=sse` to get proper SSE format.
    const action = stream ? 'streamGenerateContent' : 'generateContent'
    const url    = `${GEMINI_URL}/${modelId}:${action}?alt=sse`
    return {
      url,
      body,
      headers: { 'Content-Type': 'application/json' },
      // Gemini uses ?key= instead of Authorization; caller must use apiKey param
      apiKey: geminiKey,
      apiKeyMode: 'query',
    }
  }

  // OpenAI-compatible (NIM + Groq)
  const apiKey = provider === 'groq' ? groqKey : nimKey
  return {
    url:     getProviderUrl(provider),
    body:    buildRequestBody(provider, modelId, finalMessages, opts),
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept':        stream ? 'text/event-stream' : 'application/json',
    },
    apiKey,
    apiKeyMode: 'bearer',
  }
}

/**
 * Tool definition for web_search — sent to the model so it
 * can decide when to trigger a search.
 *
 * Not all providers support tool calling (e.g. some NIM models).
 * For those, we fall back to keyword detection + system prompt inject.
 */
const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for real-time information. Use this when the user asks about current events, latest news, prices, weather, or anything that requires up-to-date information. Do NOT use this for coding, math, or general knowledge questions.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up',
        }
      },
      required: ['query']
    }
  }
}

/**
 * Keywords that suggest the user's message needs real-time search.
 * Used as fallback when the model doesn't support tool calling.
 */
const SEARCH_KEYWORDS = [
  // English
  'today', 'latest', 'current', 'now', 'recent', 'breaking',
  'price', 'stock', 'weather', 'news', 'score', 'result',
  'happened', 'happening', 'update',
  'this week', 'this month', 'this year', 'right now',
  'real-time', 'realtime', 'real time', 'live',
  'current price', 'market data',
  // Indonesian
  'harga', 'berita', 'terbaru', 'sekarang', 'saat ini', 'cuaca', 'hari ini',
  'kabar', 'terkini', 'bulan ini', 'minggu ini', 'tahun ini', 'sekarang ini',
  'gaji', 'nilai', 'kurs', 'erupsi', 'gempa', 'banjir',
  'bencana', 'kecelakaan', 'demo', 'unjuk rasa', 'pemilu',
  'pilpres', 'pertandingan', 'jadwal', 'skor', 'hasil',
  'siapa yang', 'berapa', 'kapan', 'dimana', 'di mana',
  'update', 'rilis', 'launch', 'peluncuran',
]

/**
 * Heuristic: does this message likely need a web search?
 * Returns a search query string if yes, or null if no.
 *
 * Used as fallback when the model doesn't support tool calling,
 * or when tool calling returned no tool_call.
 */
function detectSearchNeed(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') return null
  const lower = userMessage.toLowerCase()

  // ── Early exit: message is about an uploaded/attached file ──
  // Patterns like "baca file itu", "analisis dokumen ini", "rangkum file"
  // are clearly about local context — not a web search request.
  const FILE_CONTEXT_PATTERNS = [
    /\b(baca|bacakan|analisis|analisa|rangkum|ringkas|jelaskan|summarize|analyze|read|explain|check|review)\b.{0,30}\b(file|dokumen|document|pdf|doc|gambar|image|foto|foto|lampiran|attachment|ini|itu|tersebut|tadi)\b/i,
    /\b(file|dokumen|document|pdf|lampiran|attachment)\b.{0,30}\b(ini|itu|tersebut|tadi|yang|diatas|di atas)\b/i,
    /\bapa (isi|konten|content)\b/i,
  ]
  if (FILE_CONTEXT_PATTERNS.some(p => p.test(lower))) return null

  const needsSearch = SEARCH_KEYWORDS.some(kw => lower.includes(kw))
  if (!needsSearch) return null
  // Use the user message itself as the query (truncated)
  return userMessage.slice(0, 200)
}

/**
 * Check if a provider supports tool calling.
 * NIM: most models yes, but Kimi K3 is uncertain.
 * Groq: yes (OpenAI tool format).
 * Gemini: yes but different format (handled separately).
 */
function supportsToolCalling(provider, _modelId) {
  // Tool calling is intentionally disabled for NIM because it is
  // unreliable across models and can cause empty responses. Keyword
  // detection is used as the deterministic trigger instead.
  if (provider === 'groq') return true
  if (provider === 'nim') return false
  // Gemini needs a different tool format — skip for now,
  // use keyword detection fallback instead
  if (provider === 'gemini') return false
  return false
}

/**
 * Send a non-streaming request to check if the model wants to
 * call the web_search tool.
 *
 * Returns { needsSearch, query, toolCallId? } or null if no tool call.
 */
async function checkToolCall({ provider, modelId, finalMessages, opts, requestBuilder, apiKey, apiKeyMode }) {
  // Build the request with tools attached
  const reqBody = { ...requestBuilder.body }

  if (provider === 'gemini') {
    // Gemini tool format is different — add function declarations
    // to generationConfig
    reqBody.generationConfig = reqBody.generationConfig || {}
    reqBody.generationConfig.tools = [{
      functionDeclarations: [{
        name: WEB_SEARCH_TOOL.function.name,
        description: WEB_SEARCH_TOOL.function.description,
        parameters: WEB_SEARCH_TOOL.function.parameters,
      }]
    }]
  } else {
    // OpenAI-compatible (NIM + Groq)
    reqBody.tools = [WEB_SEARCH_TOOL]
    reqBody.tool_choice = 'auto'
  }

  // Force non-streaming for tool detection round
  if (provider === 'gemini') {
    // Gemini: use generateContent (non-streaming)
    reqBody.generationConfig = reqBody.generationConfig || {}
  } else {
    reqBody.stream = false
  }

  // Build URL — non-streaming endpoint
  let url = requestBuilder.url
  if (provider === 'gemini') {
    // Switch from streamGenerateContent to generateContent
    url = url.replace('streamGenerateContent', 'generateContent')
    // Remove alt=sse
    url = url.replace('?alt=sse', '')
    // Re-add key
    if (!url.includes('key=')) {
      url += (url.includes('?') ? '&' : '?') + `key=${encodeURIComponent(apiKey)}`
    }
  }

  const headers = { ...requestBuilder.headers }
  if (provider !== 'gemini') {
    headers['Accept'] = 'application/json'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const resp = await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify(reqBody),
      signal:  controller.signal,
    })
    clearTimeout(timeoutId)

    if (!resp.ok) {
      console.warn(`[tool-call] ${provider}/${modelId} returned ${resp.status}`)
      await resp.text().catch(() => {})
      return null
    }

    const data = await resp.json()

    // OpenAI-compatible: check choices[0].message.tool_calls
    if (provider === 'nim' || provider === 'groq') {
      const toolCalls = data?.choices?.[0]?.message?.tool_calls
      if (toolCalls && toolCalls.length > 0) {
        const tc = toolCalls[0]
        if (tc.function?.name === 'web_search') {
          try {
            const args = JSON.parse(tc.function.arguments || '{}')
            return {
              needsSearch: true,
              query:       args.query || '',
              toolCallId:  tc.id,
            }
          } catch {
            return null
          }
        }
      }
      return null
    }

    // Gemini: check candidates[0].content.parts for functionCall
    if (provider === 'gemini') {
      const parts = data?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.functionCall && part.functionCall.name === 'web_search') {
          const query = part.functionCall.args?.query || ''
          return { needsSearch: true, query, toolCallId: undefined }
        }
      }
      return null
    }

    return null
  } catch (error) {
    clearTimeout(timeoutId)
    console.warn(`[tool-call] ${provider}/${modelId} error: ${error.message}`)
    return null
  }
}

/**
 * Build search context messages for round 2.
 *
 * For OpenAI-compatible providers: adds tool message to messages array.
 * For Gemini: adds functionResponse to the contents.
 */
function buildSearchMessages(provider, finalMessages, searchQuery, searchResults, toolCallId) {
  if (provider === 'gemini') {
    // Gemini: add model's functionCall response + functionResponse
    const messages = [...finalMessages]
    // Find the system message and separate it
    const sysMsg = messages.find(m => m.role === 'system')
    const conversation = messages.filter(m => m.role !== 'system').map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : extractText(m.content) }],
    }))

    // Add the model's function call
    conversation.push({
      role:  'model',
      parts: [{
        functionCall: { name: 'web_search', args: { query: searchQuery } }
      }]
    })

    // Add our function response
    conversation.push({
      role:  'user',
      parts: [{
        functionResponse: {
          name: 'web_search',
          response: { results: formatSearchContext(searchQuery, searchResults) }
        }
      }]
    })

    const body = {
      contents: conversation,
      generationConfig: { maxOutputTokens: 2048, temperature: 0.2 },
    }
    if (sysMsg) {
      body.systemInstruction = {
        role: 'system',
        parts: [{ text: typeof sysMsg.content === 'string' ? sysMsg.content : extractText(sysMsg.content) }],
      }
    }
    return body
  }

  // OpenAI-compatible: append tool messages to the array
  const messages = [...finalMessages]

  // Add assistant message with tool call
  messages.push({
    role:    'assistant',
    content: null,
    tool_calls: [{
      id: toolCallId || `call_${Date.now()}`,
      type: 'function',
      function: {
        name: 'web_search',
        arguments: JSON.stringify({ query: searchQuery }),
      }
    }]
  })

  // Add tool response message
  messages.push({
    role:    'tool',
    content: formatSearchContext(searchQuery, searchResults),
    tool_call_id: toolCallId || `call_${Date.now()}`,
  })

  return messages
}

/**
 * Build a system-prompt-injected messages array (fallback for
 * models that don't support tool calling).
 *
 * Appends search results to the system prompt as context.
 */
function buildFallbackSearchMessages(finalMessages, searchQuery, searchResults) {
  const searchContext = formatSearchContext(searchQuery, searchResults)
  const messages = [...finalMessages]

  // Find system message and append search context
  const sysIdx = messages.findIndex(m => m.role === 'system')
  if (sysIdx >= 0) {
    const sysContent = typeof messages[sysIdx].content === 'string'
      ? messages[sysIdx].content
      : extractText(messages[sysIdx].content)
    messages[sysIdx] = {
      ...messages[sysIdx],
      content: sysContent + '\n\n' + searchContext,
    }
  } else {
    // No system message — prepend one with search context
    messages.unshift({
      role: 'system',
      content: searchContext,
    })
  }

  return messages
}

/**
 * Write an SSE event to the response.
 * Used for search indicator events.
 */
function writeSSEEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nimKey    = process.env.NVIDIA_NIM_API_KEY
  const groqKey   = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

  if (!nimKey && !groqKey && !geminiKey) {
    return res.status(500).json({
      error: 'No API keys configured. Set NVIDIA_NIM_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY',
    })
  }

  const {
    messages,
    model       = 'auto',
    max_tokens  = 1024,
    temperature = 0.2,
    seed        = 0,
    stream      = true,
  } = req.body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  // Inject system prompt if not already present
  function getCurrentDateString() {
    const now = new Date()
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
    })
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: tz })
    return `${dateStr}, ${timeStr} (${tz})`
  }

  function buildSystemPrompt(activeModel, activeProvider) {
    // Build a human-readable model label for identity responses
    const providerLabel = {
      nim:    'NVIDIA NIM',
      groq:   'Groq',
      gemini: 'Google Gemini',
    }[activeProvider] || activeProvider

    const modelLabel = activeModel || 'unknown'

    return {
      role: 'system',
      content: `You are Nyx Agent, an AI assistant created by CTRL Build.

**Your identity:**
- Name: Nyx Agent
- Model: ${modelLabel}
- Provider: ${providerLabel}
- Created by: CTRL Build

When someone asks who you are, what model you use, or about your identity, ALWAYS answer like this example:
"Saya Nyx Agent, dibuat oleh CTRL Build. Saya menggunakan model ${modelLabel} dari ${providerLabel}."
Adapt the phrasing naturally to the conversation language (Indonesian or English), but always include your name (Nyx Agent), the model name, and the provider.

**Current date and time: ${getCurrentDateString()}**

When mentioning dates, ALWAYS use this current date as reference. Do NOT invent or guess dates. If search results contain a date, use that specific date only if it makes sense in context, but always clarify what "today" means using the current date above.

You may be provided with web search results below when the user asks about current events, latest news, recent prices, weather, sports scores, recent disasters, elections, or anything that may have changed after your knowledge cutoff.

**STRICT RULES — ANTI-HALLUCINATION:**
- If the information is not found in the provided search results, say clearly: "I do not have up-to-date information on this."
- NEVER invent facts, numbers, dates, or names that are not present in the given context.
- Do NOT use hedging phrases like "most likely", "probably", "I think", or "it seems" when stating facts. Distinguish opinions from facts.
- If two sources contradict each other, mention both and tell the user the information is inconsistent.

**HANDLING FILE ATTACHMENTS:**
When a user uploads or attaches a file (you will see its content in the conversation as "--- File: filename ---"), respond naturally and helpfully about the file:
- Start with an acknowledgment like "Baik, file **{nama file}** ini berisi tentang..." or "Here's what I found in the file **{filename}**..."
- Summarize the file content clearly and concisely
- If the user asks to read, analyze, summarize, or explain the file, base your response ENTIRELY on the provided file content
- Do NOT trigger web searches or mention external sources when the user is asking about their uploaded file
- If the file content could not be extracted (shown as "[Could not extract...]" or "[Attached file: ... — content could not be extracted]"), tell the user honestly that the file content could not be read and suggest alternatives (e.g., copy-paste the text, save as a different format)
- For PDF/DOCX files, provide a structured summary with key points
- For code files, explain the code's purpose, structure, and any notable patterns

Follow these guidelines:

- When search results are provided, you MUST cite sources using bracketed numbers after every claim. Example: "Bitcoin is currently priced at $65,000 [1]." or "According to recent reports [2][3], ..."
- At the end of your answer, you MUST include a sources list in this format:
  **Sources:**
  [1] Article Title — https://url.com
  [2] Article Title — https://url.com
- Never add a claim from search results without a source number.
- If no search results are provided or they are not useful, say so honestly and answer with your best knowledge, mentioning that the information may not be up-to-date.
- Use Markdown for formatting: headings (##, ###), **bold**, *italic*, lists, tables, blockquotes
- For code snippets, use fenced code blocks with language tags: \`\`\`js, \`\`\`python, \`\`\`bash, etc.
- Be concise and direct. Avoid unnecessary filler.
- When explaining code, add brief comments inline
- If you don't know something, say so honestly
- For long responses, use headings to organize sections
- Use tables for structured comparisons
- Keep explanations beginner-friendly unless asked otherwise`,
    }
  }

  // System prompt is built per-model inside the loop below.
  const hasSystem = messages.some(m => m.role === 'system')
  // If client supplies their own system prompt, keep messages as-is.
  // Otherwise, system prompt is built per-model inside the loop below.
  const finalMessages = messages

  // Determine which models to try
  const isAuto = model === 'auto'
  let modelsToTry

  if (isAuto) {
    modelsToTry = AUTO_FALLBACK_ORDER
  } else {
    const { provider, model: rawModel } = detectProvider(model)
    modelsToTry = [
      { model: rawModel, provider },
      ...AUTO_FALLBACK_ORDER.filter(
        m => !(m.model === rawModel && m.provider === provider)
      ),
    ]
  }

  // Filter out providers without API keys
  modelsToTry = modelsToTry.filter(m => {
    if (m.provider === 'nim')    return !!nimKey
    if (m.provider === 'groq')   return !!groqKey
    if (m.provider === 'gemini') return !!geminiKey
    return false
  })

  if (modelsToTry.length === 0) {
    return res.status(503).json({ error: 'No available providers. Check your API keys.' })
  }

  const opts = { max_tokens, temperature, seed, stream }

  // Check if web search is available (at least one search provider configured)
  const langSearchKey = process.env.LANGSEARCH_API_KEY
  const serperKey      = process.env.SERPER_API_KEY
  const hasSearch = !!(langSearchKey || serperKey)

  // Extract last user message for keyword detection fallback
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')

  // If the last user message contains file attachments (multipart content
  // with image_url or --- File: ... --- blocks), skip web search entirely —
  // the user is asking about their uploaded content, not the web.
  const lastUserHasFile = Array.isArray(lastUserMsg?.content) && lastUserMsg.content.some(
    p => p.type === 'image_url' || (p.type === 'text' && p.text?.startsWith('--- File:'))
  )

  // For keyword detection, extract ONLY the plain text part of the message
  // (not the file contents). This prevents file content from polluting the
  // keyword check and triggering false-positive web searches.
  const lastUserText = (() => {
    const c = lastUserMsg?.content
    if (typeof c === 'string') return c
    if (Array.isArray(c)) {
      // Only take text parts that are NOT file blocks (--- File: ...)
      const textParts = c
        .filter(p => p.type === 'text' && !p.text?.startsWith('--- File:') && !p.text?.startsWith('[Attached file:'))
        .map(p => p.text || '')
      return textParts.join(' ').trim()
    }
    return ''
  })()

  // ── Pre-search phase (runs once, before trying any model) ──
  // Detect whether the message needs web search and execute it up-front.
  // Results are injected into messages so EVERY model in the fallback
  // chain sees them. When search is triggered we commit SSE headers early
  // and stream searching/search_done indicators before the model loop —
  // that way the client sees the animation immediately while we wait for
  // search results. The model loop then skips re-setting headers when
  // res.headersSent is already true.
  let didSearch = false
  let searchQuery = null
  let searchResult = null

  if (hasSearch && stream) {
    const fallbackQuery = lastUserHasFile ? null : detectSearchNeed(lastUserText)
    if (fallbackQuery) {
      searchQuery = fallbackQuery
      console.log(`[chat] Keyword fallback triggered search: "${searchQuery}"`)

      // Set SSE headers early so we can stream the searching indicator
      // to the client BEFORE the search starts — the search itself
      // can take a few seconds, and we want the animation visible then.
      res.setHeader('Content-Type',  'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection',    'keep-alive')
      writeSSEEvent(res, { type: 'searching', query: searchQuery })
    }

    if (searchQuery) {
      try {
        searchResult = await executeSearch(searchQuery)
      } catch (e) {
        console.warn(`[chat] Search execution failed: ${e.message}`)
        searchResult = { results: [], provider: 'none' }
      }
      console.log(`[chat] Search done — ${searchResult.results.length} results`)
      // Store search results separately; they'll be injected per-model below
      didSearch = true

      // Tell the client the search is done (stop the searching animation)
      writeSSEEvent(res, { type: 'search_done', resultsCount: searchResult.results.length })
    }
  }

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast = i === modelsToTry.length - 1

    // Rebuild messages with the correct model identity in the system prompt
    // for each attempt, so the AI always knows which model it's running on.
    let messagesForThisAttempt
    if (!hasSystem) {
      // Build per-model system prompt with correct identity
      const sysPrompt = buildSystemPrompt(tryModel, provider)
      // User-provided messages (no system msg from client)
      const userTurns = messages
      if (didSearch && searchResult) {
        // Inject search context into system prompt and rebuild
        const searchContext = formatSearchContext(searchQuery, searchResult.results)
        const sysWithSearch = {
          ...sysPrompt,
          content: sysPrompt.content + '\n\n' + searchContext,
        }
        messagesForThisAttempt = [sysWithSearch, ...userTurns]
      } else {
        messagesForThisAttempt = [sysPrompt, ...userTurns]
      }
    } else {
      // Client supplied their own system prompt — keep as-is with search if needed
      messagesForThisAttempt = didSearch && searchResult
        ? buildFallbackSearchMessages(finalMessages, searchQuery, searchResult.results)
        : finalMessages
    }

    const request = buildProviderRequest({
      provider,
      modelId:   tryModel,
      finalMessages: messagesForThisAttempt,
      opts,
      geminiKey,
      nimKey,
      groqKey,
    })

    // Gemini uses ?key=… as a query param instead of Authorization header
    const finalUrl = request.apiKeyMode === 'query'
      ? `${request.url}&key=${encodeURIComponent(request.apiKey)}`
      : request.url

    // Safety guard: if response headers have already been sent (e.g. by
    // the search indicator phase), we can no longer send JSON errors or
    // fallback via status codes. For streaming we can still try the next
    // model; for non-streaming we must end the response.
    if (res.headersSent && !stream) {
      console.warn('[chat] Headers already sent; cannot fallback (non-stream).')
      if (!res.writableEnded) res.end()
      return
    }

    // AbortController with 6-second timeout — covers the initial connection.
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 6000)

    try {
      const apiResponse = await fetch(finalUrl, {
        method:  'POST',
        headers: request.headers,
        body:    JSON.stringify(request.body),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)

      // Rate-limited or server error — try next model
      if (apiResponse.status === 429 || apiResponse.status >= 500) {
        console.warn(`[${provider}] ${tryModel} returned ${apiResponse.status}`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'All models are rate-limited. Please try again.' })
          return res.end()
        }
        return res.status(503).json({
          error: 'All models are rate-limited. Please try again in a moment.',
        })
      }

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => 'Unknown error')
        console.error(`[${provider}] ${tryModel} error:`, apiResponse.status, errorText)
        if (!isLast) continue
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'The AI couldn\'t generate a reply. Please try again.' })
          return res.end()
        }
        return res.status(apiResponse.status).json({
          error: 'The AI couldn\'t generate a reply. Please try again.',
        })
      }

      // Success — expose which model was used
      if (i > 0) console.log(`Fallback succeeded with [${provider}] ${tryModel}`)

      if (stream) {
        // Set SSE headers + model-identity headers only if not already sent.
        // The search phase may have already committed headers (Content-Type,
        // Cache-Control, Connection) — calling setHeader after that throws
        // ERR_HTTP_HEADERS_SENT. X-Used-Model is best-effort; skip when late.
        if (!res.headersSent) {
          res.setHeader('Content-Type',  'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection',    'keep-alive')
          res.setHeader('X-Used-Model',  tryModel)
          res.setHeader('X-Used-Provider', provider)
          res.setHeader('Access-Control-Expose-Headers', 'X-Used-Model, X-Used-Provider')
        }

        const reader  = apiResponse.body.getReader()
        const decoder = new TextDecoder()

        // Per-chunk timeout: if no data arrives within 6 seconds after
        // the previous chunk, abort the stream and try the next model.
        const STREAM_TIMEOUT_MS = 6000

        while (true) {
          const streamTimer = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)

          let chunk
          try {
            chunk = await reader.read()
          } catch (readError) {
            clearTimeout(streamTimer)
            throw readError
          }
          clearTimeout(streamTimer)

          const { done, value } = chunk
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
        res.end()
      } else {
        const data = await apiResponse.json()
        return res.status(200).json(data)
      }
      return // response sent, stop
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        // Timeout — skip to next model
        console.warn(`[${provider}] ${tryModel} timed out after 6s`)
        if (!isLast) {
          console.warn('[chat] Trying next model...')
          continue
        }
        // Last model — send error and end
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'All models timed out. Please try again.' })
          return res.end()
        }
        return res.status(504).json({
          error: 'All models timed out. Please try again in a moment.',
        })
      }

      console.error(`[${provider}] ${tryModel} fetch error:`, error.message)
      if (!isLast) {
        console.warn('[chat] Trying next model...')
        continue
      }
      if (res.headersSent) {
        writeSSEEvent(res, { type: 'error', message: 'The AI couldn\'t generate a reply. Please try again.' })
        return res.end()
      }
      return res.status(500).json({
        error: 'The AI couldn\'t generate a reply. Please try again.',
      })
    }
  }
}
