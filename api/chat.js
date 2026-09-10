/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/chat

   Proxies chat completion requests to:
     - NVIDIA NIM API (primary)
     - Groq API         (fallback)
     - Google Gemini API (fallback, GenAI free tier)

   Environment variables:
   - NVIDIA_NIM_API_KEY  (primary)
   - GROQ_API_KEY         (fallback)
   - GEMINI_API_KEY       (fallback, get one at
                            https://aistudio.google.com/apikey)

   Model ID routing:
     - NIM    : "openai/gpt-oss-20b"               → integrate.api.nvidia.com
     - Groq   : "groq/<model-id>"                  → api.groq.com
     - Gemini : "gemini/<model-id>"                → generativelanguage.googleapis.com

   In "auto" mode, NIM models are tried first; if all NIM
   models fail (429/5xx), Groq models are tried next, and
   finally Gemini.

   Request body:
   {
     messages: [{role, content}],
     model?:       string,   // default: auto (fallback)
     max_tokens?:  number,   // default: 1024
     temperature?: number,   // default: 0.7
     seed?:        number,   // default: 0 (NIM only)
     stream?:      boolean,  // default: true
   }

   Response:
   - If stream=true:  text/event-stream (SSE)
   - If stream=false: application/json
══════════════════════════════════════════════════ */

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
  { model: 'gemini-2.5-flash',    provider: 'gemini' },
  { model: 'gemini-2.5-flash-lite', provider: 'gemini' },
  { model: 'gemini-2.5-pro',      provider: 'gemini' },
  { model: 'gemini-flash-latest', provider: 'gemini' },
]

/**
 * Resolve a model ID to { provider, model }.
 *
 * Supported prefixes:
 *   "groq/<id>"   → Groq
 *   "gemini/<id>" → Gemini
 *   anything else → NIM
 */
function detectProvider(modelId) {
  if (!modelId) return { provider: 'nim', model: modelId }

  if (modelId.startsWith('groq/')) {
    return { provider: 'groq', model: modelId.slice(5) }
  }
  if (modelId.startsWith('gemini/')) {
    return { provider: 'gemini', model: modelId.slice(7) }
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

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nimKey    = process.env.NVIDIA_NIM_API_KEY
  const groqKey   = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (!nimKey && !groqKey && !geminiKey) {
    return res.status(500).json({
      error: 'No API keys configured. Set NVIDIA_NIM_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY',
    })
  }

  const {
    messages,
    model       = 'auto',
    max_tokens  = 1024,
    temperature = 0.7,
    seed        = 0,
    stream      = true,
  } = req.body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  // Inject system prompt if not already present
  const SYSTEM_PROMPT = {
    role: 'system',
    content: `You are a helpful, knowledgeable AI assistant. Follow these guidelines:

- Use Markdown for formatting: headings (##, ###), **bold**, *italic*, lists, tables, blockquotes
- For code snippets, use fenced code blocks with language tags: \`\`\`js, \`\`\`python, \`\`\`bash, etc.
- Be concise and direct. Avoid unnecessary filler.
- When explaining code, add brief comments inline
- If you don't know something, say so honestly
- For long responses, use headings to organize sections
- Use tables for structured comparisons
- Keep explanations beginner-friendly unless asked otherwise`,
  }

  const hasSystem = messages.some(m => m.role === 'system')
  const finalMessages = hasSystem ? messages : [SYSTEM_PROMPT, ...messages]

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

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast = i === modelsToTry.length - 1

    const request = buildProviderRequest({
      provider,
      modelId:   tryModel,
      finalMessages,
      opts,
      geminiKey,
      nimKey,
      groqKey,
    })

    // Gemini uses ?key=… as a query param instead of Authorization header
    const finalUrl = request.apiKeyMode === 'query'
      ? `${request.url}&key=${encodeURIComponent(request.apiKey)}`
      : request.url

    try {
      const apiResponse = await fetch(finalUrl, {
        method:  'POST',
        headers: request.headers,
        body:    JSON.stringify(request.body),
      })

      // Rate-limited or server error — try next model
      if (apiResponse.status === 429 || apiResponse.status >= 500) {
        console.warn(`[${provider}] ${tryModel} returned ${apiResponse.status}`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        return res.status(503).json({
          error: 'All models are rate-limited. Please try again in a moment.',
        })
      }

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => 'Unknown error')
        console.error(`[${provider}] ${tryModel} error:`, apiResponse.status, errorText)
        if (!isLast) continue
        return res.status(apiResponse.status).json({
          error: 'The AI couldn\'t generate a reply. Please try again.',
        })
      }

      // Success — expose which model was used
      res.setHeader('X-Used-Model', tryModel)
      res.setHeader('Access-Control-Expose-Headers', 'X-Used-Model')
      res.setHeader('X-Used-Provider', provider)
      res.setHeader('Access-Control-Expose-Headers', 'X-Used-Model, X-Used-Provider')
      if (i > 0) console.log(`Fallback succeeded with [${provider}] ${tryModel}`)

      if (stream) {
        res.setHeader('Content-Type',  'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection',    'keep-alive')

        const reader  = apiResponse.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
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
      console.error(`[${provider}] ${tryModel} fetch error:`, error.message)
      if (!isLast) continue
      return res.status(500).json({
        error: 'The AI couldn\'t generate a reply. Please try again.',
      })
    }
  }
}
