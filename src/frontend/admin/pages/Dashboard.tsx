import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Layers, Plus, ExternalLink } from 'lucide-react'
import { sanityClient } from '../../../backend/lib/sanity'

interface RecentPortfolio {
  _id: string
  title: string
  category: string
  slug: { current: string }
  image?: { asset?: { url: string } }
}

interface Stats {
  portfolioCount: number
  stackCount: number
  recentPortfolios: RecentPortfolio[]
}

const Dashboard: React.FC = () => {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [portfolioCount, stackCount, recentPortfolios] = await Promise.all([
          sanityClient.fetch<number>(`count(*[_type == "portfolio"])`),
          sanityClient.fetch<number>(`count(*[_type == "stack"])`),
          sanityClient.fetch<RecentPortfolio[]>(`
            *[_type == "portfolio"] | order(_createdAt desc) [0...3] {
              _id, title, category,
              slug,
              "image": image { asset->{ url } }
            }
          `),
        ])
        setStats({ portfolioCount, stackCount, recentPortfolios })
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="ad-loading">LOADING...</div>
  if (error)   return <div className="ad-error">{error}</div>

  return (
    <div>
      {/* Header */}
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Dashboard</h1>
          <p className="ad-page-subtitle">Overview of your portfolio site</p>
        </div>
        <a
          href="https://www.ctrl-build.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="ad-btn ad-btn-ghost"
        >
          <ExternalLink size={14} />
          Visit Site
        </a>
      </div>

      {/* Stat Cards */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card">
          <div className="ad-stat-label">
            <FolderOpen size={12} style={{ display:'inline', marginRight:4 }} />
            Portfolios
          </div>
          <div className="ad-stat-value">{stats?.portfolioCount ?? 0}</div>
        </div>
        <div className="ad-stat-card">
          <div className="ad-stat-label">
            <Layers size={12} style={{ display:'inline', marginRight:4 }} />
            Tech Stacks
          </div>
          <div className="ad-stat-value">{stats?.stackCount ?? 0}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display:'flex', gap:10, marginBottom:32 }}>
        <Link to="/admin/portfolios/create" className="ad-btn ad-btn-primary">
          <Plus size={14} />
          New Portfolio
        </Link>
        <Link to="/admin/stacks/create" className="ad-btn ad-btn-ghost">
          <Plus size={14} />
          New Stack
        </Link>
      </div>

      {/* Recent Portfolios */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h2 style={{ fontSize:14, fontWeight:600, color:'var(--ad-text-dim)', fontFamily:'var(--ad-mono)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Recent Portfolios
          </h2>
          <Link to="/admin/portfolios" className="ad-btn ad-btn-ghost ad-btn-sm">
            View all
          </Link>
        </div>

        {stats?.recentPortfolios.length === 0 ? (
          <div className="ad-empty">
            <div className="ad-empty-icon">📂</div>
            <p className="ad-empty-text">No portfolios yet</p>
            <Link to="/admin/portfolios/create" className="ad-btn ad-btn-primary">
              <Plus size={14} /> Create first portfolio
            </Link>
          </div>
        ) : (
          <div className="ad-recent-grid">
            {stats?.recentPortfolios.map(p => (
              <Link key={p._id} to={`/admin/portfolios/${p._id}`} className="ad-recent-card">
                {p.image?.asset?.url ? (
                  <img src={p.image.asset.url} alt={p.title} className="ad-recent-card-img" />
                ) : (
                  <div className="ad-recent-card-img" style={{ background:'var(--ad-surface2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ad-text-muted)', fontSize:12 }}>
                    No image
                  </div>
                )}
                <div className="ad-recent-card-info">
                  <div className="ad-recent-card-title">{p.title}</div>
                  <div className="ad-recent-card-cat">{p.category}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
