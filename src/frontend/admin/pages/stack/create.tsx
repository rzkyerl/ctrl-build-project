import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const StackCreate: React.FC = () => {
  const navigate = useNavigate()

  const [name, setName]             = useState('')
  const [slug, setSlug]             = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [iconError, setIconError]   = useState(false)

  const toSlug = (val: string) => {
    const raw = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const aliases: Record<string, string> = {
      nextjs: 'nextdotjs',
      nodejs: 'nodedotjs',
      'tailwind-css': 'tailwindcss',
      css3: 'css',
    }
    return aliases[raw] || raw
  }

  useEffect(() => {
    setIconError(false)
  }, [slug])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleDescriptionChange = (val: string) => {
    setDescription(val)
  }

  const simpleIconUrl = slug ? `https://cdn.simpleicons.org/${slug}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return setError('Name and slug are required.')
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/stacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description })
      })
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
      <div className="cb-stack-page-header">
        <div>
          <h1 className="cb-stack-page-title">New Stack</h1>
          <p className="cb-stack-page-subtitle">Add a new tech stack</p>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        {error && <div className="cb-stack-error">{error}</div>}

        <div className="cb-stack-card">
          <div className="cb-stack-card-body">
            <form className="cb-stack-form" onSubmit={handleSubmit}>
              {/* Name */}
              <div className="cb-stack-field">
                <label className="cb-stack-label">Name *</label>
                <input
                  className="cb-stack-input"
                  placeholder="e.g. React"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div className="cb-stack-field">
                <label className="cb-stack-label">Slug *</label>
                <input
                  className="cb-stack-input"
                  placeholder="e.g. react"
                  value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }}
                  required
                />
                <span className="cb-stack-input-hint">Auto-generated from name. URL-safe only.</span>
              </div>

              {/* Description */}
              <div className="cb-stack-description-field">
                <label className="cb-stack-description">Description</label>
                <textarea
                  className="cb-stack-description-input"
                  placeholder="Briefly describe what this technology is used for."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Icon preview */}
              <div className="cb-stack-field">
                <label className="cb-stack-label">Icon</label>
                <div className="cb-stack-icon-preview">
                  {simpleIconUrl && !iconError ? (
                    <img
                      src={simpleIconUrl}
                      alt={`${name || slug} icon`}
                      className="cb-stack-icon-preview-img"
                      onError={() => setIconError(true)}
                    />
                  ) : (
                    <div className="cb-stack-icon-preview-fallback">
                      {slug ? 'No icon available' : '?'}
                    </div>
                  )}
                  {slug && (
                    <div className="cb-stack-icon-preview-meta">
                      Simple Icons · {slug}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="cb-stack-card-footer">
            <button type="button" className="cb-stack-btn cb-stack-btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button
              type="submit"
              className="cb-stack-btn cb-stack-btn-primary"
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
