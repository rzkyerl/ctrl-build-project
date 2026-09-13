import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

/* ═══════════════════════════════════════════════════
   SourcesPanel — Google AI Mode–style source cards
   rendered below an AI response when the message
   includes a **Sources:** block.
═══════════════════════════════════════════════════ */

export function SourcesPanel({ sources }) {
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  // Show first 3 cards collapsed, reveal the rest on expand
  const INITIAL_VISIBLE = 3
  const hasMore         = sources.length > INITIAL_VISIBLE
  const visible         = expanded ? sources : sources.slice(0, INITIAL_VISIBLE)

  return (
    <div className="md-sources-panel" role="complementary" aria-label="Sources">
      {/* Header row */}
      <div className="md-sources-header">
        <span className="md-sources-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Source cards grid */}
      <div className="md-sources-grid">
        {visible.map((src) => (
          <SourceCard key={src.index} source={src} />
        ))}
      </div>

      {/* Show more / less toggle */}
      {hasMore && (
        <button
          className="md-sources-toggle"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              {sources.length - INITIAL_VISIBLE} more source{sources.length - INITIAL_VISIBLE !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  )
}

/* ── Individual source card ── */
function SourceCard({ source }) {
  const { index, title, url, domain, favicon } = source
  const [imgError, setImgError] = useState(false)

  return (
    <a
      className="md-source-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-source-index={index}
      aria-label={`Source ${index}: ${title} — ${domain}`}
    >
      {/* Index badge */}
      <span className="md-source-index" aria-hidden="true">{index}</span>

      {/* Card body */}
      <div className="md-source-body">
        <span className="md-source-title">{title}</span>
        <span className="md-source-domain">
          {/* Favicon */}
          {favicon && !imgError ? (
            <img
              src={favicon}
              alt=""
              className="md-source-favicon"
              width="12"
              height="12"
              onError={() => setImgError(true)}
              aria-hidden="true"
            />
          ) : (
            <span className="md-source-favicon-fallback" aria-hidden="true">
              {domain.charAt(0).toUpperCase()}
            </span>
          )}
          {domain}
        </span>
      </div>

      {/* External link icon */}
      <ExternalLink size={11} className="md-source-ext-icon" aria-hidden="true" />
    </a>
  )
}
