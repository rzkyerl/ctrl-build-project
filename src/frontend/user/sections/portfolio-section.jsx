import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WebGLGallery from '../components/ui/WebGLGallery';
import '../styles/css/portfolio-section.css'

export const PortfolioSection = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const toProxyUrl = (url) => {
    if (!url) return ''
    try {
      const parsed = new URL(url, window.location.origin)
      if (parsed.origin !== window.location.origin) {
        return `/api/images?url=${encodeURIComponent(url)}`
      }
    } catch {
      // invalid url, pass through as-is
    }
    return url
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch('/api/portfolios')
      .then(res => res.json())
      .then(result => {
        if (!cancelled) {
          if (!result.success) throw new Error(result.error || 'Unable to load portfolios.')
          const mapped = (result.data || [])
            .filter(p => p.imageUrl)
            .map(p => ({
              id: p._id,
              url: toProxyUrl(p.imageUrl),
              title: p.title,
              cat: p.category,
            }))
          setItems(mapped)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Unable to load portfolios.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="pf-section" id="portfolio">
      <div className="pf-header">
        <span className="section-label" style={{ color: 'rgba(255,255,255,0.35)' }}>
          — Selected Work
        </span>
        <h2 className="pf-big-title">Portfolio</h2>
      </div>

      <div className="pf-carousel-wrap">
        {loading ? (
          <div className="wgl-wrapper" style={{ background: 'var(--off-black, #0d0d0d)' }}>
            <div className="wgl-loading">Loading portfolio...</div>
          </div>
        ) : error ? (
          <div className="wgl-wrapper" style={{ background: 'var(--off-black, #0d0d0d)' }}>
            <div className="wgl-loading">Unable to load portfolio.</div>
          </div>
        ) : (
          <WebGLGallery key={items.length} items={items} />
        )}
      </div>

      <div className="pf-btn-container">
        <Link to="/projects" className="pf-view-all-btn">
          <span>View All Projects</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

