import { useEffect, useRef } from 'react'
import '../styles/css/workflow-section.css'

const steps = [
  { id: 1, title: 'Konsultasi & Requirement', description: 'Diskusi mendalam untuk memahami tujuan, kebutuhan, dan ruang lingkup proyek Anda.' },
  { id: 2, title: 'UI/UX Design', description: 'Wireframe dan desain visual agar Anda punya gambaran jelas sebelum development dimulai.' },
  { id: 3, title: 'Development', description: 'Coding dan integrasi menggunakan teknologi terkini, disertai laporan progress rutin.' },
  { id: 4, title: 'Testing & Launch', description: 'Pengujian menyeluruh, perbaikan bug, dan deployment ke server / platform tujuan.' },
]

export const WorkflowSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    /* Scroll reveal */
    const revealEls = section.querySelectorAll('.wf-step, .wf-header, .wf-line-draw')
    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.08 }
    )
    revealEls.forEach(el => revealObs.observe(el))

    /* 3D tilt on each step card */
    const cards = section.querySelectorAll<HTMLDivElement>('.wf-step')
    const cleanups: (() => void)[] = []

    cards.forEach(card => {
      const onMove = (e: MouseEvent) => {
        const r  = card.getBoundingClientRect()
        const x  = (e.clientX - r.left)  / r.width  - .5
        const y  = (e.clientY - r.top)   / r.height - .5
        card.style.transform = `
          perspective(700px)
          rotateX(${-y * 10}deg)
          rotateY(${x * 10}deg)
          translateZ(12px)
          translateY(0)
        `
        card.style.transition = 'transform .05s linear'
      }
      const onLeave = () => {
        card.style.transform = ''
        card.style.transition = 'transform .7s cubic-bezier(0.19,1,0.22,1)'
      }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => { revealObs.disconnect(); cleanups.forEach(fn => fn()) }
  }, [])

  return (
    <section className="wf-section" id="workflow" ref={sectionRef}>
      <div className="wf-bg-text" aria-hidden="true">PROCESS</div>

      <div className="wf-container">
        <div className="wf-header reveal">
          <div>
            <span className="section-label" style={{ color: 'rgba(255,255,255,0.3)' }}>— Cara Kerja</span>
            <h2 className="section-big-title" style={{ color: '#fff' }}>Proses yang<br />transparan</h2>
          </div>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Setiap tahap dikerjakan secara terstruktur dan komunikatif agar Anda selalu up-to-date.
          </p>
        </div>

        <div className="wf-line-draw" aria-hidden="true">
          <div className="wf-line-draw-inner" />
        </div>

        <div className="wf-list">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="wf-step"
              style={{ transitionDelay: `${i * 0.12}s`, transformStyle: 'preserve-3d' }}
            >
              <span className="wf-step-bg-num" aria-hidden="true">{String(step.id).padStart(2, '0')}</span>
              <div className="wf-step-content">
                <span className="wf-step-num">{String(step.id).padStart(2, '0')}</span>
                <h3 className="wf-title">{step.title}</h3>
                <p className="wf-desc">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
