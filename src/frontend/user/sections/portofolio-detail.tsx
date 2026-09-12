import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/css/portofolio-detail.css'

interface Project {
  _id: string
  title: string
  category: string
  slug: { current: string }
  imageUrl?: string
}

export const PortofolioDetail = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/portfolios')
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Unable to load portfolios.')
        setProjects(result.data)
      })
      .catch(err => setError(err.message || 'Unable to load projects.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="projects-page-wrapper">
        <section className="projects-page">
          <div className="projects-header">
            <h1 className="projects-title">Portofolio</h1>
          </div>
          <p style={{ color: '#aaa' }}>Loading projects...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="projects-page-wrapper">
      <section className="projects-page">
        <div className="projects-header">
          <h1 className="projects-title">Portofolio</h1>
        </div>

        {error ? (
          <p style={{ color: '#ff4d4d' }}>{error}</p>
        ) : projects.length === 0 ? (
          <p style={{ color: '#aaa' }}>No projects yet.</p>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <Link to={`/projects/${project.slug.current}`} key={project._id} className="project-card">
                <div className="project-img-wrapper">
                  {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.title} loading="lazy" draggable="false" />
                  ) : (
                    <div style={{ width:'100%', height:'100%', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', color:'#666', fontSize:12 }}>No image</div>
                  )}
                </div>
                <div className="project-info">
                  <h2 className="project-name">{project.title}</h2>
                  <p className="project-category">{project.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
