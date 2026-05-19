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

    /* 3D tilt on each service row */
    const rows = section.querySelectorAll<HTMLDivElement>('.svc-row')
    rows.forEach(row => {
      const onMove = (e: MouseEvent) => {
        const r = row.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width  - .5  // -0.5 to 0.5
        const y = (e.clientY - r.top)  / r.height - .5
        row.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateZ(8px)`
        row.style.transition = 'transform .05s linear'
      }
      const onLeave = () => {
        row.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
        row.style.transition = 'transform .7s cubic-bezier(0.19,1,0.22,1)'
      }
      row.addEventListener('mousemove', onMove)
      row.addEventListener('mouseleave', onLeave)
    })

    return () => {
      revealObs.disconnect()
      rows.forEach(row => {
        row.replaceWith(row.cloneNode(true)) // clean listeners
      })
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
            Solusi digital lengkap untuk kebutuhan website, aplikasi mobile, dan desain produk — dikerjakan secara profesional.
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
              <div className="svc-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
