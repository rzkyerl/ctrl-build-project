import { useState, useCallback, useRef, useEffect } from 'react'
import { Menu, Sparkles, MoreHorizontal, Check, Edit3, Trash2, Download, Copy, RefreshCw } from 'lucide-react'
import { Sidebar }         from './components/Sidebar'
import { ChatArea }        from './components/ChatArea'
import { Composer }        from './components/Composer'
import { useChatSession }  from './hooks/useChatSession'
import { NIM_MODELS, streamChatCompletion, buildNimMessages } from '../../backend/ai-chat/nimClient'
import './ai-chat.css'

/* ═══════════════════════════════════════════════════
   AiChatPage — Root page for AI Chat feature
   Route: /chat and /chat/:sessionId
═══════════════════════════════════════════════════ */

export default function AiChatPage() {
  const {
    sessions,
    activeId,
    activeSession,
    settings,
    isGenerating,
    setIsGenerating,
    abortRef,
    createSession,
    deleteSession,
    renameSession,
    switchSession,
    addMessage,
    updateMessage,
    clearAll,
    updateSettings,
  } = useChatSession()

  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError]               = useState(null)
  const [convMenuOpen, setConvMenuOpen]   = useState(false)
  const [renaming, setRenaming]           = useState(false)
  const [renameValue, setRenameValue]     = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [usedModel, setUsedModel]         = useState(null)
  const convMenuRef  = useRef(null)
  const renameInputRef = useRef(null)

  const messages = activeSession?.messages || []

  // Resolve selected model object from settings
  const selectedModelId = settings.selectedModel || NIM_MODELS[0].id
  const selectedModel    = NIM_MODELS.find(m => m.id === selectedModelId) || NIM_MODELS[0]

  // Keep a ref to sessions for use inside async callbacks
  const sessionsRef = useRef(sessions)
  useEffect(() => { sessionsRef.current = sessions }, [sessions])

  /* ── Generate conversation title via AI ── */
  const generateTitle = useCallback(async (userMessage) => {
    try {
      const resp = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })
      if (!resp.ok) return null
      const data = await resp.json()
      return data.title || null
    } catch {
      return null
    }
  }, [])

  /* ── Select model ── */
  const handleSelectModel = useCallback((modelId) => {
    updateSettings({ selectedModel: modelId })
  }, [updateSettings])

  /* ── Close conversation menu on outside click ── */
  useEffect(() => {
    if (!convMenuOpen) return
    const handler = (e) => {
      if (convMenuRef.current && !convMenuRef.current.contains(e.target)) {
        setConvMenuOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [convMenuOpen])

  /* ── Focus rename input when renaming starts ── */
  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renaming])

  /* ── Reset rename state when switching sessions ── */
  useEffect(() => {
    setRenaming(false)
    setConfirmDelete(false)
    setConvMenuOpen(false)
  }, [activeId])

  /* ── Create new chat ── */
  const handleNewChat = useCallback(() => {
    setError(null)
    createSession()
    // On mobile, close sidebar
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [createSession])

  /* ── Switch session ── */
  const handleSwitch = useCallback((id) => {
    setError(null)
    switchSession(id)
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [switchSession])

  /* ── Start header rename ── */
  const startHeaderRename = useCallback(() => {
    if (!activeSession) return
    setRenameValue(activeSession.title)
    setRenaming(true)
    setConfirmDelete(false)
  }, [activeSession])

  /* ── Commit header rename ── */
  const commitHeaderRename = useCallback(() => {
    if (renaming && renameValue.trim() && activeId) {
      renameSession(activeId, renameValue.trim())
    }
    setRenaming(false)
    setRenameValue('')
  }, [renaming, renameValue, activeId, renameSession])

  /* ── Cancel header rename ── */
  const cancelHeaderRename = useCallback(() => {
    setRenaming(false)
    setRenameValue('')
  }, [])

  /* ── Handle rename keydown ── */
  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitHeaderRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelHeaderRename()
    }
  }, [commitHeaderRename, cancelHeaderRename])

  /* ── Delete active session ── */
  const handleDeleteActive = useCallback(() => {
    if (!activeId) return
    if (confirmDelete) {
      deleteSession(activeId)
      setConfirmDelete(false)
      setConvMenuOpen(false)
    } else {
      setConfirmDelete(true)
    }
  }, [activeId, confirmDelete, deleteSession])

  /* ── Export conversation as text ── */
  const handleExport = useCallback(() => {
    if (!activeSession) return
    const lines = activeSession.messages.map((msg) => {
      const role = msg.role === 'user' ? 'User' : 'AI'
      let content = msg.content
      if (msg.files && msg.files.length > 0) {
        const fileNames = msg.files.map(f => f.name).join(', ')
        content = `[Attached: ${fileNames}]\n${content}`
      }
      return `${role}:\n${content}\n`
    })
    const text = `# ${activeSession.title}\n\n${lines.join('\n')}`
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${activeSession.title.replace(/[^a-zA-Z0-9-_]/g, '_') || 'chat'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setConvMenuOpen(false)
  }, [activeSession])

  /* ── Send message via NIM streaming ── */
  const handleSend = useCallback(async (text, files) => {
    if (!text.trim() && (!files || files.length === 0)) return

    // Ensure we have an active session
    let sessionId = activeId
    if (!sessionId) {
      const newSession = createSession()
      sessionId = newSession.id
    }

    setError(null)
    setUsedModel(null)

    // Build NIM messages BEFORE adding to state (state updates are async)
    const priorMessages = activeSession?.messages || []
    const nimMessages = buildNimMessages([
      ...priorMessages,
      { role: 'user', content: text, files },
    ])

    // Add user message to state (with files)
    addMessage(sessionId, { role: 'user', content: text, files })

    // Add empty AI message (for streaming)
    const aiMsg = addMessage(sessionId, { role: 'assistant', content: '' })

    setIsGenerating(true)

    // Create AbortController for this request
    const controller = new AbortController()
    abortRef.current = controller

    try {
      let accumulated = ''

      await streamChatCompletion({
        messages:    nimMessages,
        model:       selectedModelId,
        maxTokens:   2048,
        temperature: 0.7,
        signal:      controller.signal,
        onToken: (chunk) => {
          accumulated += chunk
          updateMessage(sessionId, aiMsg.id, accumulated)
        },
        onModelUsed: (modelId) => {
          setUsedModel(modelId)
        },
      })

      // If nothing was streamed, show a fallback
      if (accumulated === '' && !controller.signal.aborted) {
        updateMessage(sessionId, aiMsg.id, 'No response received from the AI. Please try again.')
      }

      // Auto-generate title via AI if session still has default title
      const session = sessionsRef?.current?.find(s => s.id === sessionId)
      if (session && (session.title === 'New Chat' || session.title.startsWith(text.slice(0, 10)))) {
        generateTitle(text).then(aiTitle => {
          if (aiTitle) renameSession(sessionId, aiTitle)
        })
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User clicked stop - keep whatever was streamed
      } else {
        console.error('NIM streaming error:', err)
        setError('Something went wrong. The AI couldn\'t generate a reply.')
      }
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }, [activeId, activeSession, createSession, addMessage, updateMessage, setIsGenerating, abortRef, selectedModelId, renameSession, sessionsRef, generateTitle])

  /* ── Stop generating ── */
  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setIsGenerating(false)
  }, [abortRef, setIsGenerating])

  /* ── Suggestion click ── */
  const handleSuggestionClick = useCallback((prompt) => {
    handleSend(prompt)
  }, [handleSend])

  /* ── Regenerate last response ── */
  const handleRegenerate = useCallback((userMessage) => {
    // Re-send the last user message
    handleSend(userMessage.content)
  }, [handleSend])

  return (
    <div
      className="ai-chat-root"
      data-ai-theme={settings.theme}
    >
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        collapsed={!sidebarOpen}
        onNewChat={handleNewChat}
        onSwitch={handleSwitch}
        onDelete={deleteSession}
        onRename={renameSession}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <button
            className="chat-header-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <Menu size={18} />
          </button>

          <div className="chat-header-title">
            {renaming ? (
              <input
                ref={renameInputRef}
                className="chat-header-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={commitHeaderRename}
              />
            ) : (
              <span
                onDoubleClick={startHeaderRename}
                title="Double-click to rename"
              >
                {activeSession?.title || 'New Chat'}
              </span>
            )}
          </div>

          {/* Conversation menu */}
          <div className="chat-conv-menu-wrap" ref={convMenuRef}>
            <button
              className="chat-header-menu"
              title="More options"
              onClick={() => {
                setConvMenuOpen(o => !o)
                setConfirmDelete(false)
              }}
            >
              <MoreHorizontal size={18} />
            </button>

            {convMenuOpen && (
              <div className="chat-conv-dropdown">
                <button
                  className="chat-conv-dropdown-item"
                  onClick={startHeaderRename}
                  disabled={!activeSession}
                >
                  <Edit3 size={14} />
                  Rename
                </button>
                <button
                  className="chat-conv-dropdown-item"
                  onClick={handleExport}
                  disabled={!activeSession || messages.length === 0}
                >
                  <Download size={14} />
                  Export as text
                </button>
                <div className="chat-conv-dropdown-divider" />
                <button
                  className={`chat-conv-dropdown-item danger${confirmDelete ? ' confirming' : ''}`}
                  onClick={handleDeleteActive}
                  disabled={!activeSession}
                >
                  <Trash2 size={14} />
                  {confirmDelete ? 'Click again to confirm' : 'Delete chat'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="chat-error" style={{ marginTop: 16 }}>
            <div className="chat-error-title">Something went wrong.</div>
            <div className="chat-error-desc">{error}</div>
            <button className="chat-error-retry" onClick={() => setError(null)}>
              Try again
            </button>
          </div>
        )}

        {/* Chat area */}
        <ChatArea
          messages={messages}
          isGenerating={isGenerating}
          onSuggestionClick={handleSuggestionClick}
          onRegenerate={handleRegenerate}
        />

        {/* Composer */}
        <Composer
          onSend={handleSend}
          onStop={handleStop}
          isGenerating={isGenerating}
          enterToSend={settings.enterToSend}
          selectedModel={selectedModelId}
          onSelectModel={handleSelectModel}
          models={NIM_MODELS}
        />
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onUpdate={updateSettings}
          onClearAll={clearAll}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   SettingsPanel — Basic (will be expanded in Fase 5)
═══════════════════════════════════════════════════ */
function SettingsPanel({ settings, onClose, onUpdate, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="chat-settings-overlay" onClick={onClose}>
      <div className="chat-settings-panel" onClick={e => e.stopPropagation()}>
        <div className="chat-settings-header">
          <span className="chat-settings-title">Settings</span>
          <button className="chat-settings-close" onClick={onClose}>
            <span style={{ fontSize: 18 }}>x</span>
          </button>
        </div>

        <div className="chat-settings-body">
          {/* Appearance */}
          <div className="chat-settings-section">
            <div className="chat-settings-section-label">Appearance</div>
            <div className="chat-settings-row">
              <span className="chat-settings-row-label">Theme</span>
              <div className="chat-theme-options">
                <button
                  className={`chat-theme-btn${settings.theme === 'light' ? ' active' : ''}`}
                  onClick={() => onUpdate({ theme: 'light' })}
                >
                  Light
                </button>
                <button
                  className={`chat-theme-btn${settings.theme === 'dark' ? ' active' : ''}`}
                  onClick={() => onUpdate({ theme: 'dark' })}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="chat-settings-section">
            <div className="chat-settings-section-label">Chat</div>
            <div className="chat-settings-row">
              <span className="chat-settings-row-label">Press Enter to send</span>
              <button
                className={`chat-toggle${settings.enterToSend ? ' on' : ''}`}
                onClick={() => onUpdate({ enterToSend: !settings.enterToSend })}
              >
                <span className="chat-toggle-knob" />
              </button>
            </div>
          </div>

          {/* AI */}
          <div className="chat-settings-section">
            <div className="chat-settings-section-label">AI</div>
            <div className="chat-settings-info">
              Default model: {NIM_MODELS.find(m => m.id === (settings.selectedModel || 'auto'))?.label || 'Auto'}
            </div>
          </div>

          {/* Data */}
          <div className="chat-settings-section">
            <div className="chat-settings-section-label">Data</div>
            <div className="chat-settings-info">
              Conversations are stored temporarily in this browser session. They persist across refreshes but are cleared when you close the tab.
            </div>
            <div className="chat-settings-danger">
              <span className="chat-settings-danger-label">
                {confirmClear ? 'Click again to confirm' : 'Clear all conversations'}
              </span>
              <button
                className="chat-settings-danger-btn"
                onClick={() => {
                  if (confirmClear) {
                    onClearAll()
                    setConfirmClear(false)
                    onClose()
                  } else {
                    setConfirmClear(true)
                  }
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
