import { useRef, useEffect, useCallback } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'

/* ── Register only common languages to keep bundle small ── */
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

/* ── Configure marked ── */
marked.setOptions({
  breaks: true,
  gfm: true,
})

/* ── Custom renderer: highlight code blocks ── */
const renderer = new marked.Renderer()

renderer.code = function (code, language) {
  // marked v18 passes ({ text, lang }) object or (code, lang) string
  let codeText, lang
  if (typeof code === 'object') {
    codeText = code.text || ''
    lang = code.lang || ''
  } else {
    codeText = code || ''
    lang = language || ''
  }

  // Decode HTML entities that marked may have added
  codeText = codeText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  let highlighted
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(codeText, { language: lang }).value
    } catch {
      highlighted = codeText
    }
  } else {
    // Auto-detect
    try {
      highlighted = hljs.highlightAuto(codeText).value
    } catch {
      highlighted = codeText
    }
  }

  const langLabel = lang || 'text'
  const escaped = codeText.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `<div class="md-code-block">
    <div class="md-code-header">
      <span class="md-code-lang">${langLabel}</span>
      <button class="md-code-copy" data-code="${escaped}" title="Copy code">Copy</button>
    </div>
    <pre><code class="hljs language-${langLabel}">${highlighted}</code></pre>
  </div>`
}

marked.use({ renderer })

/* ═══════════════════════════════════════════════════
   MarkdownRenderer — Renders markdown content as
   sanitized HTML with syntax-highlighted code blocks
═══════════════════════════════════════════════════ */

export function MarkdownRenderer({ content }) {
  const containerRef = useRef(null)

  const html = useCallback((md) => {
    if (!md) return ''
    try {
      const raw = marked.parse(md, { async: false })
      return DOMPurify.sanitize(raw, {
        ADD_ATTR: ['data-code', 'target', 'rel'],
      })
    } catch {
      return DOMPurify.sanitize(md)
    }
  }, [])

  /* ── Attach copy handlers after render ── */
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const buttons = root.querySelectorAll('.md-code-copy')
    const handlers = []

    buttons.forEach((btn) => {
      const handler = async () => {
        const raw = btn.getAttribute('data-code') || ''
        const decoded = raw
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')

        try {
          await navigator.clipboard.writeText(decoded)
          const original = btn.textContent
          btn.textContent = 'Copied!'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = original
            btn.classList.remove('copied')
          }, 2000)
        } catch {
          // Fallback: select + execCommand
          const ta = document.createElement('textarea')
          ta.value = decoded
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          btn.textContent = 'Copied!'
          setTimeout(() => { btn.textContent = 'Copy' }, 2000)
        }
      }
      btn.addEventListener('click', handler)
      handlers.push({ btn, handler })
    })

    /* ── Make links open in new tab ── */
    const links = root.querySelectorAll('a[href]')
    links.forEach((a) => {
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
    })

    return () => {
      handlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler))
    }
  }, [content])

  return (
    <div
      ref={containerRef}
      className="md-body"
      dangerouslySetInnerHTML={{ __html: html(content) }}
    />
  )
}
