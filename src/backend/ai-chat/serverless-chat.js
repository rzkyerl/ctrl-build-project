/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/chat
═══════════════════════════════════════════════════

   This endpoint proxies chat completion requests to the
   NVIDIA NIM API, keeping the API key secure on the server.

   Environment variable needed:
   - NVIDIA_NIM_API_KEY

   Deploy as a Vercel serverless function at /api/chat

   Request body:
   {
     messages: [{role, content}],
     model?:   string,   // default: meta/llama-3.3-70b-instruct
     max_tokens?:   number,   // default: 1024
     temperature?:  number,   // default: 0.7
     stream?:       boolean,  // default: true
   }

   Response:
   - If stream=true: text/event-stream (SSE)
   - If stream=false: application/json
═══════════════════════════════════════════════════ */

// NOTE: This file is placed in src/backend/ai-chat/ for organization.
// For Vercel deployment, copy this to /api/chat.js at project root,
// or configure vercel.json to use this path.

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'NIM API key not configured' })
  }

  const {
    messages,
    model       = 'moonshotai/kimi-k3',
    max_tokens  = 1024,
    temperature = 0.7,
    seed        = 0,
    stream      = true,
  } = req.body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  try {
    const nimResponse = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept':        stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        max_tokens,
        temperature,
        seed,
        stream,
      }),
    })

    if (!nimResponse.ok) {
      const errorText = await nimResponse.text().catch(() => 'Unknown error')
      return res.status(nimResponse.status).json({
        error: 'NIM API error',
        detail: errorText,
      })
    }

    if (stream) {
      // Pipe SSE stream back to client
      res.setHeader('Content-Type',  'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection',    'keep-alive')

      const reader  = nimResponse.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
    } else {
      const data = await nimResponse.json()
      return res.status(200).json(data)
    }
  } catch (error) {
    console.error('NIM API error:', error)
    return res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message,
    })
  }
}
