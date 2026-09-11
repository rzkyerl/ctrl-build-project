/* ═══════════════════════════════════════════════════
   AI Chat API Client — NVIDIA NIM + Groq + Google Gemini
═══════════════════════════════════════════════════

   This module handles communication with the AI backend
   via the /api/chat proxy (Vite dev plugin or Vercel
   serverless function).

   Supported providers:
   - NVIDIA NIM     (integrate.api.nvidia.com)               — primary
   - Groq           (api.groq.com)                           — fast free fallback
   - Google Gemini  (generativelanguage.googleapis.com)      — last-resort free fallback

   In "auto" mode, NIM models are tried first; if all fail,
   Groq models are tried next, and finally Gemini.

   Model ID prefixes are used by the proxy to route requests:
     - "groq/<model>"    → Groq
     - "gemini/<model>"  → Google Gemini
     - anything else     → NIM

   Endpoint: /api/chat (proxy)
   Format:   OpenAI-compatible chat completions (SSE streaming)
═══════════════════════════════════════════════════ */

/**
 * Special model ID that enables auto-fallback.
 * When this is selected, the proxy tries each model in
 * AUTO_FALLBACK_ORDER and uses the first one that responds
 * successfully (skipping 429 / 5xx responses).
 */
export const AUTO_MODEL_ID = 'auto'

/**
 * Fallback order used when model === 'auto'.
 * NIM models are tried first; if all fail (429/5xx),
 * Groq models are tried as fallback, and finally Gemini.
 *
 * Model ID prefixes route the request to the right provider:
 *   - "groq/<id>"    → Groq
 *   - "gemini/<id>"  → Google Gemini
 *   - anything else  → NIM
 */
export const AUTO_FALLBACK_ORDER = [
  // --- NIM models (primary) ---
  'openai/gpt-oss-20b',
  'moonshotai/kimi-k3',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'deepseek-ai/deepseek-v4-flash-0731',
  'deepseek-ai/deepseek-v4-pro-0813',
  // --- Groq models (fallback) ---
  'groq/groq/compound',
  'groq/openai/gpt-oss-20b',
  'groq/openai/gpt-oss-120b',
  'groq/qwen/qwen3.6-27b',
  'groq/groq/compound-mini',
  // --- Gemini models (last-resort free fallback) ---
  'gemini/gemini-3.6-flash',
  'gemini/gemini-3.5-flash-lite',
  'gemini/gemini-3.1-pro-preview',
  'gemini/gemini-flash-latest',
]

/**
 * Available AI models (NIM + Groq + Gemini)
 *
 * Routing rules (handled by the proxy based on ID prefix):
 *   - bare ID or "openai/..."        → NIM   (integrate.api.nvidia.com)
 *   - "groq/<id>"                    → Groq  (api.groq.com)
 *   - "gemini/<id>"                  → Google Gemini (generativelanguage.googleapis.com)
 *
 * Get a free Gemini API key at: https://aistudio.google.com/apikey
 */
export const NIM_MODELS = [
  {
    id:          AUTO_MODEL_ID,
    label:       'Auto',
    vendor:      'System',
    description: 'Automatically picks the best available model',
    tags:        ['Smart'],
  },
  {
    id:          'openai/gpt-oss-20b',
    label:       'Balanced',
    vendor:      'NIM',
    description: 'Good all-around model for everyday tasks',
    tags:        ['Versatile'],
  },
  {
    id:          'deepseek-ai/deepseek-v4-pro-0813',
    label:       'Advanced',
    vendor:      'NIM',
    description: 'Deeper reasoning for complex questions',
    tags:        ['Reasoning'],
  },
  {
    id:          'deepseek-ai/deepseek-v4-flash-0731',
    label:       'Fast',
    vendor:      'NIM',
    description: 'Quick responses for simple queries',
    tags:        ['Quick'],
  },
  {
    id:          'moonshotai/kimi-k3',
    label:       'Long Context',
    vendor:      'NIM',
    description: 'Handles very long conversations & documents',
    tags:        ['Extended'],
  },
  {
    id:          'nvidia/nemotron-3-ultra-550b-a55b',
    label:       'Pro',
    vendor:      'NIM',
    description: 'Most capable model for difficult tasks',
    tags:        ['Powerful'],
  },
  // --- Groq models (100% free, fast LPU inference) ---
  {
    id:          'groq/groq/compound',
    label:       'Quick (Groq)',
    vendor:      'Groq',
    description: 'Ultra-fast free inference, great for quick chats',
    tags:        ['Free', 'Fast'],
  },
  {
    id:          'groq/openai/gpt-oss-120b',
    label:       'Think (Groq)',
    vendor:      'Groq',
    description: 'Large free model for deeper reasoning',
    tags:        ['Free', 'Reasoning'],
  },
  {
    id:          'groq/qwen/qwen3.6-27b',
    label:       'Multilingual (Groq)',
    vendor:      'Groq',
    description: 'Strong multilingual support, 131K context',
    tags:        ['Free', 'Multilingual'],
  },
  {
    id:          'groq/groq/compound-mini',
    label:       'Lite (Groq)',
    vendor:      'Groq',
    description: 'Lightning-fast free model for simple tasks',
    tags:        ['Free', 'Lite'],
  },
  // --- Gemini models (Google's Generative AI, free tier) ---
  // NOTE: Gemini 2.5 models have been deprecated. Using Gemini 3.x instead.
  {
    id:          'gemini/gemini-3.1-pro-preview',
    label:       'Pro (Gemini)',
    vendor:      'Gemini',
    description: 'Most capable free Gemini model for complex tasks',
    tags:        ['Free', 'Multimodal', 'Reasoning'],
  },
  {
    id:          'gemini/gemini-3.6-flash',
    label:       'Fast (Gemini)',
    vendor:      'Gemini',
    description: 'Balanced Gemini model — speed and quality',
    tags:        ['Free', 'Multimodal', 'Fast'],
  },
  {
    id:          'gemini/gemini-flash-latest',
    label:       'Latest Flash (Gemini)',
    vendor:      'Gemini',
    description: 'Latest stable Gemini Flash release',
    tags:        ['Free', 'Multimodal'],
  },
  {
    id:          'gemini/gemini-3.5-flash-lite',
    label:       'Lite (Gemini)',
    vendor:      'Gemini',
    description: 'Fastest, lowest-cost Gemini model for simple tasks',
    tags:        ['Free', 'Multimodal', 'Lite'],
  },
]

export const DEFAULT_MODEL = NIM_MODELS[0]

/**
 * Send a chat completion request with streaming.
 *
 * Sends to /api/chat which routes to NIM (default),
 * Groq (model IDs prefixed with "groq/"), or Google
 * Gemini (model IDs prefixed with "gemini/").
 *
 * @param {Object}   params
 * @param {string}   params.apiKey      — unused (kept for API parity)
 * @param {Array}    params.messages    — [{role, content}]
 * @param {string}   params.model       — model ID (default: 'auto')
 * @param {number}   params.maxTokens   — max output tokens (default: 1024)
 * @param {number}   params.temperature — 0–1 (default: 0.7)
 * @param {AbortSignal} params.signal   — for cancellation
 * @param {Function} params.onToken     — callback(chunk) for each token
 * @returns {Promise<string>} full response text
 */
export async function streamChatCompletion({
  messages,
  model       = DEFAULT_MODEL.id,
  maxTokens   = 1024,
  temperature = 0.7,
  seed        = 0,
  signal,
  onToken,
  onModelUsed,
  onSearchStart,
  onSearchDone,
}) {
  const url = '/api/chat'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'text/event-stream',
    },
    body: JSON.stringify({
      messages,
      model,
      max_tokens:  maxTokens,
      temperature,
      seed,
      stream:      true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`AI API error ${response.status}: ${errorText}`)
  }

  // Read which model actually served the response (for Auto mode indicator)
  const usedModel = response.headers.get('X-Used-Model')
  if (usedModel) {
    onModelUsed?.(usedModel)
  }

  const reader    = response.body.getReader()
  const decoder   = new TextDecoder()
  let buffer      = ''
  let fullText    = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer      = lines.pop() || '' // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue

      try {
        const json = JSON.parse(data)

        // ── Check for search indicator events (type: "searching" / "search_done")
        // These are custom SSE events sent by the backend before the
        // actual chat stream begins. We intercept them and call the
        // appropriate callbacks, then skip (don't treat as token).
        if (json.type === 'searching' && json.query) {
          onSearchStart?.(json.query)
          continue
        }
        if (json.type === 'search_done') {
          onSearchDone?.(json.resultsCount || 0)
          continue
        }
        if (json.type === 'error' || json.error) {
          // Backend encountered an error mid-stream
          const errMsg = json.message || json.error || 'Search failed'
          throw new Error(errMsg)
        }

        const delta  = json?.choices?.[0]?.delta
        if (!delta) continue

        // Some NIM models (e.g. Kimi K3) stream reasoning in
        // `reasoning_content` while `content` stays null.
        // We only stream `content` to the UI — reasoning is shown
        // as a brief "Thinking" overlay, not as message content.
        const token = delta.content
        if (token) {
          fullText += token
          onToken?.(token)
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }

  return fullText
}

/**
 * Build message payload for NIM API.
 * Converts internal message format to NIM format.
 * Supports text content and image_url (for vision models).
 *
 * @param {Array} messages — internal format [{id, role, content, files?}]
 * @returns {Array} NIM format [{role, content}]
 */
export function buildNimMessages(messages) {
  return messages.map((msg) => {
    // If message has files, build multipart content
    if (msg.files && msg.files.length > 0) {
      const content = []

      // Add text
      if (msg.content) {
        content.push({ type: 'text', text: msg.content })
      }

      for (const file of msg.files) {
        // Images: send as image_url (for vision-capable models)
        if (file.type === 'image' && file.dataUrl) {
          content.push({
            type:      'image_url',
            image_url: { url: file.dataUrl },
          })
        }
        // Text-based files (txt, code, csv, json, etc.): inject content as text context
        // PDFs: FileReader can't extract text, so extractedText will be empty or error
        //       - if we got text, inject it; if not, just note the file name
        if (file.type !== 'image') {
          if (file.extractedText && !file.extractedText.startsWith('[Could not')) {
            content.push({
              type: 'text',
              text: `--- File: ${file.name} ---\n\n${file.extractedText}\n\n--- End of ${file.name} ---`,
            })
          } else {
            // PDF or unreadable file — just note it
            content.push({
              type: 'text',
              text: `[Attached file: ${file.name} (${file.size} bytes) — content could not be extracted]`,
            })
          }
        }
      }

      return { role: msg.role, content }
    }

    // Plain text message
    return { role: msg.role, content: msg.content }
  })
}
