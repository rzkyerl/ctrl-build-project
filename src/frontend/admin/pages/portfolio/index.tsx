import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Search, X, Upload } from 'lucide-react'
import { FeatureList, Feature } from '../../components/FeatureList'
import { StackSelect } from '../../components/StackSelect'

interface Portfolio {
  _id: string
  title: string
  category: string
  slug: { current: string }
  link?: string
  _createdAt: string
  _updatedAt: string
  imageUrl?: string
  overview?: string
  goals?: string
  features?: { title: string; desc: string }[]
  architecture?: string
  techStack?: { _id: string; name: string; iconUrl?: string }[]
}

const CATEGORIES = ['All', 'Web Development', 'Mobile Apps', 'UI/UX Design']
const toSlug = (val: string) =>
  val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const PortfolioList: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [feedback, setFeedback]     = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [fetchingEdit, setFetchingEdit]   = useState(false)
  const [savingEdit, setSavingEdit]       = useState(false)
  const [editError, setEditError]         = useState('')

  const [editTitle, setEditTitle]               = useState('')
  const [editSlug, setEditSlug]                 = useState('')
  const [editSlugManual, setEditSlugManual]     = useState(true)
  const [editCategory, setEditCategory]         = useState(CATEGORIES[0])
  const [editImageFile, setEditImageFile]       = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [editOverview, setEditOverview]         = useState('')
  const [editGoals, setEditGoals]               = useState('')
  const [editFeatures, setEditFeatures]         = useState<Feature[]>([])
  const [editArchitecture, setEditArchitecture] = useState('')
  const [editTechStack, setEditTechStack]       = useState<string[]>([])
  const [editStackNames, setEditStackNames]     = useState<string[]>([])
  const [editLink, setEditLink]                 = useState('')

  const editFileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portfolios')
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Unable to load portfolios.')
      setPortfolios(body.data)
    } catch (err: any) {
      setError(err.message || 'Unable to load portfolios. Check that the local API server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = portfolios.filter(p => {
    const matchSearch   = p.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchCategory
  })

  const resetEditForm = () => {
    setEditTitle('')
    setEditSlug('')
    setEditSlugManual(true)
    setEditCategory(CATEGORIES[0])
    setEditImageFile(null)
    setEditImagePreview('')
    setEditOverview('')
    setEditGoals('')
    setEditFeatures([])
    setEditArchitecture('')
    setEditTechStack([])
    setEditStackNames([])
    setEditLink('')
    setEditError('')
  }

  const openEditModal = async (portfolio: Portfolio) => {
    setEditingId(portfolio._id)
    setEditModalOpen(true)
    setFetchingEdit(true)
    setEditError('')
    resetEditForm()
    try {
      const res = await fetch(`/api/portfolios/${portfolio._id}`)
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Unable to load portfolio.')
      const d = body.data
      setEditTitle(d.title || '')
      setEditSlug(d.slug?.current || '')
      setEditSlugManual(true)
      setEditCategory(d.category || CATEGORIES[0])
      setEditImagePreview(d.imageUrl || '')
      setEditOverview(d.overview || '')
      setEditGoals(d.goals || '')
      setEditFeatures(Array.isArray(d.features) ? d.features : [])
      setEditArchitecture(d.architecture || '')
      setEditTechStack((d.techStack || []).map((t: any) => t._id))
      setEditStackNames((d.techStack || []).map((t: any) => t.name))
      setEditLink(d.link || '')
    } catch (err: any) {
      setEditError(err.message || 'Unable to load portfolio data.')
    } finally {
      setFetchingEdit(false)
    }
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingId(null)
    resetEditForm()
  }

  const handleEditImageChange = (file: File) => {
    setEditImageFile(file)
    setEditImagePreview(URL.createObjectURL(file))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    if (!editTitle || !editSlug) return setEditError('Title and slug are required.')
    setEditError('')
    setSavingEdit(true)
    try {
      const formData = new FormData()
      formData.append('title', editTitle)
      formData.append('slug', editSlug)
      formData.append('category', editCategory)
      formData.append('overview', editOverview)
      formData.append('goals', editGoals)
      formData.append('features', JSON.stringify(editFeatures.filter(f => f.title)))
      formData.append('architecture', editArchitecture)
      formData.append('techStack', JSON.stringify(editTechStack))
      formData.append('link', editLink)
      if (editImageFile) formData.append('image', editImageFile)

      const res = await fetch(`/api/portfolios/${editingId}`, { method: 'PATCH', body: formData })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed to update portfolio.')

      setPortfolios(prev => prev.map(p => p._id === editingId ? { ...p, ...body.data, title: editTitle, category: editCategory, slug: { current: editSlug } } : p))
      setFeedback('Portfolio updated successfully.')
      setTimeout(() => setFeedback(''), 3000)
      closeEditModal()
    } catch (err: any) {
      setEditError(err.message || 'Failed to update portfolio.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/portfolios/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        let body: any
        try {
          body = await res.json()
        } catch {
          body = {}
        }
        throw new Error(body.error || 'Failed to delete portfolio.')
      }
      setPortfolios(prev => prev.filter(p => p._id !== deleteId))
      setFeedback('Portfolio deleted successfully.')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete portfolio.')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getBadgeClass = (cat: string) => {
    if (cat === 'Mobile Apps')  return 'cb-portfolio-badge cb-portfolio-badge-mobile'
    if (cat === 'UI/UX Design') return 'cb-portfolio-badge cb-portfolio-badge-uiux'
    return 'cb-portfolio-badge cb-portfolio-badge-web'
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })

  if (loading) return <div className="cb-portfolio-loading">LOADING...</div>

  return (
    <div>
      <div className="cb-portfolio-page-header">
        <div>
          <h1 className="cb-portfolio-page-title">Portfolio</h1>
          <p className="cb-portfolio-page-subtitle">{portfolios.length} projects total</p>
        </div>
        <Link to="/admin/portfolios/create" className="cb-portfolio-btn cb-portfolio-btn-primary">
          <Plus size={14} /> New Portfolio
        </Link>
      </div>

      {feedback && <div className="cb-portfolio-success">{feedback}</div>}
      {error && <div className="cb-portfolio-error">{error}</div>}

      {/* Toolbar */}
      <div className="cb-portfolio-toolbar">
        <div className="cb-portfolio-search">
          <Search size={14} className="cb-portfolio-search-icon" />
          <input
            placeholder="Search portfolios..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cb-portfolio-filter-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="cb-portfolio-empty">
          <div className="cb-portfolio-empty-icon">📂</div>
          <p className="cb-portfolio-empty-text">
            {portfolios.length === 0 ? 'No portfolios yet' : 'No results found'}
          </p>
          {portfolios.length === 0 && (
            <Link to="/admin/portfolios/create" className="cb-portfolio-btn cb-portfolio-btn-primary">
              <Plus size={14} /> Create first portfolio
            </Link>
          )}
        </div>
      ) : (
        <div className="cb-portfolio-grid">
          {filtered.map(p => (
            <div key={p._id} className="cb-portfolio-card">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.title} className="cb-portfolio-card-img" />
              ) : (
                <div className="cb-portfolio-card-img" style={{ background:'var(--ad-surface2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ad-text-muted)', fontSize:12 }}>
                  No image
                </div>
              )}
              <div className="cb-portfolio-card-body">
                <div className="cb-portfolio-card-title">{p.title}</div>
                <div className="cb-portfolio-card-meta" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span className={getBadgeClass(p.category)}>{p.category}</span>
                  <span style={{ fontSize:10 }}>{formatDate(p._updatedAt || p._createdAt)}</span>
                </div>
                <div className="cb-portfolio-card-actions">
                  <Link to={`/projects/${p.slug.current}`} target="_blank" className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm" title="View public page">
                    <Eye size={12} />
                  </Link>
                  <Link to={`/admin/portfolios/${p._id}`} className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm" title="View details">
                    <Eye size={12} />
                  </Link>
                  <button
                    className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm"
                    onClick={() => openEditModal(p)}
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="cb-portfolio-btn cb-portfolio-btn-danger cb-portfolio-btn-sm"
                    onClick={() => setDeleteId(p._id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="cb-portfolio-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="cb-portfolio-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-portfolio-modal-title">Delete Portfolio</div>
            <div className="cb-portfolio-modal-desc">
              Are you sure? This will permanently delete the portfolio and cannot be undone.
            </div>
            <div className="cb-portfolio-modal-actions">
              <button className="cb-portfolio-btn cb-portfolio-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="cb-portfolio-btn cb-portfolio-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModalOpen && (
        <div className="cb-portfolio-modal-overlay" onClick={closeEditModal}>
          <div className="cb-portfolio-modal cb-portfolio-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="cb-portfolio-modal-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div className="cb-portfolio-modal-title" style={{ margin:0 }}>Edit Portfolio</div>
              <button className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm" onClick={closeEditModal} style={{ padding:6 }}>
                <X size={14} />
              </button>
            </div>

            <div className="cb-portfolio-modal-body">
              {fetchingEdit ? (
                <div className="cb-portfolio-loading">LOADING...</div>
              ) : (
                <form className="cb-portfolio-form" onSubmit={handleEditSubmit} id="portfolio-edit-modal-form">
                  {editError && <div className="cb-portfolio-error" style={{ marginBottom:16 }}>{editError}</div>}

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Title *</label>
                    <input className="cb-portfolio-input" value={editTitle}
                      onChange={e => { setEditTitle(e.target.value); if (!editSlugManual) setEditSlug(toSlug(e.target.value)) }} required />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Slug *</label>
                    <input className="cb-portfolio-input" value={editSlug}
                      onChange={e => { setEditSlug(toSlug(e.target.value)); setEditSlugManual(true) }} required />
                    <span className="cb-portfolio-input-hint">URL: /projects/{editSlug || '...'}</span>
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Category *</label>
                    <select className="cb-portfolio-select" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Main Image</label>
                    {editImagePreview ? (
                      <div style={{ position:'relative', display:'block', width:'100%' }}>
                        <img src={editImagePreview} alt="Preview" className="cb-portfolio-upload-preview" />
                        <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview('') }}
                          style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="cb-portfolio-upload-zone" onClick={() => editFileRef.current?.click()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleEditImageChange(f) }}
                        onDragOver={e => e.preventDefault()}>
                        <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                        <div className="cb-portfolio-upload-text">Click or drag to replace image</div>
                        <input ref={editFileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleEditImageChange(e.target.files[0])} />
                      </div>
                    )}
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Overview</label>
                    <textarea className="cb-portfolio-textarea" rows={3} value={editOverview} onChange={e => setEditOverview(e.target.value)} />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Goals</label>
                    <textarea className="cb-portfolio-textarea" rows={3} value={editGoals} onChange={e => setEditGoals(e.target.value)} />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Features</label>
                    <FeatureList features={editFeatures} onChange={setEditFeatures} />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Architecture</label>
                    <textarea className="cb-portfolio-textarea" rows={2} value={editArchitecture} onChange={e => setEditArchitecture(e.target.value)} />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Tech Stack</label>
                    <StackSelect
                      selected={editTechStack}
                      onChange={(ids, names) => { setEditTechStack(ids); setEditStackNames(names) }}
                    />
                  </div>

                  <div className="cb-portfolio-field">
                    <label className="cb-portfolio-label">Live URL</label>
                    <input className="cb-portfolio-input" type="url" placeholder="https://..." value={editLink} onChange={e => setEditLink(e.target.value)} />
                  </div>

                  <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
                    <button type="button" className="cb-portfolio-btn cb-portfolio-btn-ghost" onClick={closeEditModal} disabled={savingEdit}>Cancel</button>
                    <button type="submit" form="portfolio-edit-modal-form" className="cb-portfolio-btn cb-portfolio-btn-primary" disabled={savingEdit}>
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PortfolioList
