/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/chat

   Proxies chat completion requests to NVIDIA NIM API
   (primary) and Groq API (fallback), keeping API keys
   secure on the server.

   Environment variables:
   - NVIDIA_NIM_API_KEY  (primary)
   - GROQ_API_KEY         (fallback)

   In "auto" mode, NIM models are tried first; if all NIM
   models fail (429/5xx), Groq models are tried as fallback.

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
═══════════════════════════════════════════════════ */

const NIM_URL  = 'https://integrate.api.nvidia.com/v1/chat/completions'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/** Fallback order for auto mode: NIM first, then Groq */
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
]

function getProviderUrl(provider) {
  return provider === 'groq' ? GROQ_URL : NIM_URL
}

function detectProvider(modelId) {
  if (modelId.startsWith('groq/')) {
    return { provider: 'groq', model: modelId.slice(5) }
  }
  return { provider: 'nim', model: modelId }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nimKey  = process.env.NVIDIA_NIM_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  if (!nimKey && !groqKey) {
    return res.status(500).json({ error: 'No API keys configured. Set NVIDIA_NIM_API_KEY and/or GROQ_API_KEY' })
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
- Keep explanations beginner-friendly unless asked otherwise`
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
    if (m.provider === 'nim')  return !!nimKey
    if (m.provider === 'groq') return !!groqKey
    return false
  })

  if (modelsToTry.length === 0) {
    return res.status(503).json({ error: 'No available providers. Check your API keys.' })
  }

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast   = i === modelsToTry.length - 1
    const apiKey   = provider === 'groq' ? groqKey : nimKey
    const apiUrl   = getProviderUrl(provider)

    // Groq doesn't support the `seed` parameter
    const reqBody = provider === 'groq'
      ? { messages: finalMessages, model: tryModel, max_tokens, temperature, stream }
      : { messages: finalMessages, model: tryModel, max_tokens, temperature, seed, stream }

    try {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept':        stream ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(reqBody),
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
