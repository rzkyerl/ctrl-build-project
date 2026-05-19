import { useEffect, useRef } from 'react'
import '../styles/css/section-framework.css'

const frameworks = [
  { name: 'Laravel',      slug: 'laravel' },
  { name: 'React',        slug: 'react' },
  { name: 'Next.js',      slug: 'nextdotjs' },
  { name: 'SvelteKit',    slug: 'svelte' },
  { name: 'Docker',       slug: 'docker' },
  { name: 'HTML5',        slug: 'html5' },
  { name: 'CSS3',         slug: 'css' },
  { name: 'JavaScript',   slug: 'javascript' },
  { name: 'Tailwind CSS', slug: 'tailwindcss' },
  { name: 'Figma',        slug: 'figma' },
  { name: 'Node.js',      slug: 'nodedotjs' },
  { name: 'Python',       slug: 'python' },
  { name: 'PostgreSQL',   slug: 'postgresql' },
  { name: 'Sanity',       slug: 'sanity' },
  { name: 'Vercel',       slug: 'vercel' },
  { name: 'GitHub',       slug: 'github' },
  { name: 'Git',          slug: 'git' },
  { name: 'Postman',      slug: 'postman' },
  { name: 'NestJS',       slug: 'nestjs' },
  { name: 'MySQL',        slug: 'mysql' },
  { name: 'PHP',          slug: 'php' },
  { name: 'TurboRepo',    slug: 'turborepo' },
  { name: 'Vite',         slug: 'vite' },
  { name: 'Bootstrap',    slug: 'bootstrap' },
]

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
        const ease = 1 - Math.pow(1 - p, 4)   // ease-out quart
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
  const counterRef = useCounter(24)
  const track      = [...frameworks, ...frameworks, ...frameworks]

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

  return (
    <section className="fw-section" id="frameworks">
      <div className="fw-header reveal" ref={headerRef}>
        <div className="fw-header-left">
          <span className="section-label">— Tech Stack</span>
          <h2 className="section-big-title">Teknologi yang<br />kami kuasai</h2>
        </div>
        <div className="fw-counter">
          <span className="fw-counter-num">
            <span ref={counterRef}>0</span><sup>+</sup>
          </span>
          <span className="fw-counter-label">Teknologi &amp; Tools</span>
        </div>
      </div>

      <div className="fw-marquee-wrap">
        <div className="fw-marquee-row">
          {track.map((tech, i) => (
            <div className="fw-icon" key={`${tech.slug}-${i}`} title={tech.name}>
              <div className="fw-icon-inner">
                <img
                  src={`https://cdn.simpleicons.org/${tech.slug}/000000`}
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
