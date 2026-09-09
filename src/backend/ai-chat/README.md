# AI Chat — NVIDIA NIM Backend

## Structure

```
src/backend/ai-chat/
├── nimClient.js        # NIM API client (for direct frontend use or testing)
├── serverless-chat.js  # Vercel serverless function for /api/chat
└── README.md
```

## Setup

### 1. Environment Variable

Add to `.env` (local) and Vercel project settings:

```
NVIDIA_NIM_API_KEY=nvapi-xxxxxxxxxxxxx
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
  "model": "moonshotai/kimi-k3",
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": true
}

Response (stream=true):
  text/event-stream (SSE)

Response (stream=false):
  application/json
```

## Available Models (Free Endpoints)

| Model ID | Label | Vendor | Tags |
|----------|-------|--------|------|
| moonshotai/kimi-k3 | Kimi K3 | Moonshot AI | Balanced, Long context |
| deepseek-ai/deepseek-v4-flash-0731 | DeepSeek V4 Flash | DeepSeek | Fast |
| deepseek-ai/deepseek-v4-pro-0813 | DeepSeek V4 Pro | DeepSeek | Reasoning, Balanced |

## Security Notes

- API key is **never** exposed to the client
- Serverless function acts as a proxy
- Rate limiting should be added in production
- Consider adding user session limits (even without login)
