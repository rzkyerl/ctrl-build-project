import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/css/nyx-hero.css'

/* Resolve cross-subdomain URLs — production uses subdomains, localhost uses paths */
function getChatUrl() {
  const hostname = window.location.hostname
  if (hostname === 'agent.ctrl-build.my.id') return 'https://chat.ctrl-build.my.id'
  return '/nyx-agent/chat'
}

/* Landscape asset */
import landscapeUrl from '../../../assets/images/nyx-agent/nyx agent landscape.webp'

/* ── Social icons (inline SVG, monochrome) ── */
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .5C5.7.5.7 5.5.7 11.8c0 5 3.2 9.2 7.7 10.7.6.1.8-.2.8-.5v-2c-3.1.7-3.8-1.3-3.8-1.3-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.3-5.1-5.6 0-1.2.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.6 5.3-5.1 5.6.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.5 4.5-1.5 7.7-5.7 7.7-10.7C23.3 5.5 18.3.5 12 .5z" />
    </svg>
  )
}


/* Scramble reveal for the hero title */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&'

function scramble(el: HTMLElement, final: string) {
  let frame = 0
  const total = 28
  const id = setInterval(() => {
    el.textContent = final
      .split('')
      .map((c, i) => {
        if (c === ' ') return ' '
        if (i < (frame / total) * final.length) return c
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      })
      .join('')
    if (++frame > total) {
      el.textContent = final
      clearInterval(id)
    }
  }, 30)
}

export function NyxHero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleTopRef = useRef<HTMLSpanElement>(null)
  const titleBottomRef = useRef<HTMLSpanElement>(null)

  /* Pause ticker when off-screen */
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(
      ([e]) => {
        const track = hero.querySelector('.nyx-hero-ticker-track') as HTMLElement
        if (track) track.style.animationPlayState = e.isIntersecting ? 'running' : 'paused'
      },
      { threshold: 0 }
    )
    obs.observe(hero)
    return () => obs.disconnect()
  }, [])

  /* Scramble reveal for hero title */
  useEffect(() => {
    if (titleTopRef.current) scramble(titleTopRef.current, 'NYX')
    if (titleBottomRef.current) {
      setTimeout(() => {
        if (titleBottomRef.current) scramble(titleBottomRef.current, 'AGENT')
      }, 400)
    }
  }, [])

  const ticker = 'NYX AGENT · NYX AGENT · NYX AGENT · NYX AGENT · NYX AGENT · NYX AGENT'
  const tickerLoop = ticker.repeat(4)

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="nyx-hero" ref={heroRef} id="hero">
      {/* Background */}
      <div className="nyx-hero-bg">
        <img src={landscapeUrl} alt="Nyx Agent" loading="eager" />
      </div>

      {/* ── Hero nav (3-column: CTRL | NYX AGENT | INSTALL) ── */}
      <div className="nyx-hero-nav">
        {/* LEFT — CTRL */}
        <Link to="/" className="nyx-hero-nav-side nyx-hero-nav-left">
          CTRL BUILD
        </Link>

        {/* CENTER — NYX AGENT + socials */}
        <div className="nyx-hero-nav-center">
          <span className="nyx-hero-nav-title">
            <span className="nyx-hero-nav-title-line">NYX</span>
            <span className="nyx-hero-nav-title-line">AGENT</span>
          </span>
          <span className="nyx-hero-nav-socials">
            <a
              href="https://github.com/rzkyerl/ctrl-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="nyx-hero-nav-social"
              aria-label="GitHub"
            >
              <GithubIcon />
            </a>
          </span>
        </div>

        {/* RIGHT — CHAT */}
        <a
          href={getChatUrl()}
          className="nyx-hero-nav-side nyx-hero-nav-right"
        >
          AGENT CHAT<span className="nyx-hero-nav-arrow"></span>
        </a>
      </div>

      {/* Content */}
      <div className="nyx-hero-content">
        <h1 className="nyx-hero-title">
          <span ref={titleTopRef} className="nyx-hero-title-line">NYX</span>
          <br />
          <span ref={titleBottomRef} className="nyx-hero-title-line">AGENT</span>
        </h1>
      </div>

      {/* Ticker */}
      <div className="nyx-hero-ticker" aria-hidden="true">
        <div className="nyx-hero-ticker-track">
          <span>{tickerLoop}</span>
          <span>{tickerLoop}</span>
        </div>
      </div>
    </section>
  )
}
