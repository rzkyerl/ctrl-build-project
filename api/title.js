/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/title

   Generates a short conversation title from the first
   user message. Tries NVIDIA NIM first, falls back to
   Groq if NIM is unavailable.

   Environment variables:
   - NVIDIA_NIM_API_KEY  (primary)
   - GROQ_API_KEY         (fallback)

   Request body:
   { message: string }

   Response:
   { title: string }
═══════════════════════════════════════════════════ */

const NIM_URL  = 'https://integrate.api.nvidia.com/v1/chat/completions'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/** Title fallback models: NIM first, Groq fallback */
const TITLE_FALLBACK_MODELS = [
  { model: 'openai/gpt-oss-20b',                   provider: 'nim' },
  { model: 'deepseek-ai/deepseek-v4-flash-0731',   provider: 'nim' },
  { model: 'groq/compound-mini',                    provider: 'groq' },
  { model: 'openai/gpt-oss-20b',                    provider: 'groq' },
]

function getProviderUrl(provider) {
  return provider === 'groq' ? GROQ_URL : NIM_URL
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nimKey  = process.env.NVIDIA_NIM_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  if (!nimKey && !groqKey) {
    return res.status(500).json({ error: 'No API keys configured' })
  }

  const { message } = req.body || {}
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Filter out providers without API keys
  const modelsToTry = TITLE_FALLBACK_MODELS.filter(m => {
    if (m.provider === 'nim')  return !!nimKey
    if (m.provider === 'groq') return !!groqKey
    return false
  })

  if (modelsToTry.length === 0) {
    return res.status(200).json({ title: message.slice(0, 40) + '...' })
  }

  const titleMessages = [
    {
      role: 'system',
      content: 'Generate a very short title (2-6 words, no quotes, no punctuation at the end) that summarizes the user\'s message. Respond with only the title text, nothing else.',
    },
    { role: 'user', content: message.slice(0, 500) },
  ]

  for (let i = 0; i < modelsToTry.length; i++) {
    const { model: tryModel, provider } = modelsToTry[i]
    const isLast   = i === modelsToTry.length - 1
    const apiKey   = provider === 'groq' ? groqKey : nimKey
    const apiUrl   = getProviderUrl(provider)

    try {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: titleMessages,
          model:       tryModel,
          max_tokens:  30,
          temperature: 0.3,
          stream:      false,
        }),
      })

      if (!apiResponse.ok) {
        console.warn(`Title [${provider}] ${tryModel} returned ${apiResponse.status}`)
        await apiResponse.text().catch(() => {})
        if (!isLast) continue
        return res.status(200).json({ title: message.slice(0, 40) + '...' })
      }

      const data = await apiResponse.json()
      const title = data?.choices?.[0]?.message?.content?.trim() || message.slice(0, 40) + '...'
      return res.status(200).json({ title: title.slice(0, 60) })
    } catch (error) {
      console.error(`Title [${provider}] ${tryModel} error:`, error.message)
      if (!isLast) continue
      return res.status(200).json({ title: message.slice(0, 40) + '...' })
    }
  }

  // All models exhausted
  return res.status(200).json({ title: message.slice(0, 40) + '...' })
}
