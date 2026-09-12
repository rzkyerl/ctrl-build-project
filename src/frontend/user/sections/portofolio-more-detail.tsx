import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import '../styles/css/portofolio-more-detail.css'

interface ProjectDetail {
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
}

export const PortofolioMoreDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/portfolios/slug/${id}`)
      .then(res => {
        if (res.status === 404) return null
        if (!res.ok) return res.json().then((body: any) => Promise.reject(new Error(body?.error || 'Unable to load project.')))
        return res.json()
      })
      .then(result => {
        if (!result) return
        if (!result.success) throw new Error(result.error || 'Unable to load project.')
        setProject(result.data)
      })
      .catch(err => setError(err.message || 'Unable to load project.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="project-more-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#aaa' }}>Loading project...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="project-more-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>{error || 'Project Not Found'}</h2>
          <Link to="/projects" style={{ color: '#fff', marginTop: '20px', display: 'inline-block' }}>Back to Portfolio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="project-more-detail">
      <div className="detail-container">
        <header className="detail-header">
          <Link to="/projects" className="detail-category">← Back to Portfolio</Link>
          <span className="detail-category">{project.category}</span>
          <h1 className="detail-title">{project.title}</h1>
        </header>

        <div className="detail-hero-img">
          {project.imageUrl ? (
            <img src={project.imageUrl} alt={project.title} />
          ) : (
            <div style={{ width:'100%', height:'100%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', color:'#666' }}>No image</div>
          )}
        </div>

        <div className="detail-content">
          <aside className="detail-sidebar">
            <div className="sidebar-item">
              <h3>Role</h3>
              <p>Full-stack Developer / UI Designer</p>
            </div>
            <div className="sidebar-item">
              <h3>Technology</h3>
              <ul>
                {project.techStack?.map((tech) => (
                  <li key={tech._id} className="tech-tag">{tech.name}</li>
                ))}
              </ul>
            </div>
            {project.link && (
              <div className="sidebar-item">
                <h3>Live Project</h3>
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="visit-btn">
                  Visit Website
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}
          </aside>

          <main className="detail-main">
            <section className="detail-section">
              <h2>Project Overview</h2>
              <p>{project.overview}</p>
            </section>

            <section className="detail-section">
              <h2>Goals</h2>
              <p>{project.goals}</p>
            </section>

            <section className="detail-section">
              <h2>Core Features</h2>
              <div className="feature-list">
                {project.features?.map((feature) => (
                  <div key={feature.title} className="feature-item">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2>Architecture</h2>
              <p>{project.architecture}</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
