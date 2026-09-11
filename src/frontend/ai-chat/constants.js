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
  accept:         'image/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.rb,.php,.sql,.yaml,.yml,.toml,.ini,.sh,.bat',
}

const MAX_EXTRACTED_CHARS = 50000

/** File type categorization */
export function getFileType(file) {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    name.endsWith('.docx') ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'docx'
  if (name.endsWith('.doc') || mime === 'application/msword') return 'doc'
  if (
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    mime.includes('spreadsheet') ||
    mime === 'application/vnd.ms-excel'
  ) return 'xlsx'
  if (
    name.endsWith('.pptx') ||
    name.endsWith('.ppt') ||
    mime.includes('presentation') ||
    mime === 'application/vnd.ms-powerpoint'
  ) return 'pptx'
  return 'text'
}

/** File icon emoji by type */
export function getFileIcon(fileType) {
  switch (fileType) {
    case 'image': return '\u{1F4CE}'
    case 'pdf':   return '\u{1F4D1}'
    case 'docx':
    case 'doc':   return '\u{1F4C4}'
    case 'xlsx':  return '\u{1F4CA}'
    case 'pptx':  return '\u{1F4CA}'
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

function truncateExtracted(text) {
  if (!text || text.length <= MAX_EXTRACTED_CHARS) return text
  return text.slice(0, MAX_EXTRACTED_CHARS) + '\n\n[... file truncated ...]'
}

/** Extract plain text from a PDF via pdfjs-dist (lazy-loaded) */
export async function extractPdfText(file) {
  const [pdfjs, workerMod] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default

  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) pages.push(pageText)
  }

  const text = pages.join('\n\n').trim()
  if (!text) {
    throw new Error('PDF contained no extractable text')
  }
  return text
}

/** Extract plain text from a DOCX via mammoth (lazy-loaded) */
export async function extractDocxText(file) {
  const mammothMod = await import('mammoth')
  const mammoth = mammothMod.default ?? mammothMod
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = (result.value || '').trim()
  if (!text) {
    throw new Error('DOCX contained no extractable text')
  }
  return text
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

  try {
    switch (fileType) {
      case 'image':
        base.dataUrl = await readImageAsDataUrl(file)
        break
      case 'pdf':
        base.extractedText = truncateExtracted(await extractPdfText(file))
        break
      case 'docx':
        base.extractedText = truncateExtracted(await extractDocxText(file))
        break
      case 'doc':
        base.extractedText = `[Could not extract text from "${file.name}" — .doc (legacy Word) is not supported. Save as .docx or paste the text.]`
        break
      case 'xlsx':
        base.extractedText = `[File Excel: ${file.name} — konten tidak bisa diekstrak. Salin teks secara manual.]`
        break
      case 'pptx':
        base.extractedText = `[File PowerPoint: ${file.name} — konten tidak bisa diekstrak. Salin teks secara manual.]`
        break
      default:
        base.extractedText = truncateExtracted(await readTextFile(file))
        break
    }
  } catch {
    base.extractedText = `[Could not read file content: ${file.name}]`
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
