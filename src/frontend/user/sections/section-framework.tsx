import { useEffect, useRef, useState } from 'react'
import '../styles/css/section-framework.css'

interface Stack {
  _id: string
  name: string
  slug: { current: string }
  iconUrl?: string
}

/* Rolling counter */
function useCounter(target: number, duration = 1400) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 4)
        el.textContent = Math.round(ease * target).toString()
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return ref
}

export const FrameworkSection = () => {
  const headerRef  = useRef<HTMLDivElement>(null)
  const [stacks, setStacks] = useState<Stack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stacks')
      .then(res => res.json())
      .then(result => {
        if (!result.success) throw new Error(result.error || 'Unable to load stacks.')
        setStacks(result.data)
      })
      .catch(() => setStacks([]))
      .finally(() => setLoading(false))
  }, [])

  const track = stacks.length ? [...stacks, ...stacks, ...stacks] : []
  const counterRef = useCounter(stacks.length || 0)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && header.classList.add('in-view'),
      { threshold: 0.2 }
    )
    obs.observe(header)
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <section className="fw-section" id="frameworks">
        <div className="fw-header reveal" ref={headerRef}>
          <div className="fw-header-left">
            <span className="section-label">— Tech Stack</span>
            <h2 className="section-big-title">Technologies &amp; Frameworks<br />we work with</h2>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="fw-section" id="frameworks">
      <div className="fw-header reveal" ref={headerRef}>
        <div className="fw-header-left">
          <span className="section-label">— Tech Stack</span>
          <h2 className="section-big-title">Technologies &amp; Frameworks<br />we work with</h2>
        </div>
        <div className="fw-counter">
          <span className="fw-counter-num">
            <span ref={counterRef}>0</span><sup>+</sup>
          </span>
          <span className="fw-counter-label">Technologies &amp; Tools</span>
        </div>
      </div>

      <div className="fw-marquee-wrap">
        <div className="fw-marquee-row">
          {track.map((tech, i) => (
            <div className="fw-icon" key={`${tech.slug.current}-${i}`} title={tech.name}>
              <div className="fw-icon-inner">
                <img
                  src={tech.iconUrl || `https://cdn.simpleicons.org/${tech.slug.current}/000000`}
                  alt={tech.name}
                  loading="lazy"
                  draggable="false"
                />
                <span className="fw-icon-name">{tech.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
