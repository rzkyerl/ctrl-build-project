import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { sanityClient } from '../../../../backend/lib/sanity'

const StackEdit: React.FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [name, setName]               = useState('')
  const [slug, setSlug]               = useState('')
  const [slugManual, setSlugManual]   = useState(false)
  const [iconFile, setIconFile]       = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState('')
  const [loading, setLoading]         = useState(false)
  const [fetching, setFetching]       = useState(true)
  const [error, setError]             = useState('')

  const toSlug = (val: string) =>
    val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  useEffect(() => {
    if (!id) return
    sanityClient
      .fetch(`*[_type == "stack" && _id == $id][0]{ _id, name, slug, "iconUrl": icon.asset->url }`, { id })
      .then((data: any) => {
        if (data) {
          setName(data.name)
          setSlug(data.slug?.current || '')
          if (data.iconUrl) setIconPreview(data.iconUrl)
        }
      })
      .catch(() => setError('Failed to load stack.'))
      .finally(() => setFetching(false))
  }, [id])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleIconChange = (file: File) => {
    setIconFile(file)
    setIconPreview(URL.createObjectURL(file))
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

      const res = await fetch(`/api/stacks/${id}`, { method: 'PATCH', body: formData })
      if (!res.ok) throw new Error(await res.text())
      navigate('/admin/stacks')
    } catch (err: any) {
      setError(err.message || 'Failed to update stack.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="ad-loading">LOADING...</div>

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Edit Stack</h1>
          <p className="ad-page-subtitle">{name}</p>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        {error && <div className="ad-error">{error}</div>}

        <div className="ad-card">
          <div className="ad-card-body">
            <form className="ad-form" onSubmit={handleSubmit}>
              <div className="ad-field">
                <label className="ad-label">Name *</label>
                <input
                  className="ad-input"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="ad-field">
                <label className="ad-label">Slug *</label>
                <input
                  className="ad-input"
                  value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }}
                  required
                />
                <span className="ad-input-hint">URL-safe only.</span>
              </div>

              <div className="ad-field">
                <label className="ad-label">Icon</label>
                {iconPreview ? (
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <img src={iconPreview} alt="Preview" style={{ width:64, height:64, objectFit:'contain', borderRadius:8, border:'1px solid var(--ad-border)', background:'var(--ad-surface2)', padding:4 }} />
                    <button
                      type="button"
                      className="ad-btn ad-btn-ghost ad-btn-sm"
                      onClick={() => { setIconFile(null); setIconPreview('') }}
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="ad-upload-zone"
                    onClick={() => fileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleIconChange(f) }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                    <div className="ad-upload-text">Click or drag to replace icon</div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleIconChange(e.target.files[0])} />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StackEdit
