import { useRef, useEffect, useCallback, useState } from 'react'
import { Paperclip, ArrowUp, Square, X, ChevronDown, Check, FileText, Image as ImageIcon } from 'lucide-react'
import { FILE_CONFIG, getFileType, getFileIcon, formatFileSize, processFile, genId } from '../constants'

/* ═══════════════════════════════════════════════════
   Composer — Textarea auto-resize + send/stop logic
   + file upload (picker, drag&drop, paste)
   + model selector (generic labels like ChatGPT)
═══════════════════════════════════════════════════ */

/** File type categories for the upload menu (like ChatGPT) */
const FILE_CATEGORIES = [
  {
    id:       'photos',
    label:    'Photos & Images',
    icon:     ImageIcon,
    accept:   'image/*',
    multiple: true,
  },
  {
    id:       'documents',
    label:    'Documents (PDF, TXT, Code, etc.)',
    icon:     FileText,
    accept:   '.pdf,.txt,.md,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.rb,.php,.sql,.yaml,.yml,.toml,.ini,.sh,.bat',
    multiple: true,
  },
  {
    id:       'any',
    label:    'Any file',
    icon:     Paperclip,
    accept:   FILE_CONFIG.accept,
    multiple: true,
  },
]

export function Composer({ onSend, onStop, isGenerating, enterToSend = true, selectedModel = 'auto', onSelectModel, models = [] }) {
  const textareaRef  = useRef(null)
  const fileInputRef = useRef(null)
  const modelMenuRef = useRef(null)
  const fileMenuRef  = useRef(null)
  const [value, setValue]       = useState('')
  const [files, setFiles]       = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [fileMenuOpen, setFileMenuOpen]   = useState(false)
  const [fileAccept, setFileAccept]       = useState(FILE_CONFIG.accept)
  const [fileMultiple, setFileMultiple]   = useState(true)

  const selectedModelObj = models.find(m => m.id === selectedModel) || models[0]

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])

  /* ── Close model menu on outside click ── */
  useEffect(() => {
    if (!modelMenuOpen) return
    const handler = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setModelMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [modelMenuOpen])

  /* ── Close file menu on outside click ── */
  useEffect(() => {
    if (!fileMenuOpen) return
    const handler = (e) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [fileMenuOpen])

  /* ── Open file picker with specific category ── */
  const openFilePicker = useCallback((category) => {
    setFileAccept(category.accept)
    setFileMultiple(category.multiple)
    setFileMenuOpen(false)
    // Small delay to let state update before triggering click
    requestAnimationFrame(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = category.accept
        fileInputRef.current.multiple = category.multiple
        fileInputRef.current.click()
      }
    })
  }, [])

  /* ── Add files (with validation) ── */
  const addFiles = useCallback(async (fileList) => {
    setFileError(null)
    const incoming = Array.from(fileList)

    if (files.length + incoming.length > FILE_CONFIG.maxFiles) {
      setFileError(`Maximum ${FILE_CONFIG.maxFiles} files allowed`)
      return
    }

    const validFiles = []
    for (const file of incoming) {
      if (file.size > FILE_CONFIG.maxSizeBytes) {
        setFileError(`"${file.name}" exceeds ${formatFileSize(FILE_CONFIG.maxSizeBytes)} limit`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    const processed = await Promise.all(
      validFiles.map(file => processFile(file).catch(err => {
        console.error('File processing error:', err)
        return null
      }))
    )

    const valid = processed.filter(Boolean)
    if (valid.length > 0) {
      setFiles(prev => [...prev, ...valid])
    }
  }, [files.length])

  /* ── Remove a file ── */
  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  /* ── Handle file input change ── */
  const handleFilePick = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }, [addFiles])

  /* ── Drag & Drop ── */
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  /* ── Paste files ── */
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return

    const pastedFiles = []
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) pastedFiles.push(file)
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault()
      addFiles(pastedFiles)
    }
  }, [addFiles])

  /* ── Send ── */
  const canSend = (value.trim().length > 0 || files.length > 0) && !isGenerating

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(value.trim(), files.length > 0 ? files : undefined)
    setValue('')
    setFiles([])
    setFileError(null)
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }, [canSend, value, files, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`chat-composer${isDragging ? ' chat-drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="chat-drop-overlay">
          <div className="chat-drop-text">Drop files anywhere</div>
        </div>
      )}

      <div className="chat-composer-inner">
        {/* File chips */}
        {files.length > 0 && (
          <div className="chat-file-chips">
            {files.map((file) => (
              <div key={file.id} className="chat-file-chip">
                <span className="chat-file-chip-icon">
                  {getFileIcon(file.type)}
                </span>
                <div className="chat-file-chip-info">
                  <span className="chat-file-chip-name">{file.name}</span>
                  <span className="chat-file-chip-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  className="chat-file-chip-remove"
                  onClick={() => removeFile(file.id)}
                  title="Remove file"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File error */}
        {fileError && (
          <div className="chat-file-error">{fileError}</div>
        )}

        <div className="chat-composer-box">
          <textarea
            ref={textareaRef}
            className="chat-composer-textarea"
            placeholder="Ask anything..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
          />
          <div className="chat-composer-toolbar">
            {/* File upload button with category menu */}
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_CONFIG.accept}
              multiple
              style={{ display: 'none' }}
              onChange={handleFilePick}
            />
            <div className="chat-file-upload-wrap" ref={fileMenuRef}>
              <button
                className="chat-composer-btn"
                title="Attach file"
                onClick={() => setFileMenuOpen(o => !o)}
              >
                <Paperclip size={18} />
              </button>

              {fileMenuOpen && (
                <div className="chat-file-upload-menu">
                  {FILE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        className="chat-file-upload-item"
                        onClick={() => openFilePicker(cat)}
                      >
                        <Icon size={16} />
                        <span>{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Model selector */}
            <div className="chat-model-select-wrap" ref={modelMenuRef}>
              <button
                className="chat-model-select-btn"
                onClick={() => setModelMenuOpen(o => !o)}
                title="Select model"
              >
                {selectedModelObj.label}
                <ChevronDown size={14} className={modelMenuOpen ? 'chat-chevron-up' : ''} />
              </button>

              {modelMenuOpen && (
                <div className="chat-model-select-dropdown">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      className={`chat-model-select-item${model.id === selectedModel ? ' active' : ''}`}
                      onClick={() => {
                        onSelectModel?.(model.id)
                        setModelMenuOpen(false)
                      }}
                    >
                      <div className="chat-model-select-radio">
                        {model.id === selectedModel && <Check size={11} />}
                      </div>
                      <div className="chat-model-select-info">
                        <div className="chat-model-select-name">{model.label}</div>
                        <div className="chat-model-select-desc">{model.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isGenerating ? (
              <button className="chat-stop-btn" onClick={onStop} title="Stop generating">
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!canSend}
                title="Send message"
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
