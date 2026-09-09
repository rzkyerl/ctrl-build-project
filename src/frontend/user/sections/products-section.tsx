import { useEffect, useRef } from 'react'
import '../styles/css/products-section.css'

const PRODUCTS_URL = 'https://agent.ctrl-build.my.id'

const products = [
  {
    id: '01',
    name: 'Nyx Agent',
    type: 'Web Application',
  },
  {
    id: '02',
    name: 'Nyx Agent CLI',
    type: 'Command Line Interface',
  },
]

/* Text scramble util — same pattern as services-section */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&'
function scramble(el: HTMLElement, final: string) {
  let frame = 0
  const total = 28
  const id = setInterval(() => {
    el.textContent = final
      .split('')
      .map((c, i) => {
        if (c === ' ') return ' '
        if (i < (frame / total) * final.length) return c
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      })
      .join('')
    if (++frame > total) {
      el.textContent = final
      clearInterval(id)
    }
  }, 30)
}

export const ProductsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    /* Scroll reveal */
    const revealEls = section.querySelectorAll<HTMLElement>('.prod-reveal')
    const revealObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view')
        }),
      { threshold: 0.06 }
    )
    revealEls.forEach((el) => revealObs.observe(el))

    /* Scramble headline on enter */
    const taglineEl = section.querySelector<HTMLElement>('.prod-tagline-scramble')
    if (taglineEl) {
      const final = taglineEl.textContent || ''
      const tagObs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            scramble(taglineEl, final)
            tagObs.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      tagObs.observe(taglineEl)
    }

    /* Marquee ticker — animates the long repeating text */
    const ticker = section.querySelector<HTMLElement>('.prod-ticker-inner')
    if (ticker) {
      let x = 0
      let raf: number
      const speed = 0.45
      const run = () => {
        x -= speed
        const half = ticker.scrollWidth / 2
        if (Math.abs(x) >= half) x = 0
        ticker.style.transform = `translateX(${x}px)`
        raf = requestAnimationFrame(run)
      }
      raf = requestAnimationFrame(run)
      return () => {
        revealObs.disconnect()
        cancelAnimationFrame(raf)
      }
    }

    return () => revealObs.disconnect()
  }, [])

  return (
    <section className="prod-section" id="products" ref={sectionRef}>
      {/* Background ticker */}
      <div className="prod-ticker" aria-hidden="true">
        <div className="prod-ticker-inner">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="prod-ticker-item">
              BUILT BY CTRLBUILD &nbsp;·&nbsp; BUILT BY CTRLBUILD &nbsp;·&nbsp;{' '}
            </span>
          ))}
        </div>
      </div>

      <div className="prod-container">
        {/* Header */}
        <div className="prod-header prod-reveal">
          <span className="section-label" style={{ color: 'rgba(255,255,255,0.3)' }}>
            — Products
          </span>
          <h2 className="prod-headline">
            We don't just
            <br />
            build for clients.
            <br />
            <em className="prod-tagline-scramble">We build for everyone.</em>
          </h2>
        </div>

        {/* Product rows */}
        <div className="prod-list">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="prod-row prod-reveal"
              style={{ transitionDelay: `${0.1 + i * 0.12}s` }}
            >
              {/* Number */}
              <span className="prod-num" aria-hidden="true">
                {p.id}
              </span>

              {/* Name + type */}
              <div className="prod-body">
                <span className="prod-name">{p.name}</span>
                <span className="prod-type">{p.type}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer line */}
        <div className="prod-footer prod-reveal">
          <p className="prod-footer-headline">
            Curious what we<br />can build for you?
          </p>
          <a
            href={PRODUCTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="prod-footer-cta"
          >
            Try Nyx Agent <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
