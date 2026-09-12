import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react'

interface Portfolio {
  _id: string
  title: string
  category: string
  slug: { current: string }
  link?: string
  _createdAt: string
  _updatedAt: string
  imageUrl?: string
}

const CATEGORIES = ['All', 'Web Development', 'Mobile Apps', 'UI/UX Design']

const PortfolioList: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('All')
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [feedback, setFeedback]     = useState('')

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

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/portfolios/${deleteId}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to delete portfolio.')
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
                  <Link to={`/admin/portfolios/${p._id}/edit`} className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm">
                    <Pencil size={12} />
                  </Link>
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
    </div>
  )
}

export default PortfolioList
