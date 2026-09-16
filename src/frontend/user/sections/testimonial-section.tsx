import { useEffect, useRef } from 'react'
import { Testimonial } from '../components/ui/design-testimonial'
import '../styles/css/testimonial-section.css'

export const TestimonialSection = () => {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const targets = section.querySelectorAll(
      '.tm-section-header, .tm-divider, .tm-inner'
    )

    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.08 }
    )

    targets.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <section className="tm-section" id="testimonials" ref={sectionRef}>
      {/* Section header */}
      <div className="tm-section-header reveal">
        <div>
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.3)' }}>
            — What Clients Say
          </span>
          <h2 className="section-big-title" style={{ color: '#fff' }}>
            Trusted by teams<br />that care about craft
          </h2>
        </div>
        <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Real words from the people we've built with no filters, no fluff.
        </p>
      </div>

      {/* Animated divider */}
      <div className="tm-divider">
        <div className="tm-divider-inner" />
      </div>

      {/* Testimonial carousel */}
      <Testimonial />
    </section>
  )
}
