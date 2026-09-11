/* ═══════════════════════════════════════════════════
   Vite Dev Plugin — Local API proxy for /api/chat
   and /api/title

   This plugin emulates the Vercel serverless functions
   during local development so the AI chat works without
   deploying to Vercel.

   Supports three providers:
     - NVIDIA NIM  (integrate.api.nvidia.com)
     - Groq        (api.groq.com)
     - Google Gemini (generativelanguage.googleapis.com)

   In "auto" mode, NIM models are tried first, then Groq,
   and finally Gemini as a last-resort fallback.

   Environment variables (read from .env / .env.local):
   - NVIDIA_NIM_API_KEY
   - GROQ_API_KEY
   - GEMINI_API_KEY
══════════════════════════════════════════════════ */

const NIM_URL    = 'https://integrate.api.nvidia.com/v1/chat/completions'
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Fallback order used when model === 'auto'.
 * NIM → Groq → Gemini.
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

/** Models to try for title generation (NIM → Groq → Gemini) */
const TITLE_FALLBACK_MODELS = [
  { model: 'openai/gpt-oss-20b',                   provider: 'nim' },
  { model: 'deepseek-ai/deepseek-v4-flash-0731',   provider: 'nim' },
  { model: 'groq/compound-mini',                    provider: 'groq' },
  { model: 'openai/gpt-oss-20b',                    provider: 'groq' },
  { model: 'gemini-3.5-flash-lite',                 provider: 'gemini' },
  { model: 'gemini-flash-latest',                   provider: 'gemini' },
]

/**
 * Map a provider + model to the correct API URL.
 * Model ID prefixes:
 *   "groq/<id>"   → Groq
 *   "gemini/<id>" → Gemini
 *   anything else → NIM
 */
function getProviderUrl(provider) {
  if (provider === 'groq')   return GROQ_URL
  if (provider === 'gemini') return GEMINI_URL
  return NIM_URL
}

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
  if (modelId.startsWith('groq/'))   return { provider: 'groq',   model: modelId.slice(5) }
  if (modelId.startsWith('gemini/')) return { provider: 'gemini', model: remapGeminiModel(modelId.slice(7)) }
  return { provider: 'nim', model: modelId }
}

/** Build a Gemini-style request body. */
function buildGeminiBody(modelId, finalMessages, opts) {
  const sysMsg = finalMessages.find(m => m.role === 'system')
  const conversation = finalMessages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : extractText(m.content) }],
    }))

  if (conversation.length > 0 && conversation[0].role !== 'user') {
    conversation.unshift({ role: 'user', parts: [{ text: '(continue)' }] })
  }

  const body = {
    contents: conversation,
    generationConfig: {
      maxOutputTokens: opts.max_tokens,
      temperature:     opts.temperature,
    },
  }

  if (sysMsg) {
    body.systemInstruction = {
      role:  'system',
      parts: [{ text: typeof sysMsg.content === 'string' ? sysMsg.content : extractText(sysMsg.content) }],
    }
  }

  return body
}

function buildRequestBody(provider, modelId, finalMessages, opts) {
  const { max_tokens, temperature, seed, stream } = opts
  if (provider === 'gemini') {
    return buildGeminiBody(modelId, finalMessages, opts)
  }
  return provider === 'groq'
    ? { messages: finalMessages, model: modelId, max_tokens, temperature, stream }
    : { messages: finalMessages, model: modelId, max_tokens, temperature, seed, stream }
}

/** Flatten OpenAI multi-part content into plain text. */
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

function getCurrentDateString() {
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz,
  })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: tz })
  return `${dateStr}, ${timeStr} (${tz})`
}

function buildSystemPrompt(activeModel, activeProvider) {
  const providerLabel = {
    nim:    'NVIDIA NIM',
    groq:   'Groq',
    gemini: 'Google Gemini',
  }[activeProvider] || (activeProvider || 'AI')

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

/* ── Parse JSON body from request ── */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) }
      catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

/* ── Handle /api/chat ── */
async function handleChat(req, res, nimKey, groqKey, geminiKey) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  if (!nimKey && !groqKey && !geminiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({
      error: 'No API keys configured. Set NVIDIA_NIM_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in .env',
    }))
  }

  let body
  try {
    body = await parseBody(req)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }))
  }

  const {
    messages,
    model       = 'auto',
    max_tokens  = 1024,
    temperature = 0.2,
    seed        = 0,
    stream      = true,
  } = body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Messages array is required' }))
  }

  // System prompt is built per-model in the loop below (with correct model identity).
  const hasSystem = messages.some(m => m.role === 'system')
  // finalMessages = raw messages from client (no system prompt added yet)
  const finalMessages = messages

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
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'No available providers. Check your API keys in .env' }))
  }

  // Headers that tell the client which model is actually serving the
  // response (useful for the "Auto" indicator in the UI)
  function setModelHeaders(res, usedModel, provider) {
    res.setHeader('X-Used-Model',     usedModel)
    res.setHeader('X-Used-Provider',  provider)
    res.setHeader('Access-Control-Expose-Headers', 'X-Used-Model, X-Used-Provider')
  }

  const opts = { max_tokens, temperature, seed, stream }

  // Check if web search is available
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
  // Detect whether the message likely needs web search and execute it
  // up-front. The results are injected into the messages so that *every*
  // model in the fallback chain sees them. We still stream a "searching"
  // indicator to the client, but we DO NOT commit the SSE headers until
  // a model actually starts streaming its answer — that way we can still
  // fallback to the next model if the current one fails.
  let didSearch = false
  let searchQuery = null
  let searchResult = null

  if (hasSearch && stream) {
    // 1) Keyword detection (deterministic, works for all providers)
    // Skip search entirely if user attached files — they're asking about local content
    const fallbackQuery = lastUserHasFile ? null : detectSearchNeed(lastUserText)
    if (fallbackQuery) {
      searchQuery = fallbackQuery
      console.log(`[dev-api] Keyword fallback triggered search: "${searchQuery}"`)

      // Set SSE headers early so we can stream the searching indicator
      // to the client BEFORE the search starts — the search itself
      // can take a few seconds, and we want the animation visible then.
      res.setHeader('Content-Type',  'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection',    'keep-alive')
      writeSSEEvent(res, { type: 'searching', query: searchQuery })
    }

    // 2) Execute search if triggered
    if (searchQuery) {
      try {
        searchResult = await executeSearch(searchQuery)
      } catch (e) {
        console.warn(`[dev-api] Search execution failed: ${e.message}`)
        searchResult = { results: [], provider: 'none' }
      }
      console.log(`[dev-api] Search done — ${searchResult.results.length} results`)
      didSearch = true

      // Tell the client the search is done (stop the searching animation)
      writeSSEEvent(res, { type: 'search_done', resultsCount: searchResult.results.length })
    }
  }

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast = i === modelsToTry.length - 1
    const apiKey = provider === 'groq' ? groqKey : provider === 'gemini' ? geminiKey : nimKey

    // Safety guard: if response headers have already been sent (e.g. by
    // the search indicator phase), we can no longer send JSON errors or
    // fallback via status codes. Instead, we stream an SSE error event
    // and end the response.
    if (res.headersSent && !stream) {
      console.warn('[dev-api] Headers already sent; cannot fallback (non-stream).')
      if (!res.writableEnded) res.end()
      return
    }
    // For streaming: if headers already sent, we can still stream —
    // just can't fallback to another model if this one fails mid-stream.

    // Build messages with correct model identity in system prompt
    let messagesForThisAttempt
    if (!hasSystem) {
      const sysPrompt = buildSystemPrompt(tryModel, provider)
      if (didSearch && searchResult) {
        const searchContext = formatSearchContext(searchQuery, searchResult.results)
        const sysWithSearch = { ...sysPrompt, content: sysPrompt.content + '\n\n' + searchContext }
        messagesForThisAttempt = [sysWithSearch, ...messages]
      } else {
        messagesForThisAttempt = [sysPrompt, ...messages]
      }
    } else {
      // Client supplied their own system prompt
      messagesForThisAttempt = didSearch && searchResult
        ? buildFallbackSearchMessages(finalMessages, searchQuery, searchResult.results)
        : finalMessages
    }

    // Build the request — use search-augmented messages if we searched
    const reqBody = buildRequestBody(provider, tryModel, messagesForThisAttempt, opts)

    let apiUrl
    let headers
    if (provider === 'gemini') {
      const action = stream ? 'streamGenerateContent' : 'generateContent'
      apiUrl  = `${GEMINI_URL}/${tryModel}:${action}?alt=sse&key=${encodeURIComponent(apiKey)}`
      headers = { 'Content-Type': 'application/json' }
    } else {
      apiUrl = getProviderUrl(provider)
      headers = {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept':        stream ? 'text/event-stream' : 'application/json',
      }
    }

    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 6000)

    try {
      const apiResponse = await fetch(apiUrl, {
        method:  'POST',
        headers,
        body:    JSON.stringify(reqBody),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)

      // If rate-limited or server error, try next model
      if (apiResponse.status === 429 || apiResponse.status >= 500) {
        console.warn(`[dev-api] [${provider}] ${tryModel} returned ${apiResponse.status}, trying next...`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        // If headers already sent (streaming), send SSE error and end
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'All models are rate-limited. Please try again.' })
          return res.end()
        }
        res.statusCode = 503
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'All models are rate-limited. Please try again in a moment.' }))
      }

      // Non-error status — but check for other client errors
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => 'Unknown error')
        console.error(`[dev-api] [${provider}] ${tryModel} error:`, apiResponse.status, errorText)
        if (!isLast) continue
        // If headers already sent (streaming), send SSE error and end
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'The AI couldn\'t generate a reply. Please try again.' })
          return res.end()
        }
        res.statusCode = apiResponse.status
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'The AI couldn\'t generate a reply. Please try again.' }))
      }

      // Success! Set SSE headers if not already set (search phase may
      // have already sent them), then stream the model response.
      if (!res.headersSent) {
        res.setHeader('Content-Type',  'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection',    'keep-alive')
      }
      setModelHeaders(res, tryModel, provider)
      if (i > 0) {
        console.log(`[dev-api] Fallback succeeded with [${provider}] ${tryModel}`)
      }

      const reader = apiResponse.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
      return // response sent, stop trying
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        console.warn(`[dev-api] [${provider}] ${tryModel} timed out after 6s`)
        // If headers already sent (search phase), we can still try
        // the next model — just don't try to set status codes.
        if (!isLast) {
          console.warn(`[dev-api] Trying next model...`)
          continue
        }
        // Last model — send error and end
        if (res.headersSent) {
          writeSSEEvent(res, { type: 'error', message: 'All models timed out. Please try again.' })
          return res.end()
        }
        res.statusCode = 504
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'All models timed out. Please try again in a moment.' }))
      }

      console.error(`[dev-api] [${provider}] ${tryModel} fetch error:`, error.message)
      if (!isLast) {
        console.warn(`[dev-api] Trying next model...`)
        continue
      }
      if (res.headersSent) {
        writeSSEEvent(res, { type: 'error', message: 'The AI couldn\'t generate a reply. Please try again.' })
        return res.end()
      }
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: 'The AI couldn\'t generate a reply. Please try again.' }))
    }
  }
}

/* ── Handle /api/search ── */
const LANGSEARCH_URL = 'https://api.langsearch.com/v1/web-search'
const SERPER_URL     = 'https://google.serper.dev/search'
const SEARCH_TIMEOUT_MS = 5000
const MAX_SEARCH_RESULTS = 5

function normalizeLangSearch(data) {
  if (!data || !Array.isArray(data.results)) return []
  return data.results.slice(0, MAX_SEARCH_RESULTS).map(r => ({
    title:   r.title || '',
    url:     r.url || r.link || '',
    snippet: r.snippet || r.summary || '',
    date:    r.published_date || r.date || undefined,
  }))
}

function normalizeSerper(data) {
  if (!data || !Array.isArray(data.organic)) return []
  return data.organic.slice(0, MAX_SEARCH_RESULTS).map(r => ({
    title:   r.title || '',
    url:     r.link || r.url || '',
    snippet: r.snippet || '',
    date:    r.date || undefined,
  }))
}

function formatSearchContext(query, results) {
  if (!results || results.length === 0) {
    return `[Tool Result — web_search]\nQuery: "${query}"\n\nNo results found.\n\n[End of search results]`
  }
  const lines = results.map((r, i) => {
    const dateStr = r.date ? ` — ${r.date}` : ''
    return `${i + 1}. ${r.title}\n   URL: ${r.url}${dateStr}\n   ${r.snippet}`
  })
  return `[Web Search Results — MUST cite source numbers [1], [2], etc. for every claim]\nQuery: "${query}"\n\n${lines.join('\n\n')}\n\n[End of search results — cite sources using [1], [2], etc.]\n\nIMPORTANT: The dates shown next to search results are the publication dates of those articles/pages, NOT today's date. Always use the current date from the system prompt above when referring to "today". Do not echo dates from search results as the current date.`
}

async function executeSearch(query) {
  const trimmedQuery = (query || '').slice(0, 200).trim()
  if (!trimmedQuery) return { results: [], provider: 'none' }

  const langSearchKey = process.env.LANGSEARCH_API_KEY
  const serperKey      = process.env.SERPER_API_KEY

  if (langSearchKey) {
    try {
      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
      const resp = await fetch(LANGSEARCH_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${langSearchKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery, freshness: 'noLimit', count: MAX_SEARCH_RESULTS }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log(`[dev-api] LangSearch response status: ${resp.status}`)
      if (resp.ok) {
        const data = await resp.json()
        const results = normalizeLangSearch(data)
        console.log(`[dev-api] LangSearch returned ${results.length} results`)
        if (results.length > 0) return { results, provider: 'langsearch' }
      } else {
        const errText = await resp.text().catch(() => '')
        console.warn(`[dev-api] LangSearch error ${resp.status}: ${errText.slice(0, 200)}`)
      }
    } catch (e) {
      console.warn(`[dev-api] LangSearch failed: ${e.message}`)
    }
  }

  if (serperKey) {
    try {
      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)
      const resp = await fetch(SERPER_URL, {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmedQuery, num: MAX_SEARCH_RESULTS }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log(`[dev-api] Serper response status: ${resp.status}`)
      if (resp.ok) {
        const data = await resp.json()
        const results = normalizeSerper(data)
        console.log(`[dev-api] Serper returned ${results.length} results`)
        if (results.length > 0) return { results, provider: 'serper' }
      } else {
        const errText = await resp.text().catch(() => '')
        console.warn(`[dev-api] Serper error ${resp.status}: ${errText.slice(0, 200)}`)
      }
    } catch (e) {
      console.warn(`[dev-api] Serper failed: ${e.message}`)
    }
  }

  return { results: [], provider: 'none' }
}

async function handleSearch(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }
  let body
  try {
    body = await parseBody(req)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }))
  }
  const { query } = body || {}
  if (!query || typeof query !== 'string') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Query string is required' }))
  }
  const result = await executeSearch(query)
  res.setHeader('Content-Type', 'application/json')
  return res.end(JSON.stringify(result))
}

/* ── Web search tool calling helpers ── */
const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for real-time information. Use this when the user asks about current events, latest news, prices, weather, or anything that requires up-to-date information.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'The search query to look up' } },
      required: ['query']
    }
  }
}

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
  return userMessage.slice(0, 200)
}

function supportsToolCalling(provider, _modelId) {
  // Tool calling is intentionally disabled for NIM because it is
  // unreliable across models and can cause empty responses. Keyword
  // detection is used as the deterministic trigger instead.
  if (provider === 'groq') return true
  if (provider === 'nim') return false
  return false
}

function buildFallbackSearchMessages(finalMessages, searchQuery, searchResults) {
  const searchContext = formatSearchContext(searchQuery, searchResults)
  const messages = [...finalMessages]
  const sysIdx = messages.findIndex(m => m.role === 'system')
  if (sysIdx >= 0) {
    const sysContent = typeof messages[sysIdx].content === 'string'
      ? messages[sysIdx].content
      : extractText(messages[sysIdx].content)
    messages[sysIdx] = { ...messages[sysIdx], content: sysContent + '\n\n' + searchContext }
  } else {
    messages.unshift({ role: 'system', content: searchContext })
  }
  return messages
}

function writeSSEEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/* ── Handle /api/title ── */
async function handleTitle(req, res, nimKey, groqKey, geminiKey) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  if (!nimKey && !groqKey && !geminiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'No API keys configured' }))
  }

  let body
  try {
    body = await parseBody(req)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }))
  }

  const { message } = body || {}
  if (!message || typeof message !== 'string') {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Message is required' }))
  }

  const titleMessages = [
    {
      role: 'system',
      content: 'Generate a very short title (2-6 words, no quotes, no punctuation at the end) that summarizes the user\'s message. Respond with only the title text, nothing else.',
    },
    { role: 'user', content: message.slice(0, 500) },
  ]

  // Filter out providers without API keys
  const modelsToTry = TITLE_FALLBACK_MODELS.filter(m => {
    if (m.provider === 'nim')    return !!nimKey
    if (m.provider === 'groq')   return !!groqKey
    if (m.provider === 'gemini') return !!geminiKey
    return false
  })

  if (modelsToTry.length === 0) {
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ title: message.slice(0, 40) + '...' }))
  }

  const opts = { max_tokens: 30, temperature: 0.3, seed: 0, stream: false }

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast   = i === modelsToTry.length - 1
    const apiKey   = provider === 'groq' ? groqKey : provider === 'gemini' ? geminiKey : nimKey

    const reqBody = buildRequestBody(provider, tryModel, titleMessages, opts)

    let apiUrl
    let headers
    if (provider === 'gemini') {
      const action = 'generateContent'
      apiUrl  = `${GEMINI_URL}/${tryModel}:${action}?key=${encodeURIComponent(apiKey)}`
      headers = { 'Content-Type': 'application/json' }
    } else {
      apiUrl = getProviderUrl(provider)
      headers = {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }
    }

    try {
      const apiResponse = await fetch(apiUrl, {
        method:  'POST',
        headers,
        body:    JSON.stringify(reqBody),
      })

      if (!apiResponse.ok) {
        console.warn(`[dev-api] Title [${provider}] ${tryModel} returned ${apiResponse.status}`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ title: message.slice(0, 40) + '...' }))
      }

      const data = await apiResponse.json()

      // Extract title text — different providers return different shapes
      let title = ''
      if (provider === 'gemini') {
        title = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else {
        title = data?.choices?.[0]?.message?.content || ''
      }

      title = (title || '').trim() || (message.slice(0, 40) + '...')
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ title: title.slice(0, 60) }))
    } catch (error) {
      console.error(`[dev-api] Title [${provider}] ${tryModel} error:`, error.message)
      if (!isLast) continue
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ title: message.slice(0, 40) + '...' }))
    }
  }
}

/* ═══════════════════════════════════════════════════
   Vite plugin: devApiProxy
   Intercepts /api/chat and /api/title in dev mode
══════════════════════════════════════════════════ */
export function devApiProxy() {
  return {
    name: 'dev-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        // Only intercept /api/* routes
        if (!url.startsWith('/api/')) {
          return next()
        }

        // Strip query string
        const path = url.split('?')[0]

        const nimKey    = process.env.NVIDIA_NIM_API_KEY
        const groqKey   = process.env.GROQ_API_KEY
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

        if (path === '/api/chat') {
          return handleChat(req, res, nimKey, groqKey, geminiKey)
        }

        if (path === '/api/title') {
          return handleTitle(req, res, nimKey, groqKey, geminiKey)
        }

        if (path === '/api/search') {
          return handleSearch(req, res)
        }

        // Unknown /api route — pass through to Vite
        return next()
      })
    },
  }
}
