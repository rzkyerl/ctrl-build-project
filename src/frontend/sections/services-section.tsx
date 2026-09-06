import { useEffect, useRef } from 'react'
import '../styles/css/services-section.css'

const services = [
  { id: 1, title: 'Web Development', description: 'Professional websites: company profiles, e-commerce, and custom web applications — responsive, fast, and modern.', tag: 'Development' },
  { id: 2, title: 'Mobile Apps', description: 'Android & iOS app development using Flutter or React Native, for final-year projects or business purposes.', tag: 'Mobile' },
  { id: 3, title: 'UI/UX Design', description: 'Modern and intuitive interface design. From wireframes to high-fidelity prototypes, crafted in Figma.', tag: 'Design' },
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
            <span className="section-label">— Services</span>
            <h2 className="section-big-title">
              What we<br />
              <span className="svc-main-title">offer</span>
            </h2>
          </div>
          <p className="section-subtitle">
            Complete digital solutions for websites, mobile applications, and product design delivered professionally.
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
