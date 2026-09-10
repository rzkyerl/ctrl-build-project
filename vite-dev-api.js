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
  { model: 'gemini-2.5-flash',    provider: 'gemini' },
  { model: 'gemini-2.5-flash-lite', provider: 'gemini' },
  { model: 'gemini-2.5-pro',      provider: 'gemini' },
  { model: 'gemini-flash-latest', provider: 'gemini' },
]

/** Models to try for title generation (NIM → Groq → Gemini) */
const TITLE_FALLBACK_MODELS = [
  { model: 'openai/gpt-oss-20b',                   provider: 'nim' },
  { model: 'deepseek-ai/deepseek-v4-flash-0731',   provider: 'nim' },
  { model: 'groq/compound-mini',                    provider: 'groq' },
  { model: 'openai/gpt-oss-20b',                    provider: 'groq' },
  { model: 'gemini-2.5-flash-lite',                 provider: 'gemini' },
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

function detectProvider(modelId) {
  if (!modelId) return { provider: 'nim', model: modelId }
  if (modelId.startsWith('groq/'))   return { provider: 'groq',   model: modelId.slice(5) }
  if (modelId.startsWith('gemini/')) return { provider: 'gemini', model: modelId.slice(7) }
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
    temperature = 0.7,
    seed        = 0,
    stream      = true,
  } = body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: 'Messages array is required' }))
  }

  // Inject system prompt
  const hasSystem = messages.some(m => m.role === 'system')
  const finalMessages = hasSystem ? messages : [SYSTEM_PROMPT, ...messages]

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

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast = i === modelsToTry.length - 1
    const apiKey = provider === 'groq' ? groqKey : provider === 'gemini' ? geminiKey : nimKey

    // Build the request
    const reqBody = buildRequestBody(provider, tryModel, finalMessages, opts)

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

    try {
      const apiResponse = await fetch(apiUrl, {
        method:  'POST',
        headers,
        body:    JSON.stringify(reqBody),
      })

      // If rate-limited or server error, try next model
      if (apiResponse.status === 429 || apiResponse.status >= 500) {
        console.warn(`[dev-api] [${provider}] ${tryModel} returned ${apiResponse.status}, trying next...`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        res.statusCode = 503
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'All models are rate-limited. Please try again in a moment.' }))
      }

      // Non-error status — but check for other client errors
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text().catch(() => 'Unknown error')
        console.error(`[dev-api] [${provider}] ${tryModel} error:`, apiResponse.status, errorText)
        if (!isLast) continue
        res.statusCode = apiResponse.status
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({ error: 'The AI couldn\'t generate a reply. Please try again.' }))
      }

      // Success! Stream or return the response
      setModelHeaders(res, tryModel, provider)
      if (i > 0) {
        console.log(`[dev-api] Fallback succeeded with [${provider}] ${tryModel}`)
      }

      if (stream) {
        res.setHeader('Content-Type',  'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection',    'keep-alive')

        const reader = apiResponse.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(decoder.decode(value, { stream: true }))
        }
        res.end()
      } else {
        const data = await apiResponse.json()
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify(data))
      }
      return // response sent, stop trying
    } catch (error) {
      console.error(`[dev-api] [${provider}] ${tryModel} fetch error:`, error.message)
      if (!isLast) {
        console.warn(`[dev-api] Trying next model...`)
        continue
      }
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify({ error: 'The AI couldn\'t generate a reply. Please try again.' }))
    }
  }
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
        const geminiKey = process.env.GEMINI_API_KEY

        if (path === '/api/chat') {
          return handleChat(req, res, nimKey, groqKey, geminiKey)
        }

        if (path === '/api/title') {
          return handleTitle(req, res, nimKey, groqKey, geminiKey)
        }

        // Unknown /api route — pass through to Vite
        return next()
      })
    },
  }
}
