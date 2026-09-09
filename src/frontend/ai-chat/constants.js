/* ═══════════════════════════════════════════════════
   AI CHAT — Constants & Configuration
═══════════════════════════════════════════════════ */

export const STORAGE_KEYS = {
  SESSIONS:  'ai-chat-sessions',   // array of session objects
  ACTIVE:    'ai-chat-active',     // active session ID (sessionStorage)
  SETTINGS:  'ai-chat-settings',  // { theme, enterToSend }
}

export const DEFAULT_SETTINGS = {
  theme:         'dark',
  enterToSend:   true,
  selectedModel: 'auto',
}

export const SIDEBAR_WIDTH = 260

/** File upload configuration */
export const FILE_CONFIG = {
  maxFiles:       5,
  maxSizeBytes:   10 * 1024 * 1024,  // 10 MB per file
  accept:         'image/*,.pdf,.txt,.md,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.rb,.php,.sql,.yaml,.yml,.toml,.ini,.sh,.bat',
}

/** File type categorization */
export function getFileType(file) {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  return 'text'
}

/** File icon emoji by type */
export function getFileIcon(fileType) {
  switch (fileType) {
    case 'image': return '\u{1F4CE}'
    case 'pdf':   return '\u{1F4D1}'
    default:     return '\u{1F4C4}'
  }
}

/** Read a text-based file and return its content as string */
export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/** Read an image file and return a data URL */
export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

/**
 * Process a file into internal format for messages.
 * Returns { id, name, size, type, dataUrl?, extractedText? }
 */
export async function processFile(file) {
  const fileType = getFileType(file)
  const base = {
    id:   genId('file'),
    name: file.name,
    size: file.size,
    type: fileType,
  }

  if (fileType === 'image') {
    base.dataUrl = await readImageAsDataUrl(file)
  } else {
    // Read text content for PDFs and text files
    // Note: PDFs won't have extractable text via FileReader, but text-based files will
    try {
      base.extractedText = await readTextFile(file)
      // Truncate very large text files
      if (base.extractedText.length > 50000) {
        base.extractedText = base.extractedText.slice(0, 50000) + '\n\n[... file truncated ...]'
      }
    } catch {
      base.extractedText = `[Could not read file content: ${file.name}]`
    }
  }

  return base
}

/** Suggestion chips for empty state */
export const SUGGESTIONS = [
  { label: 'Analyze a document',  prompt: 'Can you help me analyze a document?' },
  { label: 'Write something',      prompt: 'Help me write something' },
  { label: 'Explain a concept',    prompt: 'Can you explain a concept to me?' },
  { label: 'Help me code',         prompt: 'Help me with some code' },
]

/** Generate a unique ID with timestamp + random suffix */
export function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** Format file size human-readable */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Format timestamp to short time string */
export function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Group sessions by date label */
export function groupSessionsByDate(sessions) {
  const now    = new Date()
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yday   = today - 86400000
  const week   = today - 7 * 86400000

  const groups = { Today: [], Yesterday: [], 'Previous 7 days': [], Earlier: [] }

  // Sort newest first
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const s of sorted) {
    if (s.updatedAt >= today) groups['Today'].push(s)
    else if (s.updatedAt >= yday) groups['Yesterday'].push(s)
    else if (s.updatedAt >= week) groups['Previous 7 days'].push(s)
    else groups['Earlier'].push(s)
  }

  // Remove empty groups
  return Object.entries(groups).filter(([, v]) => v.length > 0)
}

/** Auto-generate title from first user message */
export function generateTitle(message) {
  const trimmed = message.trim()
  if (trimmed.length <= 40) return trimmed
  return trimmed.slice(0, 40).trim() + '...'
}
