import logoUrl from '../../../assets/images/nyx-agent/logo-agent-chat.png'

/* ═══════════════════════════════════════════════════
   EmptyState — Welcome screen shown when no messages
═══════════════════════════════════════════════════ */

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 15) return 'Good Afternoon'
  if (hour >= 15 && hour < 19) return 'Good Evening'
  return 'Good Night'
}

export function EmptyState() {
  const greeting = getGreeting()

  return (
    <div className="chat-empty">
      <div className="chat-empty-logo">
        <img src={logoUrl} alt="Nyx Agent" className="chat-empty-logo-img" />
      </div>
      <h2 className="chat-empty-title">{greeting} and Welcome to Nyx Agent!</h2>
      <p className="chat-empty-subtitle">
        Ask anything or upload a file, Nyx Agent is ready.
      </p>
    </div>
  )
}
