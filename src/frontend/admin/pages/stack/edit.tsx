import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const StackEdit: React.FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [name, setName]               = useState('')
  const [slug, setSlug]               = useState('')
  const [slugManual, setSlugManual]   = useState(false)
  const [description, setDescription] = useState('')
  const [iconPreview, setIconPreview] = useState('')
  const [loading, setLoading]         = useState(false)
  const [fetching, setFetching]       = useState(true)
  const [error, setError]             = useState('')
  const [iconError, setIconError]     = useState(false)

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
    if (!id) return
    fetch(`/api/stacks/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stack')
        return res.json()
      })
      .then(result => {
        if (result?.success && result.data) {
          const data = result.data
          setName(data.name)
          setSlug(data.slug?.current || '')
          setDescription(data.description || '')
          setIconPreview(data.iconUrl || '')
        } else {
          setError('Stack not found.')
        }
      })
      .catch(() => setError('Failed to load stack.'))
      .finally(() => setFetching(false))
  }, [id])

  useEffect(() => {
    setIconError(false)
  }, [slug])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return setError('Name and slug are required.')
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/stacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description })
      })
      if (!res.ok) throw new Error(await res.text())
      navigate('/admin/stacks')
    } catch (err: any) {
      setError(err.message || 'Failed to update stack.')
    } finally {
      setLoading(false)
    }
  }

  const displayIconUrl = iconPreview || (slug ? `https://cdn.simpleicons.org/${slug}` : '')

  if (fetching) return <div className="cb-stack-loading">LOADING...</div>

  return (
    <div>
      <div className="cb-stack-page-header">
        <div>
          <h1 className="cb-stack-page-title">Edit Stack</h1>
          <p className="cb-stack-page-subtitle">{name}</p>
        </div>
      </div>

      <div style={{ maxWidth: 480 }}>
        {error && <div className="cb-stack-error">{error}</div>}

        <div className="cb-stack-card">
          <div className="cb-stack-card-body">
            <form className="cb-stack-form" onSubmit={handleSubmit}>
              <div className="cb-stack-field">
                <label className="cb-stack-label">Name *</label>
                <input
                  className="cb-stack-input"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="cb-stack-field">
                <label className="cb-stack-label">Slug *</label>
                <input
                  className="cb-stack-input"
                  value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }}
                  required
                />
                <span className="cb-stack-input-hint">URL-safe only.</span>
              </div>

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

              <div className="cb-stack-field">
                <label className="cb-stack-label">Icon</label>
                <div className="cb-stack-icon-preview">
                  {displayIconUrl && !iconError ? (
                    <img
                      src={displayIconUrl}
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
                      {iconPreview ? 'Sanity asset' : `Simple Icons · ${slug}`}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StackEdit
