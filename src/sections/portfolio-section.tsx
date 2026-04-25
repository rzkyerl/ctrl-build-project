import { useEffect, useRef } from 'react'
import '../styles/css/portfolio-section.css'

const projects = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    category: 'Web Development',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=85',
    size: 'large',
  },
  {
    id: 2,
    title: 'Fintech Dashboard',
    category: 'UI/UX Design',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=85',
    size: 'medium',
  },
  {
    id: 3,
    title: 'Food Delivery App',
    category: 'Mobile Apps',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=85',
    size: 'medium',
  },
  {
    id: 4,
    title: 'Company Profile',
    category: 'Web Development',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85',
    size: 'wide',
  },
]

export const PortfolioSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const items = sectionRef.current?.querySelectorAll('.pf-item')
    const header = sectionRef.current?.querySelector('.pf-header')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )
    if (header) observer.observe(header)
    items?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="pf-section" id="portfolio" ref={sectionRef}>
      <div className="pf-container">

        {/* Header */}
        <div className="pf-header reveal">
          <span className="section-label">— Portfolio</span>
          <div className="pf-header-inner">
            <h2 className="section-big-title">Karya<br />terbaik kami</h2>
            <p className="section-subtitle">
              Setiap proyek dikerjakan dengan perhatian penuh terhadap detail, performa, dan estetika visual.
            </p>
          </div>
        </div>

        {/* Gallery */}
        <div className="pf-gallery">

          {/* Row 1: Large photo */}
          <div className="pf-item pf-item--full">
            <a href="/portfolio" className="pf-link" aria-label={projects[0].title}>
              <div className="pf-img-wrap">
                <img src={projects[0].image} alt={projects[0].title} className="pf-img" loading="lazy" />
              </div>
              <div className="pf-info">
                <div className="pf-info-left">
                  <h3 className="pf-title">{projects[0].title}</h3>
                  <span className="pf-cat">{projects[0].category}</span>
                </div>
                <span className="pf-year">{projects[0].year}</span>
              </div>
            </a>
          </div>

          {/* Row 2: Two side-by-side */}
          <div className="pf-row-2">
            {projects.slice(1, 3).map((p, i) => (
              <div key={p.id} className="pf-item pf-item--half" style={{ transitionDelay: `${i * 0.12}s` }}>
                <a href="/portfolio" className="pf-link" aria-label={p.title}>
                  <div className="pf-img-wrap">
                    <img src={p.image} alt={p.title} className="pf-img" loading="lazy" />
                  </div>
                  <div className="pf-info">
                    <div className="pf-info-left">
                      <h3 className="pf-title">{p.title}</h3>
                      <span className="pf-cat">{p.category}</span>
                    </div>
                    <span className="pf-year">{p.year}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>

          {/* Row 3: Wide photo */}
          <div className="pf-item pf-item--full">
            <a href="/portfolio" className="pf-link" aria-label={projects[3].title}>
              <div className="pf-img-wrap pf-img-wrap--wide">
                <img src={projects[3].image} alt={projects[3].title} className="pf-img" loading="lazy" />
              </div>
              <div className="pf-info">
                <div className="pf-info-left">
                  <h3 className="pf-title">{projects[3].title}</h3>
                  <span className="pf-cat">{projects[3].category}</span>
                </div>
                <span className="pf-year">{projects[3].year}</span>
              </div>
            </a>
          </div>

        </div>

        {/* CTA */}
        <div className="pf-cta">
          <a href="/portfolio" className="pf-cta-btn" id="portfolio-view-all">
            <span>Lihat Semua Karya</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  )
}
