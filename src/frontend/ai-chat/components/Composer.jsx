import { useRef, useEffect, useCallback, useState } from 'react'
import { Paperclip, ArrowUp, Square, X, ChevronDown, Check, FileText, Image as ImageIcon } from 'lucide-react'
import { BorderBeam } from './ui/border-beam'
import { FILE_CONFIG, getFileIcon, formatFileSize, processFile } from '../constants'

/* ═══════════════════════════════════════════════════
   Composer — Textarea auto-resize + send/stop logic
   + file upload (picker, drag&drop, paste)
   + model selector
═══════════════════════════════════════════════════ */

const FILE_CATEGORIES = [
  { id: 'photos',    label: 'Photos & Images',                  icon: ImageIcon,  accept: 'image/*',                                                                                                                                                    multiple: true },
  { id: 'documents', label: 'Documents (PDF, TXT, Code, etc.)', icon: FileText,   accept: '.pdf,.txt,.md,.csv,.json,.xml,.html,.css,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.rb,.php,.sql,.yaml,.yml,.toml,.ini,.sh,.bat', multiple: true },
  { id: 'any',       label: 'Any file',                         icon: Paperclip,  accept: FILE_CONFIG.accept,                                                                                                                                           multiple: true },
]

/** Measure a ref element and return fixed-position coords for a top-anchored dropdown */
function useAnchor(open, ref) {
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!open || !ref.current) { setCoords(null); return }
    const update = () => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      setCoords({ bottom: window.innerHeight - r.top + 8, left: r.left })
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('scroll', update, { passive: true, capture: true })
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, { capture: true })
    }
  }, [open, ref])

  return coords
}

export function Composer({ onSend, onStop, isGenerating, enterToSend = true, selectedModel = 'auto', onSelectModel, models = [] }) {
  const textareaRef    = useRef(null)
  const fileInputRef   = useRef(null)
  const fileBtnRef     = useRef(null)
  const modelBtnRef    = useRef(null)
  const toolsBtnRef    = useRef(null)

  const [value, setValue]               = useState('')
  const [files, setFiles]               = useState([])
  const [isDragging, setIsDragging]     = useState(false)
  const [fileError, setFileError]       = useState(null)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [fileMenuOpen, setFileMenuOpen]   = useState(false)
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false)
  const [fileAccept, setFileAccept]       = useState(FILE_CONFIG.accept)
  const [fileMultiple, setFileMultiple]   = useState(true)
  const [beamActive, setBeamActive]       = useState(false)

  const selectedModelObj = models.find(m => m.id === selectedModel) || models[0]

  // Fixed-position coords for each dropdown
  const fileCoords  = useAnchor(fileMenuOpen,  fileBtnRef)
  const modelCoords = useAnchor(modelMenuOpen, modelBtnRef)
  const toolsCoords = useAnchor(toolsMenuOpen, toolsBtnRef)

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxH = Math.max(120, Math.floor(window.innerHeight * 0.4))
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
  }, [])

  useEffect(() => { autoResize() }, [value, autoResize])
  useEffect(() => {
    const h = () => autoResize()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [autoResize])

  /* ── Close menus on outside click ── */
  useEffect(() => {
    if (!modelMenuOpen && !fileMenuOpen && !toolsMenuOpen) return
    const handler = (e) => {
      const inFile  = fileBtnRef.current?.contains(e.target)  || e.target.closest('.chat-composer-dropdown')
      const inModel = modelBtnRef.current?.contains(e.target) || e.target.closest('.chat-composer-dropdown')
      const inTools = toolsBtnRef.current?.contains(e.target) || e.target.closest('.chat-composer-dropdown')
      if (!inFile && !inModel && !inTools) {
        setModelMenuOpen(false)
        setFileMenuOpen(false)
        setToolsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [modelMenuOpen, fileMenuOpen, toolsMenuOpen])

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!modelMenuOpen && !fileMenuOpen && !toolsMenuOpen) return
    const h = (e) => { if (e.key === 'Escape') { setModelMenuOpen(false); setFileMenuOpen(false); setToolsMenuOpen(false) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [modelMenuOpen, fileMenuOpen, toolsMenuOpen])

  /* ── Open file picker ── */
  const openFilePicker = useCallback((cat) => {
    setFileAccept(cat.accept)
    setFileMultiple(cat.multiple)
    setFileMenuOpen(false)
    requestAnimationFrame(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept   = cat.accept
        fileInputRef.current.multiple = cat.multiple
        fileInputRef.current.click()
      }
    })
  }, [])

  /* ── Add files ── */
  const addFiles = useCallback(async (fileList) => {
    setFileError(null)
    const incoming = Array.from(fileList)
    if (files.length + incoming.length > FILE_CONFIG.maxFiles) { setFileError(`Maximum ${FILE_CONFIG.maxFiles} files allowed`); return }
    const validFiles = incoming.filter(f => {
      if (f.size > FILE_CONFIG.maxSizeBytes) { setFileError(`"${f.name}" exceeds ${formatFileSize(FILE_CONFIG.maxSizeBytes)} limit`); return false }
      return true
    })
    if (validFiles.length === 0) return
    const processed = await Promise.all(validFiles.map(f => processFile(f).catch(() => null)))
    const valid = processed.filter(Boolean)
    if (valid.length > 0) setFiles(prev => [...prev, ...valid])
  }, [files.length])

  const removeFile    = useCallback((id) => setFiles(prev => prev.filter(f => f.id !== id)), [])
  const handleFilePick = useCallback((e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }, [addFiles])

  const handleDragOver  = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (e.currentTarget === e.target) setIsDragging(false) }, [])
  const handleDrop      = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files) }, [addFiles])

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items; if (!items) return
    const pasted = Array.from(items).filter(i => i.kind === 'file').map(i => i.getAsFile()).filter(Boolean)
    if (pasted.length) { e.preventDefault(); addFiles(pasted) }
  }, [addFiles])

  /* ── Send ── */
  const canSend = (value.trim().length > 0 || files.length > 0) && !isGenerating
  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(value.trim(), files.length > 0 ? files : undefined)
    setValue(''); setFiles([]); setFileError(null)
    requestAnimationFrame(() => { if (textareaRef.current) textareaRef.current.style.height = 'auto' })
  }, [canSend, value, files, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) { e.preventDefault(); handleSend() }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey))   { e.preventDefault(); handleSend() }
  }

  return (
    <div
      className={`chat-composer${isDragging ? ' chat-drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="chat-drop-overlay">
          <div className="chat-drop-text">Drop files anywhere</div>
        </div>
      )}

      <div className="chat-composer-inner">
        {files.length > 0 && (
          <div className="chat-file-chips">
            {files.map(file => (
              <div key={file.id} className="chat-file-chip">
                <span className="chat-file-chip-icon">{getFileIcon(file.type)}</span>
                <div className="chat-file-chip-info">
                  <span className="chat-file-chip-name">{file.name}</span>
                  <span className="chat-file-chip-size">{formatFileSize(file.size)}</span>
                </div>
                <button className="chat-file-chip-remove" onClick={() => removeFile(file.id)} title="Remove"><X size={13} /></button>
              </div>
            ))}
          </div>
        )}

        {fileError && <div className="chat-file-error">{fileError}</div>}

        <BorderBeam size="md" colorVariant="colorful" active={beamActive} duration={3} borderRadius={20}>
          <div
            className="chat-composer-box"
            onMouseEnter={() => setBeamActive(true)}
            onMouseLeave={() => !value && !modelMenuOpen && !fileMenuOpen && !toolsMenuOpen && setBeamActive(false)}
            onFocus={() => setBeamActive(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && !value) setBeamActive(false) }}
          >
            <input ref={fileInputRef} type="file" accept={fileAccept} multiple={fileMultiple} style={{ display: 'none' }} onChange={handleFilePick} />

            <textarea
              ref={textareaRef}
              className="chat-composer-textarea"
              placeholder="Build anything..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
            />

            <div className="chat-composer-toolbar">
              {/* File attach button */}
              <button
                ref={fileBtnRef}
                className="chat-composer-chip"
                title="Attach file"
                onClick={() => { setFileMenuOpen(o => !o); setModelMenuOpen(false) }}
              >
                <Paperclip size={16} />
              </button>

              {/* Model selector button */}
              <button
                ref={modelBtnRef}
                className="chat-composer-chip has-text"
                onClick={() => { setModelMenuOpen(o => !o); setFileMenuOpen(false) }}
                title="Select model"
              >
                {selectedModelObj?.label ?? 'Auto'}
                <ChevronDown size={14} className={modelMenuOpen ? 'chat-chevron-up' : ''} />
              </button>

              {/* Tools chip */}
              <button
                ref={toolsBtnRef}
                className="chat-composer-chip has-text"
                title="Tools"
                onClick={() => { setToolsMenuOpen(o => !o); setFileMenuOpen(false); setModelMenuOpen(false) }}
              >
                Tools <ChevronDown size={14} className={toolsMenuOpen ? 'chat-chevron-up' : ''} />
              </button>

              {/* Send / Stop */}
              {isGenerating ? (
                <button className="chat-stop-btn" onClick={onStop} title="Stop"><Square size={14} fill="currentColor" /></button>
              ) : (
                <button className="chat-send-btn" onClick={handleSend} disabled={!canSend} title="Send"><ArrowUp size={16} /></button>
              )}
            </div>
          </div>
        </BorderBeam>

        {/* ── File attachment dropdown — fixed, outside BorderBeam clip ── */}
        {fileMenuOpen && fileCoords && (
          <div
            className="chat-composer-dropdown chat-file-upload-menu"
            style={{ position: 'fixed', bottom: fileCoords.bottom, left: fileCoords.left, zIndex: 9999 }}
          >
            {FILE_CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button key={cat.id} className="chat-file-upload-item" onClick={() => openFilePicker(cat)}>
                  <Icon size={16} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Model selector dropdown — fixed, outside BorderBeam clip ── */}
        {modelMenuOpen && modelCoords && (
          <div
            className="chat-composer-dropdown chat-model-select-dropdown"
            style={{ position: 'fixed', bottom: modelCoords.bottom, left: modelCoords.left, zIndex: 9999 }}
          >
            {models.map(model => (
              <button
                key={model.id}
                className={`chat-model-select-item${model.id === selectedModel ? ' active' : ''}`}
                onClick={() => { onSelectModel?.(model.id); setModelMenuOpen(false) }}
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

        {/* ── Tools dropdown — fixed, outside BorderBeam clip ── */}
        {toolsMenuOpen && toolsCoords && (
          <div
            className="chat-composer-dropdown chat-tools-dropdown"
            style={{ position: 'fixed', bottom: toolsCoords.bottom, left: toolsCoords.left, zIndex: 9999 }}
          >
            <div className="chat-tools-coming-soon">
              <span className="chat-tools-coming-soon-badge">Coming Soon</span>
              <p className="chat-tools-coming-soon-text">
                Tool integrations are on the way web search, code execution, and more.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
