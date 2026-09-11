/* ═══════════════════════════════════════════════════
   Vercel Serverless Function — /api/search

   Web search handler for AI chat real-time search feature.
   Tries LangSearch (primary) then Serper (fallback).

   Environment variables:
   - LANGSEARCH_API_KEY  (primary, get at https://langsearch.com)
   - SERPER_API_KEY       (fallback, get at https://serper.dev)

   Request body:
   { query: string }

   Response:
   {
     results: [{ title, url, snippet, date? }],
     provider: "langsearch" | "serper" | "none"
   }

   If both providers fail, returns empty results (graceful degradation).
══════════════════════════════════════════════════ */

const LANGSEARCH_URL = 'https://api.langsearch.com/v1/web-search'
const SERPER_URL     = 'https://google.serper.dev/search'

/** Maximum results to return. */
const MAX_RESULTS = 5

/** Timeout for each search provider (ms). */
const SEARCH_TIMEOUT_MS = 5000

/**
 * Normalize LangSearch results to unified format.
 * LangSearch returns: { results: [{ title, url, snippet, date }] }
 */
function normalizeLangSearch(data) {
  if (!data || !Array.isArray(data.results)) return []
  return data.results.slice(0, MAX_RESULTS).map(r => ({
    title:   r.title || '',
    url:     r.url || r.link || '',
    snippet: r.snippet || r.summary || '',
    date:    r.published_date || r.date || undefined,
  }))
}

/**
 * Normalize Serper results to unified format.
 * Serper returns: { organic: [{ title, link, snippet, date }] }
 */
function normalizeSerper(data) {
  if (!data || !Array.isArray(data.organic)) return []
  return data.organic.slice(0, MAX_RESULTS).map(r => ({
    title:   r.title || '',
    url:     r.link || r.url || '',
    snippet: r.snippet || '',
    date:    r.date || undefined,
  }))
}

/**
 * Search via LangSearch API.
 * Returns { results, provider } or throws on failure.
 */
async function searchLangSearch(query, apiKey) {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)

  try {
    const resp = await fetch(LANGSEARCH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        query,
        freshness: 'noLimit',
        count:      MAX_RESULTS,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!resp.ok) {
      console.warn(`[search] LangSearch returned ${resp.status}`)
      await resp.text().catch(() => {})
      throw new Error(`LangSearch HTTP ${resp.status}`)
    }

    const data = await resp.json()
    return { results: normalizeLangSearch(data), provider: 'langsearch' }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Search via Serper API (fallback).
 * Returns { results, provider } or throws on failure.
 */
async function searchSerper(query, apiKey) {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS)

  try {
    const resp = await fetch(SERPER_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY':    apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q:   query,
        num: MAX_RESULTS,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!resp.ok) {
      console.warn(`[search] Serper returned ${resp.status}`)
      await resp.text().catch(() => {})
      throw new Error(`Serper HTTP ${resp.status}`)
    }

    const data = await resp.json()
    return { results: normalizeSerper(data), provider: 'serper' }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Execute web search with fallback.
 * Tries LangSearch first, then Serper.
 * Returns empty results if both fail (graceful degradation).
 */
export async function executeSearch(query) {
  // Truncate query to 200 chars (edge case: overly long queries)
  const trimmedQuery = (query || '').slice(0, 200).trim()
  if (!trimmedQuery) {
    return { results: [], provider: 'none' }
  }

  const langSearchKey = process.env.LANGSEARCH_API_KEY
  const serperKey     = process.env.SERPER_API_KEY

  // Try LangSearch first
  if (langSearchKey) {
    try {
      const result = await searchLangSearch(trimmedQuery, langSearchKey)
      if (result.results.length > 0) return result
      // Empty results — try Serper as fallback
      console.warn('[search] LangSearch returned 0 results, trying Serper...')
    } catch (error) {
      console.warn(`[search] LangSearch failed: ${error.message}, trying Serper...`)
    }
  }

  // Fallback to Serper
  if (serperKey) {
    try {
      const result = await searchSerper(trimmedQuery, serperKey)
      if (result.results.length > 0) return result
      console.warn('[search] Serper returned 0 results')
    } catch (error) {
      console.warn(`[search] Serper failed: ${error.message}`)
    }
  }

  // Both failed or no keys — return empty (graceful degradation)
  return { results: [], provider: 'none' }
}

/**
 * Format search results as context text for injection into the model.
 */
export function formatSearchContext(query, results) {
  if (!results || results.length === 0) {
    return `[Tool Result — web_search]\nQuery: "${query}"\n\nNo results found.\n\n[End of search results]`
  }

  const lines = results.map((r, i) => {
    const dateStr = r.date ? ` — ${r.date}` : ''
    return `${i + 1}. ${r.title}\n   URL: ${r.url}${dateStr}\n   ${r.snippet}`
  })

  return `[Web Search Results — MUST cite source numbers [1], [2], etc. for every claim]\nQuery: "${query}"\n\n${lines.join('\n\n')}\n\n[End of search results — cite sources using [1], [2], etc.]\n\nIMPORTANT: The dates shown next to search results are the publication dates of those articles/pages, NOT today's date. Always use the current date from the system prompt above when referring to "today". Do not echo dates from search results as the current date.`
}

/* ── Vercel serverless handler ── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body || {}

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' })
  }

  const result = await executeSearch(query)
  return res.status(200).json(result)
}
