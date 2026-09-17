import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Pencil, Trash2, ExternalLink, ArrowLeft } from 'lucide-react'

interface PortfolioFull {
  _id: string
  title: string
  category: string
  slug: { current: string }
  imageUrl?: string
  overview?: string
  goals?: string
  features?: { title: string; desc: string }[]
  architecture?: string
  techStack?: { _id: string; name: string; iconUrl?: string }[]
  link?: string
  _createdAt: string
  _updatedAt: string
}

const PortfolioDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [portfolio, setPortfolio] = useState<PortfolioFull | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/portfolios/${id}`)
      .then(res => res.json())
      .then(body => {
        if (!body.success) throw new Error(body.error || 'Portfolio not found.')
        setPortfolio(body.data)
      })
      .catch(() => setError('Unable to load portfolio data from Sanity.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to delete portfolio.')
      navigate('/admin/portfolios')
    } catch (err: any) {
      setError(err.message || 'Failed to delete portfolio.')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  if (loading) return <div className="cb-portfolio-loading">LOADING...</div>
  if (error || !portfolio) return <div className="cb-portfolio-error">{error || 'Not found'}</div>

  return (
    <div>
      {/* Header */}
      <div className="cb-portfolio-page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="cb-portfolio-page-title">{portfolio.title}</h1>
            <p className="cb-portfolio-page-subtitle">{portfolio.category} · Created {formatDate(portfolio._createdAt)}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {portfolio.link && (
            <a href={portfolio.link} target="_blank" rel="noopener noreferrer" className="cb-portfolio-btn cb-portfolio-btn-ghost">
              <ExternalLink size={14} /> Visit Live
            </a>
          )}
          <Link to={`/admin/portfolios/${id}/edit`} className="cb-portfolio-btn cb-portfolio-btn-ghost">
            <Pencil size={14} /> Edit
          </Link>
          <button className="cb-portfolio-btn cb-portfolio-btn-danger" onClick={() => setShowDelete(true)}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, alignItems:'start' }}>
        {/* Main content */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Image */}
          {portfolio.imageUrl && (
            <div className="cb-portfolio-detail-card">
              <img src={portfolio.imageUrl} alt={portfolio.title}
                style={{ width:'100%', maxHeight:320, objectFit:'cover', display:'block' }} />
            </div>
          )}

          {/* Overview */}
          {portfolio.overview && (
            <div className="cb-portfolio-detail-card">
              <div className="cb-portfolio-detail-card-body">
                <div className="cb-portfolio-label" style={{ marginBottom:8 }}>Overview</div>
                <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:'var(--ad-text-dim)' }}>{portfolio.overview}</p>
              </div>
            </div>
          )}

          {/* Goals */}
          {portfolio.goals && (
            <div className="cb-portfolio-detail-card">
              <div className="cb-portfolio-detail-card-body">
                <div className="cb-portfolio-label" style={{ marginBottom:8 }}>Goals</div>
                <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:'var(--ad-text-dim)' }}>{portfolio.goals}</p>
              </div>
            </div>
          )}

          {/* Features */}
          {portfolio.features && portfolio.features.length > 0 && (
            <div className="cb-portfolio-detail-card">
              <div className="cb-portfolio-detail-card-body">
                <div className="cb-portfolio-label" style={{ marginBottom:12 }}>Features</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {portfolio.features.map((f, i) => (
                    <div key={i} style={{ padding:'10px 12px', background:'var(--ad-surface2)', borderRadius:6, border:'1px solid var(--ad-border)' }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{f.title}</div>
                      {f.desc && <div style={{ fontSize:12, color:'var(--ad-text-dim)' }}>{f.desc}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Architecture */}
          {portfolio.architecture && (
            <div className="cb-portfolio-detail-card">
              <div className="cb-portfolio-detail-card-body">
                <div className="cb-portfolio-label" style={{ marginBottom:8 }}>Architecture</div>
                <p style={{ margin:0, fontSize:14, lineHeight:1.6, color:'var(--ad-text-dim)' }}>{portfolio.architecture}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Meta */}
          <div className="cb-portfolio-detail-card">
            <div className="cb-portfolio-detail-card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div className="cb-portfolio-label" style={{ marginBottom:4 }}>Slug</div>
                <code style={{ fontSize:12, color:'var(--ad-text-dim)', fontFamily:'var(--ad-mono)' }}>
                  /projects/{portfolio.slug?.current}
                </code>
              </div>
              <div>
                <div className="cb-portfolio-label" style={{ marginBottom:4 }}>Category</div>
                <span style={{ fontSize:13, color:'var(--ad-text)' }}>{portfolio.category}</span>
              </div>
              {portfolio.link && (
                <div>
                  <div className="cb-portfolio-label" style={{ marginBottom:4 }}>Live URL</div>
                  <a href={portfolio.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:12, color:'var(--ad-text-dim)', fontFamily:'var(--ad-mono)', wordBreak:'break-all' }}>
                    {portfolio.link}
                  </a>
                </div>
              )}
              <div>
                <div className="cb-portfolio-label" style={{ marginBottom:4 }}>Last Updated</div>
                <span style={{ fontSize:12, color:'var(--ad-text-dim)' }}>{formatDate(portfolio._updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          {portfolio.techStack && portfolio.techStack.length > 0 && (
            <div className="cb-portfolio-detail-card">
              <div className="cb-portfolio-detail-card-body">
                <div className="cb-portfolio-label" style={{ marginBottom:10 }}>Tech Stack</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {portfolio.techStack.map(s => (
                    <span key={s._id} className="cb-portfolio-stack-chip" style={{ cursor:'default' }}>
                      {s.iconUrl && <img src={s.iconUrl} alt={s.name} />}
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="cb-portfolio-modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="cb-portfolio-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-portfolio-modal-title">Delete Portfolio</div>
            <div className="cb-portfolio-modal-desc">
              Are you sure you want to delete <strong>{portfolio.title}</strong>? This cannot be undone.
            </div>
            <div className="cb-portfolio-modal-actions">
              <button className="cb-portfolio-btn cb-portfolio-btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
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

export default PortfolioDetail
