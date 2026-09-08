import { useState, useEffect, useCallback, useRef } from 'react'
import { STORAGE_KEYS, DEFAULT_SETTINGS, genId, generateTitle } from '../constants'

/* ═══════════════════════════════════════════════════
   useChatSession — Session management via localStorage

   Session shape:
   {
     id, title, createdAt, updatedAt,
     messages: [{ id, role, content, timestamp }]
   }

   - Sessions persist in localStorage (survive refresh)
   - Active session ID in sessionStorage (lost on tab close)
═══════════════════════════════════════════════════ */

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  } catch (e) {
    console.error('Failed to save sessions', e)
  }
}

function loadActiveId() {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE) || null
  } catch {
    return null
  }
}

function saveActiveId(id) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEYS.ACTIVE, id)
    else sessionStorage.removeItem(STORAGE_KEYS.ACTIVE)
  } catch {
    /* ignore */
  }
}

export function useChatSession() {
  const [sessions, setSessions]     = useState(() => loadSessions())
  const [activeId, setActiveId]     = useState(() => loadActiveId())
  const [isGenerating, setIsGenerating] = useState(false)
  const abortRef                     = useRef(null)

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  // Persist active ID
  useEffect(() => {
    saveActiveId(activeId)
  }, [activeId])

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.SESSIONS) {
        setSessions(() => loadSessions())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const activeSession = sessions.find(s => s.id === activeId) || null

  /* ── Create new session ── */
  const createSession = useCallback(() => {
    const now = Date.now()
    const session = {
      id:        genId('sess'),
      title:     'New Chat',
      createdAt: now,
      updatedAt: now,
      messages:  [],
    }
    setSessions(prev => [session, ...prev])
    setActiveId(session.id)
    return session
  }, [])

  /* ── Delete session ── */
  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      // If deleted the active one, switch to first available
      if (id === activeId) {
        setActiveId(next.length > 0 ? next[0].id : null)
      }
      return next
    })
  }, [activeId])

  /* ── Rename session ── */
  const renameSession = useCallback((id, title) => {
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, title } : s)
    )
  }, [])

  /* ── Switch active session ── */
  const switchSession = useCallback((id) => {
    setActiveId(id)
  }, [])

  /* ── Add message to a session ── */
  const addMessage = useCallback((sessionId, message) => {
    const msg = {
      id:        genId('msg'),
      timestamp: Date.now(),
      ...message,
    }
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s
        const messages = [...s.messages, msg]
        // Auto-title from first user message
        let title = s.title
        if (s.title === 'New Chat' && msg.role === 'user') {
          title = generateTitle(msg.content)
        }
        return { ...s, messages, title, updatedAt: Date.now() }
      })
    )
    return msg
  }, [])

  /* ── Update last message content (for streaming) ── */
  const updateMessage = useCallback((sessionId, msgId, content) => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sessionId) return s
        const messages = s.messages.map(m =>
          m.id === msgId ? { ...m, content } : m
        )
        return { ...s, messages, updatedAt: Date.now() }
      })
    )
  }, [])

  /* ─<arg_value> Clear all sessions ── */
  const clearAll = useCallback(() => {
    setSessions([])
    setActiveId(null)
  }, [])

  /* ── Settings ── */
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  return {
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
  }
}
