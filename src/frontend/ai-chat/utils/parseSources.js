/**
 * parseSources — Extracts structured source data from any AI message format.
 *
 * Handles all formats models use:
 *   [1] Title — https://url.com        (standard)
 *   1. Title — https://url.com         (numbered list)
 *   1. [Title](https://url.com)        (markdown link)
 *   1. Title - https://url.com         (single dash)
 *   https://url.com                    (bare URL)
 */

const HEADING_RE = new RegExp(
  '(?:^|\\n)' +
  '[ \\t]*(?:\\*{1,2}|#{1,3})?[ \\t]*' +
  '(?:Sources?|Sumber(?:\\s+Referensi)?|Referensi|References?|Daftar\\s+Pustaka)' +
  '[ \\t]*:?[ \\t]*(?:\\*{1,2})?[ \\t]*' +
  '(?:\\n|$)',
  'im'
)

export function parseSources(content) {
  if (!content) return { body: '', sources: [] }

  const match = content.match(HEADING_RE)
  if (!match) return { body: content, sources: [] }

  const splitAt    = content.indexOf(match[0])
  const body       = content.slice(0, splitAt).trimEnd()
  const sourceBlock = content.slice(splitAt + match[0].length)

  const sources = []

  for (const line of sourceBlock.split('\n')) {
    const t = line.trim()
    if (!t) continue
    // Stop at a new heading
    if (/^#{1,4}\s/.test(t) || (/^\*{2}[^*]/.test(t) && !t.includes('http'))) break

    let index = null, title = '', url = ''

    // [N] ... or N. ...
    const prefixMatch = t.match(/^(?:\[(\d+)\]|(\d+)[.)]) ?(.*)$/)
    if (prefixMatch) {
      index = parseInt(prefixMatch[1] || prefixMatch[2], 10)
      const rest = (prefixMatch[3] || '').trim()

      // Markdown link: [Title](URL)
      const mdLink = rest.match(/^\[(.+?)\]\((https?:\/\/[^\s)]+)\)/)
      if (mdLink) { title = mdLink[1].trim(); url = mdLink[2].trim() }
      else {
        // Title — URL or Title - URL
        const dashSplit = rest.match(/^(.*?)\s+[-–—]\s+(https?:\/\/\S+)\s*$/)
        if (dashSplit) { title = dashSplit[1].trim(); url = dashSplit[2].trim() }
        else {
          // URL only
          const urlMatch = rest.match(/(https?:\/\/\S+)/)
          if (urlMatch) { url = urlMatch[1]; title = rest.replace(urlMatch[0], '').replace(/[-–—\s]+$/, '').trim() }
        }
      }
    }

    if (!url || index === null) continue

    let domain = '', favicon = ''
    try {
      domain  = new URL(url).hostname.replace(/^www\./, '')
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch { domain = url }

    title = title.replace(/https?:\/\/\S+/g, '').replace(/[-–—\s]+$/, '').trim()
    if (!title) title = domain

    if (!sources.find(s => s.index === index)) {
      sources.push({ index, title, url, domain, favicon })
    }
  }

  return { body, sources }
}
