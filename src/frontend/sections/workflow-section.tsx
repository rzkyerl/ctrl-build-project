import { useEffect, useRef } from 'react'
import '../styles/css/workflow-section.css'

const steps = [
  { id: 1, title: 'Consultation & Requirements', description: 'An in-depth discussion to understand your goals, needs, and project scope.' },
  { id: 2, title: 'UI/UX Design', description: 'Wireframes and visual design so you have a clear picture before development begins.' },
  { id: 3, title: 'Development', description: 'Coding and integration using the latest technologies, with regular progress updates.' },
  { id: 4, title: 'Testing & Launch', description: 'Thorough testing, bug fixes, and deployment to your target server or platform.' },
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

    /* 3D tilt on each step card
     * Fixes:
     * 1. getBoundingClientRect() is read once on mouseenter (not on every mousemove)
     *    to avoid forced layout per event.
     * 2. Style mutations are batched inside requestAnimationFrame so they don't compete
     *    with scroll handlers on the main thread.
     * 3. card.style.transition is only set when state changes (enter/leave),
     *    not on every mousemove frame.
     */
    const cards = section.querySelectorAll<HTMLDivElement>('.wf-step')
    const cleanups: (() => void)[] = []

    cards.forEach(card => {
      // Cache rect on mouse enter — no need to re-read on every mousemove
      let rect = { left: 0, top: 0, width: 1, height: 1 }
      let pendingRaf: number | null = null

      const onEnter = () => {
        rect = card.getBoundingClientRect()
        card.style.transition = 'transform .05s linear'
        card.style.willChange = 'transform'
      }

      const onMove = (e: MouseEvent) => {
        // Cancel previous frame if not yet executed (auto-throttle to 60fps)
        if (pendingRaf !== null) return
        pendingRaf = requestAnimationFrame(() => {
          pendingRaf = null
          const x = (e.clientX - rect.left)  / rect.width  - 0.5
          const y = (e.clientY - rect.top)   / rect.height - 0.5
          card.style.transform = `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(12px)`
        })
      }

      const onLeave = () => {
        if (pendingRaf !== null) { cancelAnimationFrame(pendingRaf); pendingRaf = null }
        card.style.transition = 'transform .7s cubic-bezier(0.19,1,0.22,1)'
        card.style.transform = ''
        // Remove will-change after animation ends so the layer isn't permanently promoted
        const onTransitionEnd = () => {
          card.style.willChange = ''
          card.removeEventListener('transitionend', onTransitionEnd)
        }
        card.addEventListener('transitionend', onTransitionEnd)
      }

      card.addEventListener('mouseenter', onEnter)
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        if (pendingRaf !== null) cancelAnimationFrame(pendingRaf)
        card.removeEventListener('mouseenter', onEnter)
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
            <span className="section-label" style={{ color: 'rgba(255,255,255,0.3)' }}>— How It Works</span>
            <h2 className="section-big-title" style={{ color: '#fff' }}>A process that's<br />transparent</h2>
          </div>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Every step is handled in a structured and communicative way so you're always up to date.
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
              style={{ transitionDelay: `${i * 0.12}s` }}
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
