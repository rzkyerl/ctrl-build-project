# AI Chat — NVIDIA NIM + Groq + Gemini Backend

## Structure

```
src/backend/ai-chat/
├── nimClient.js         # Shared client + model list (NIM/Groq/Gemini)
├── serverless-chat.js   # Legacy Vercel serverless function for /api/chat
└── README.md

# Plus, at project root (mirrored for dev vs prod):
api/chat.js             # Vercel production handler
api/title.js            # Vercel title generation handler
vite-dev-api.js         # Local dev plugin (mirrors api/)
```

## Setup

### 1. Environment Variables

Add to `.env` (local) and Vercel project settings. **You can set any
combination of the three — at least one is required.**

```
# Primary (NVIDIA NIM) — recommended
NVIDIA_NIM_API_KEY=nvapi-xxxxxxxxxxxxx

# Fast free fallback
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Last-resort free fallback (Google AI Studio)
# Get a free key at https://aistudio.google.com/apikey
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Vercel Deployment

For the serverless function to work on Vercel, either:

**Option A:** Copy `serverless-chat.js` to `/api/chat.js` at project root:
```bash
cp src/backend/ai-chat/serverless-chat.js api/chat.js
```

**Option B:** Configure `vercel.json` to use the custom path (already has rewrites).

### 3. API Endpoint

```
POST /api/chat
Content-Type: application/json

Body:
{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "gemini/gemini-2.5-flash",   // or "auto", or any listed below
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": true
}

Response (stream=true):
  text/event-stream (SSE)

Response (stream=false):
  application/json
```

### 4. Provider Routing

Model IDs are routed by prefix:

| Prefix              | Provider | Endpoint                                                    |
|---------------------|----------|-------------------------------------------------------------|
| *(none — default)*  | NVIDIA NIM | `integrate.api.nvidia.com/v1/chat/completions`            |
| `groq/<model-id>`   | Groq      | `api.groq.com/openai/v1/chat/completions`                  |
| `gemini/<model-id>` | Google Gemini | `generativelanguage.googleapis.com/v1beta/models/...`   |

In `auto` mode the proxy tries NIM first, then Groq, then Gemini.

### 5. Available Models

#### NVIDIA NIM (`integrate.api.nvidia.com`)
- `openai/gpt-oss-20b`
- `moonshotai/kimi-k3`
- `nvidia/nemotron-3-ultra-550b-a55b`
- `deepseek-ai/deepseek-v4-flash-0731`
- `deepseek-ai/deepseek-v4-pro-0813`

#### Groq (`api.groq.com` — 100% free tier)
- `groq/groq/compound`
- `groq/openai/gpt-oss-20b`
- `groq/openai/gpt-oss-120b`
- `groq/qwen/qwen3.6-27b`
- `groq/groq/compound-mini`

#### Google Gemini (free tier — has stricter RPM limits)
- `gemini/gemini-2.5-pro`
- `gemini/gemini-2.5-flash`
- `gemini/gemini-flash-latest`
- `gemini/gemini-2.5-flash-lite`

## Security Notes

- API keys are **never** exposed to the client
- Serverless function acts as a proxy
- Rate limiting should be added in production
- Consider adding user session limits (even without login)

## Gemini Quirks (vs OpenAI-compatible APIs)

- Gemini uses a different request shape (`contents`/`parts`) — the proxy
  translates between OpenAI format and Gemini format automatically.
- Gemini does **not** have an OpenAI-style `role: "system"` message.
  The proxy hoists system messages into Gemini's `systemInstruction` field.
- Gemini does **not** support the `seed` parameter.
- Gemini's free tier has tight RPM limits (see
  https://ai.google.dev/gemini-api/docs/rate-limits).
