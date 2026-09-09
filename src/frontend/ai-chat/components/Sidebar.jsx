import { useState, useRef, useEffect } from 'react'
import { Plus, MessageSquare, Trash2, Settings, X, Sparkles, Edit3 } from 'lucide-react'
import { groupSessionsByDate } from '../constants'

/* ═══════════════════════════════════════════════════
   Sidebar — Conversation list, New Chat, Settings entry
   + inline rename (double-click), context menu per item
═══════════════════════════════════════════════════ */

export function Sidebar({
  sessions,
  activeId,
  collapsed,
  onNewChat,
  onSwitch,
  onDelete,
  onRename,
  onClose,
  onOpenSettings,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [renamingId, setRenamingId]   = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef(null)

  const groups = groupSessionsByDate(sessions)

  /* ── Focus rename input when it appears ── */
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  /* ── Start inline rename ── */
  const startRename = (session) => {
    setRenamingId(session.id)
    setRenameValue(session.title)
  }

  /* ── Commit rename ── */
  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  /* ── Cancel rename ── */
  const cancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  /* ── Handle rename keydown ── */
  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  /* ── Delete with confirm ── */
  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (confirmDelete === id) {
      onDelete(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
    }
  }

  return (
    <>
      <aside className={`chat-sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Header */}
        <div className="chat-sidebar-header">
          <a href="/chat" className="chat-sidebar-logo" onClick={(e) => { e.preventDefault(); onNewChat() }}>
            <div className="chat-sidebar-logo-icon">
              <Sparkles size={14} />
            </div>
            CTRL Agent
          </a>
          <button className="chat-sidebar-close" onClick={onClose} title="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* New Chat */}
        <button className="chat-new-chat" onClick={onNewChat}>
          <Plus size={16} />
          New Chat
        </button>

        {/* Conversation list */}
        <div className="chat-conv-list">
          {groups.length === 0 && (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--chat-text-muted)', fontSize: 12 }}>
              No conversations yet
            </div>
          )}
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="chat-conv-group-label">{label}</div>
              {items.map((session) => (
                <div
                  key={session.id}
                  className={`chat-conv-item${session.id === activeId ? ' active' : ''}`}
                  onClick={() => onSwitch(session.id)}
                >
                  <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.5 }} />

                  {renamingId === session.id ? (
                    <input
                      ref={renameInputRef}
                      className="chat-conv-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={commitRename}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="chat-conv-item-title"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startRename(session)
                      }}
                      title="Double-click to rename"
                    >
                      {session.title}
                    </span>
                  )}

                  {/* Action buttons (shown on hover or when confirming delete) */}
                  {renamingId !== session.id && (
                    <div className="chat-conv-actions">
                      <button
                        className="chat-conv-action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          startRename(session)
                        }}
                        title="Rename"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className={`chat-conv-action-btn delete${confirmDelete === session.id ? ' confirming' : ''}`}
                        onClick={(e) => handleDelete(e, session.id)}
                        title={confirmDelete === session.id ? 'Click again to confirm' : 'Delete'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="chat-sidebar-footer">
          <button className="chat-settings-btn" onClick={onOpenSettings}>
            <Settings size={16} />
            Settings
          </button>
        </div>
      </aside>
      <div
        className={`chat-sidebar-backdrop${collapsed ? '' : ' visible'}`}
        onClick={onClose}
      />
    </>
  )
}
