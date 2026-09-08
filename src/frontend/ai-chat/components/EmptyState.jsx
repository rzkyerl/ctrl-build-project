import { Sparkles } from 'lucide-react'
import { SUGGESTIONS } from '../constants'

/* ═══════════════════════════════════════════════════
   EmptyState — Welcome screen shown when no messages
═══════════════════════════════════════════════════ */

export function EmptyState({ onSuggestionClick }) {
  return (
    <div className="chat-empty">
      <div className="chat-empty-icon">
        <Sparkles size={24} />
      </div>
      <h2 className="chat-empty-title">How can I help you?</h2>
      <p className="chat-empty-subtitle">
        Ask anything, upload a file, or start a conversation.
      </p>
      <div className="chat-empty-suggestions">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            className="chat-suggestion-chip"
            onClick={() => onSuggestionClick?.(s.prompt)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
