import { useEffect, useRef } from 'react'
import '../styles/css/services-section.css'

const services = [
  {
    id: 1,
    title: 'Web Development',
    description: 'Website profesional: company profile, e-commerce, dan web application custom yang responsif, cepat, dan modern.',
    tag: 'Development',
  },
  {
    id: 2,
    title: 'Mobile Apps',
    description: 'Jasa & Joki pembuatan aplikasi Android / iOS menggunakan Flutter atau React Native untuk tugas akhir maupun bisnis.',
    tag: 'Mobile',
  },
  {
    id: 3,
    title: 'UI/UX Design',
    description: 'Desain antarmuka yang modern dan intuitif. Dari wireframe hingga high-fidelity prototype menggunakan Figma.',
    tag: 'Design',
  },
]

export const ServicesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.svc-row, .svc-header')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.1 }
    )
    els?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="svc-section" id="services" ref={sectionRef}>
      <div className="svc-container">

        {/* Header */}
        <div className="svc-header reveal">
          <div className="svc-header-left">
            <span className="section-label">— Layanan</span>
            <h2 className="section-big-title">Apa yang<br />kami tawarkan</h2>
          </div>
          <p className="section-subtitle">
            Solusi digital lengkap untuk kebutuhan website, aplikasi mobile, dan desain produk — dikerjakan secara profesional.
          </p>
        </div>

        {/* Service rows */}
        <div className="svc-list">
          {services.map((svc, i) => (
            <div key={svc.id} className="svc-row reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="svc-num">0{svc.id}</span>
              <div className="svc-body">
                <div className="svc-title-row">
                  <h3 className="svc-title">{svc.title}</h3>
                  <span className="svc-tag">{svc.tag}</span>
                </div>
                <p className="svc-desc">{svc.description}</p>
              </div>
              <a href="#contact" className="svc-cta" aria-label={`Konsultasi ${svc.title}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
