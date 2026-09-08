import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react'
import { sanityClient } from '../../../../backend/lib/sanity'

interface Portfolio {
  _id: string
  title: string
  category: string
  slug: { current: string }
  link?: string
  _createdAt: string
  image?: { asset?: { url: string } }
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

  useEffect(() => {
    sanityClient.fetch<Portfolio[]>(`
      *[_type == "portfolio"] | order(_createdAt desc) {
        _id, title, category, slug, link, _createdAt,
        "image": image { asset->{ url } }
      }
    `)
    .then(setPortfolios)
    .catch(() => setError('Failed to load portfolios.'))
    .finally(() => setLoading(false))
  }, [])

  const filtered = portfolios.filter(p => {
    const matchSearch   = p.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || p.category === category
    return matchSearch && matchCategory
  })

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/portfolios/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPortfolios(prev => prev.filter(p => p._id !== deleteId))
    } catch {
      setError('Failed to delete portfolio.')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getBadgeClass = (cat: string) => {
    if (cat === 'Mobile Apps')  return 'ad-badge ad-badge-mobile'
    if (cat === 'UI/UX Design') return 'ad-badge ad-badge-uiux'
    return 'ad-badge ad-badge-web'
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })

  if (loading) return <div className="ad-loading">LOADING...</div>

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Portfolio</h1>
          <p className="ad-page-subtitle">{portfolios.length} projects total</p>
        </div>
        <Link to="/admin/portfolios/create" className="ad-btn ad-btn-primary">
          <Plus size={14} /> New Portfolio
        </Link>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {/* Toolbar */}
      <div className="ad-toolbar">
        <div className="ad-search">
          <Search size={14} className="ad-search-icon" />
          <input
            placeholder="Search portfolios..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="ad-filter-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="ad-empty">
          <div className="ad-empty-icon">📂</div>
          <p className="ad-empty-text">
            {portfolios.length === 0 ? 'No portfolios yet' : 'No results found'}
          </p>
          {portfolios.length === 0 && (
            <Link to="/admin/portfolios/create" className="ad-btn ad-btn-primary">
              <Plus size={14} /> Create first portfolio
            </Link>
          )}
        </div>
      ) : (
        <div className="ad-portfolio-grid">
          {filtered.map(p => (
            <div key={p._id} className="ad-portfolio-card">
              {p.image?.asset?.url ? (
                <img src={p.image.asset.url} alt={p.title} className="ad-portfolio-card-img" />
              ) : (
                <div className="ad-portfolio-card-img" style={{ background:'var(--ad-surface2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ad-text-muted)', fontSize:12 }}>
                  No image
                </div>
              )}
              <div className="ad-portfolio-card-body">
                <div className="ad-portfolio-card-title">{p.title}</div>
                <div className="ad-portfolio-card-meta" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span className={getBadgeClass(p.category)}>{p.category}</span>
                  <span style={{ fontSize:10 }}>{formatDate(p._createdAt)}</span>
                </div>
                <div className="ad-portfolio-card-actions">
                  <Link to={`/admin/portfolios/${p._id}`} className="ad-btn ad-btn-ghost ad-btn-sm">
                    <Eye size={12} />
                  </Link>
                  <Link to={`/admin/portfolios/${p._id}/edit`} className="ad-btn ad-btn-ghost ad-btn-sm">
                    <Pencil size={12} />
                  </Link>
                  <button
                    className="ad-btn ad-btn-danger ad-btn-sm"
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
        <div className="ad-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <div className="ad-modal-title">Delete Portfolio</div>
            <div className="ad-modal-desc">
              Are you sure? This will permanently delete the portfolio and cannot be undone.
            </div>
            <div className="ad-modal-actions">
              <button className="ad-btn ad-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="ad-btn ad-btn-danger" onClick={handleDelete} disabled={deleting}>
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
