import { useEffect, useRef } from 'react'
import '../styles/css/services-section.css'

const services = [
  { id: 1, title: 'Web Development', description: 'Situs web profesional: profil perusahaan, e-commerce, dan aplikasi web khusus yang responsif, cepat, dan modern.', tag: 'Development' },
  { id: 2, title: 'Mobile Apps', description: 'Jasa & Joki pembuatan aplikasi Android / iOS menggunakan Flutter atau React Native untuk tugas akhir maupun bisnis.', tag: 'Mobile' },
  { id: 3, title: 'UI/UX Design', description: 'Desain antarmuka yang modern dan intuitif. Dari wireframe hingga high-fidelity prototype menggunakan Figma.', tag: 'Design' },
]

/* Text scramble util */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
function scramble(el: HTMLElement, final: string) {
  let frame = 0
  const total = 24
  const id = setInterval(() => {
    el.textContent = final.split('').map((c, i) => {
      if (c === ' ') return ' '
      if (i < (frame / total) * final.length) return c
      return CHARS[Math.floor(Math.random() * CHARS.length)]
    }).join('')
    if (++frame > total) { el.textContent = final; clearInterval(id) }
  }, 35)
}

export const ServicesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    /* Scroll reveal */
    const revealEls = section.querySelectorAll('.svc-row, .svc-header')
    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.08 }
    )
    revealEls.forEach(el => revealObs.observe(el))

    /* Scramble heading on enter */
    const titleEl = section.querySelector('.svc-main-title') as HTMLElement
    if (titleEl) {
      const finalText = titleEl.textContent || ''
      const titleObs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { scramble(titleEl, finalText); titleObs.disconnect() }
      }, { threshold: 0.4 })
      titleObs.observe(titleEl)
    }
  }, [])

  return (
    <section className="svc-section" id="services" ref={sectionRef}>
      <div className="svc-container">
        <div className="svc-header reveal">
          <div className="svc-header-left">
            <span className="section-label">— Layanan</span>
            <h2 className="section-big-title">
              Apa yang<br />
              <span className="svc-main-title">kami tawarkan</span>
            </h2>
          </div>
          <p className="section-subtitle">
            Solusi digital lengkap untuk kebutuhan website, aplikasi mobile, dan desain produk dikerjakan secara profesional.
          </p>
        </div>

        <div className="svc-list">
          {services.map((svc, i) => (
            <div key={svc.id} className="svc-row reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
              <span className="svc-num">0{svc.id}</span>
              <div className="svc-body">
                <div className="svc-title-row">
                  <h3 className="svc-title">{svc.title}</h3>
                  <span className="svc-tag">{svc.tag}</span>
                </div>
                <p className="svc-desc">{svc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
