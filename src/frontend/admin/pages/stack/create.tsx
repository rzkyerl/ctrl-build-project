import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X } from 'lucide-react'

const StackCreate: React.FC = () => {
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [name, setName]           = useState('')
  const [slug, setSlug]           = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [iconFile, setIconFile]   = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const toSlug = (val: string) =>
    val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleIconChange = (file: File) => {
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleIconChange(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return setError('Name and slug are required.')
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('slug', slug)
      if (iconFile) formData.append('icon', iconFile)

      const res = await fetch('/api/stacks', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      navigate('/admin/stacks')
    } catch (err: any) {
      setError(err.message || 'Failed to create stack.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">New Stack</h1>
          <p className="ad-page-subtitle">Add a new tech stack</p>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        {error && <div className="ad-error">{error}</div>}

        <div className="ad-card">
          <div className="ad-card-body">
            <form className="ad-form" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="ad-field">
                <label className="ad-label">Name *</label>
                <input
                  className="ad-input"
                  placeholder="e.g. React"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div className="ad-field">
                <label className="ad-label">Slug *</label>
                <input
                  className="ad-input"
                  placeholder="e.g. react"
                  value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }}
                  required
                />
                <span className="ad-input-hint">Auto-generated from name. URL-safe only.</span>
              </div>

              {/* Icon upload */}
              <div className="ad-field">
                <label className="ad-label">Icon</label>
                {iconPreview ? (
                  <div style={{ position:'relative', display:'inline-block' }}>
                    <img src={iconPreview} alt="Preview" style={{ width:64, height:64, objectFit:'contain', borderRadius:8, border:'1px solid var(--ad-border)', background:'var(--ad-surface2)', padding:4 }} />
                    <button
                      type="button"
                      onClick={() => { setIconFile(null); setIconPreview('') }}
                      style={{ position:'absolute', top:-8, right:-8, width:20, height:20, borderRadius:'50%', border:'1px solid var(--ad-border)', background:'var(--ad-surface)', color:'var(--ad-text-dim)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="ad-upload-zone"
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                    <div className="ad-upload-text">Click or drag to upload icon</div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && handleIconChange(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="ad-card-footer">
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              type="submit"
              className="ad-btn ad-btn-primary"
              disabled={loading}
              onClick={handleSubmit as any}
            >
              {loading ? 'Creating...' : 'Create Stack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StackCreate
