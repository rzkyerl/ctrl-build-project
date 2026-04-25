import { useEffect, useRef } from 'react'
import '../styles/css/workflow-section.css'

const steps = [
  {
    id: 1,
    title: 'Konsultasi & Requirement',
    description: 'Diskusi mendalam untuk memahami tujuan, kebutuhan, dan ruang lingkup proyek Anda.',
  },
  {
    id: 2,
    title: 'UI/UX Design',
    description: 'Wireframe dan desain visual agar Anda punya gambaran jelas sebelum development dimulai.',
  },
  {
    id: 3,
    title: 'Development',
    description: 'Coding dan integrasi menggunakan teknologi terkini, disertai laporan progress rutin.',
  },
  {
    id: 4,
    title: 'Testing & Launch',
    description: 'Pengujian menyeluruh, perbaikan bug, dan deployment ke server / platform tujuan.',
  },
]

export const WorkflowSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.wf-step, .wf-header')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.1 }
    )
    els?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="wf-section" id="workflow" ref={sectionRef}>
      <div className="wf-container">

        {/* Header */}
        <div className="wf-header reveal">
          <div>
            <span className="section-label">— Cara Kerja</span>
            <h2 className="section-big-title">Proses yang<br />transparan</h2>
          </div>
          <p className="section-subtitle">
            Setiap tahap dikerjakan secara terstruktur dan komunikatif agar Anda selalu up-to-date.
          </p>
        </div>

        {/* Steps */}
        <div className="wf-list">
          {steps.map((step, i) => (
            <div key={step.id} className="wf-step" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="wf-step-num">
                <span>{String(step.id).padStart(2, '0')}</span>
                {i < steps.length - 1 && <div className="wf-line" />}
              </div>
              <div className="wf-step-body">
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
