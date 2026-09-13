import { useRef, useEffect, useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('jsx', javascript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('java', java)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

marked.setOptions({ breaks: true, gfm: true })

/* ── Code block renderer ── */
const renderer = new marked.Renderer()
renderer.code = function (code, language) {
  let codeText = '', lang = ''
  if (typeof code === 'object') { codeText = code.text || ''; lang = code.lang || '' }
  else { codeText = code || ''; lang = language || '' }

  codeText = codeText
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

  let highlighted = codeText
  if (lang && hljs.getLanguage(lang)) {
    try { highlighted = hljs.highlight(codeText, { language: lang }).value } catch { /* */ }
  } else {
    try { highlighted = hljs.highlightAuto(codeText).value } catch { /* */ }
  }

  const langLabel = lang || 'text'
  const escaped = codeText.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div class="md-code-block"><div class="md-code-header"><span class="md-code-lang">${langLabel}</span><button class="md-code-copy" data-code="${escaped}">Copy</button></div><pre><code class="hljs language-${langLabel}">${highlighted}</code></pre></div>`
}
marked.use({ renderer })

/* ══════════════════════════════════════════════════════
   CITATION INJECTION — two-pass approach:

   Pass 1: Replace [N] bracketed citations (standard format)
   Pass 2: Replace bare URLs in text that match a known source

   Both replaced with Google AI–style pills: favicon + domain.
   Sources come from the SSE `sources` event so we don't rely
   on AI formatting at all.
══════════════════════════════════════════════════════ */

function buildSourceMap(sources) {
  const byIndex = new Map()
  const byUrl   = new Map()
  const byDomain = new Map()

  if (!Array.isArray(sources)) return { byIndex, byUrl, byDomain }

  for (const s of sources) {
    if (!s) continue
    const idx = Number(s.index)
    if (!isNaN(idx)) byIndex.set(idx, s)
    if (s.url)    byUrl.set(s.url.replace(/\/$/, ''), s)
    if (s.domain) byDomain.set(s.domain, s)
  }
  return { byIndex, byUrl, byDomain }
}

function makePill(src, citeNum) {
  const letter  = (src.domain || src.url || '?').charAt(0).toUpperCase()
  const domain  = (src.domain || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const url     = (src.url || '').replace(/"/g, '%22')
  const favicon = (src.favicon || `https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`).replace(/"/g, '%22')
  const citeAttr = citeNum != null ? ` data-cite="${citeNum}"` : ''
  return `<a class="md-cite" href="${url}" target="_blank" rel="noopener noreferrer"${citeAttr} data-favicon="${favicon}"><span class="md-cite-icon">${letter}</span><span class="md-cite-domain">${domain}</span></a>`
}

function injectCitations(html, sourceMap) {
  const { byIndex, byUrl, byDomain } = sourceMap
  const CODE_RE = /(<div class="md-code-block">[\s\S]*?<\/div>)/g
  const parts   = html.split(CODE_RE)

  return parts.map((part, i) => {
    if (i % 2 === 1) return part  // inside code block — skip

    // ── Pass 1: replace [N] patterns ──────────────────────
    let out = part.replace(/\[(\d+)\]/g, (_, num) => {
      const n   = parseInt(num, 10)
      const src = byIndex.get(n)
      return src ? makePill(src, n) : `<span class="md-cite md-cite-plain">${n}</span>`
    })

    // ── Pass 2: replace bare/linked URLs that match sources ──
    // Target: raw URLs in text like  https://example.com/page
    // or markdown-style links already converted to <a href="URL">TEXT</a>
    // We only replace when the URL matches one of our known sources.
    if (byUrl.size > 0 || byDomain.size > 0) {
      // Replace <a href="URL">...</a> where URL matches a source
      out = out.replace(/<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, (match, href, text) => {
        const normalised = href.replace(/\/$/, '')
        let src = byUrl.get(normalised)
        if (!src) {
          try {
            const d = new URL(href).hostname.replace(/^www\./, '')
            src = byDomain.get(d)
          } catch { /* */ }
        }
        // If this href is already a .md-cite we built, skip
        if (match.includes('class="md-cite"')) return match
        return src ? makePill(src, null) : match
      })

      // Replace bare https:// URLs in text (not already inside href="...")
      out = out.replace(/(?<![="'(])https?:\/\/[^\s<>"')]+/g, (url) => {
        const normalised = url.replace(/\/$/, '')
        let src = byUrl.get(normalised)
        if (!src) {
          try {
            const d = new URL(url).hostname.replace(/^www\./, '')
            src = byDomain.get(d)
          } catch { /* */ }
        }
        return src ? makePill(src, null) : url
      })
    }

    return out
  }).join('')
}

/* ══════════════════════════════════════════════════════
   Strip semua format "Sumber/Sources" block dari markdown.
   Handles berbagai format yang model berbeda gunakan:
   - "Sumber:" / "**Sumber:**" / "## Sumber"
   - Di awal baris, setelah newline
   - Dengan atau tanpa bold/heading markers
══════════════════════════════════════════════════════ */
const SOURCES_BLOCK_RE = new RegExp(
  // Match dari "Sumber/Sources" heading sampai akhir string
  // Supports: Sumber:, **Sumber:**, ## Sumber, Sumber Referensi:, References:, etc.
  '(?:^|\\n)' +
  '[ \\t]*(?:\\*{1,2}|#{1,3})?[ \\t]*' +
  '(?:Sources?|Sumber(?:\\s+Referensi)?|Referensi|References?|Daftar\\s+Pustaka)' +
  '[ \\t]*:?[ \\t]*(?:\\*{1,2})?[ \\t]*' +
  '(?:\\n|$)' +
  '[\\s\\S]*$',
  'im'
)

function stripSourcesBlock(text) {
  return text.replace(SOURCES_BLOCK_RE, '').trimEnd()
}

/* ══════════════════════════════════════════════════════
   MarkdownRenderer
══════════════════════════════════════════════════════ */
export function MarkdownRenderer({ content, isStreaming = false, sources = [] }) {
  const containerRef = useRef(null)

  const sourceMap = useMemo(() => buildSourceMap(sources), [sources])

  const renderedHtml = useMemo(() => {
    const md = content || ''
    if (!md) return ''
    try {
      // Always strip "Sumber:" / "Sources:" block — regardless of whether
      // SSE sources arrived. The SourcesPanel renders them separately.
      const cleaned = stripSourcesBlock(md)

      const raw       = marked.parse(cleaned, { async: false })
      const withCites = injectCitations(raw, sourceMap)

      const sanitized = DOMPurify.sanitize(withCites, {
        ADD_ATTR:        ['data-code', 'data-cite', 'data-favicon', 'target', 'rel'],
        ADD_TAGS:        ['span'],
        ALLOW_DATA_ATTR: true,
      })

      if (!isStreaming) return sanitized
      const CURSOR = '<span class="chat-stream-cursor"></span>'
      const m = sanitized.match(/([\s\S]*)(<\/(?:p|li|h[1-6]|td|blockquote)>)\s*$/)
      return m ? m[1] + CURSOR + m[2] : sanitized + CURSOR
    } catch {
      return DOMPurify.sanitize(content || '')
    }
  }, [content, sources, sourceMap, isStreaming])

  /* Post-render: code copy + favicon loading */
  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const handlers = []

    root.querySelectorAll('.md-code-copy').forEach((btn) => {
      const handler = async () => {
        const raw = (btn.getAttribute('data-code') || '')
          .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        try { await navigator.clipboard.writeText(raw) } catch {
          const ta = document.createElement('textarea')
          ta.value = raw; document.body.appendChild(ta); ta.select()
          document.execCommand('copy'); document.body.removeChild(ta)
        }
        const orig = btn.textContent
        btn.textContent = 'Copied!'; btn.classList.add('copied')
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied') }, 2000)
      }
      btn.addEventListener('click', handler)
      handlers.push({ el: btn, handler })
    })

    // Load favicons via JS (DOMPurify strips onerror)
    root.querySelectorAll('.md-cite[data-favicon]').forEach((chip) => {
      const url    = chip.getAttribute('data-favicon')
      const iconEl = chip.querySelector('.md-cite-icon')
      if (!iconEl || !url) return
      const img = new Image()
      img.onload = () => {
        iconEl.style.backgroundImage = `url(${CSS.escape ? url : url})`
        iconEl.classList.add('has-favicon')
      }
      img.onerror = () => iconEl.classList.add('letter-fallback')
      img.src = url
    })

    // Open plain links in new tab
    root.querySelectorAll('a[href]:not(.md-cite)').forEach((a) => {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    })

    return () => handlers.forEach(({ el, handler }) => el.removeEventListener('click', handler))
  }, [renderedHtml])

  return (
    <div
      ref={containerRef}
      className="md-body"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  )
}
