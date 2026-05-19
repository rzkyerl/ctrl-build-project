import React, { useEffect, useState, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import '../../App.css'

const menuItems = [
  { label: 'Beranda',    href: '/#hero' },
  { label: 'Layanan',    href: '/#services' },
  { label: 'Portfolio',  href: '/#portfolio' },
  { label: 'Cara Kerja', href: '/#workflow' },
  { label: 'Kontak',     href: '/#contact' },
]

const logoWhite = new URL('../../assets/images/CTRLBuild-White.png', import.meta.url).href
const logoDark  = new URL('../../assets/images/CTRLBuild-Black.png', import.meta.url).href

export function Navbar() {
  const [scrolled,      setScrolled]      = useState(false)
  const [heroVisible,   setHeroVisible]   = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen,      setMenuOpen]      = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      if (isHomePage && window.scrollY < 100) setActiveSection('hero')
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { rootMargin: '-40% 0px -40% 0px' })

    menuItems.map(m => m.href.replace('/#', '')).forEach(id => {
      const el = document.getElementById(id)
      if (el) sectionObs.observe(el)
    })

    let heroObs = null
    const heroEl = document.getElementById('hero')
    if (heroEl) {
      heroObs = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.05 })
      heroObs.observe(heroEl)
    } else {
      setHeroVisible(false)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      sectionObs.disconnect()
      if (heroObs) heroObs.disconnect()
    }
  }, [location.pathname])

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const onHero = isHomePage && heroVisible

  const handleNavClick = (href) => {
    setMenuOpen(false)
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 350)
    }
  }

  return (
    <>
      <header
        className={[
          'navbar',
          (scrolled || !isHomePage) ? 'is-scrolled' : '',
          onHero ? 'navbar--on-hero' : 'navbar--off-hero',
        ].join(' ')}
      >
        <nav className="navbar-inner" aria-label="Primary">
          <Link className="brand" to="/" aria-label="CTRLBuild home" onClick={() => setMenuOpen(false)}>
            <img
              src={onHero ? logoWhite : logoDark}
              alt="CTRLBuild"
              className="brand-logo"
            />
          </Link>

          <ul className="menu">
            {menuItems.map((item) => {
              const sectionId = item.href.replace('/#', '')
              const isActive = activeSection === sectionId
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`menu-link ${isActive && isHomePage ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <a href="#contact" className="btn btn-primary nav-cta" id="nav-cta">
            Konsultasi Gratis
          </a>

          {/* Hamburger */}
          <button
            className={`nav-hamburger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <div className={`nav-mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        {menuItems.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            className="nav-mobile-link"
            style={{ transitionDelay: menuOpen ? `${i * 0.06}s` : '0s' }}
            onClick={() => handleNavClick(item.href)}
          >
            {item.label}
          </a>
        ))}
        <a
          href="https://wa.me/6285314012136"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-mobile-link"
          style={{
            marginTop: '2rem',
            fontSize: 'clamp(1rem, 3vw, 1.4rem)',
            letterSpacing: '0.12em',
            opacity: 0.45,
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
          }}
          onClick={() => setMenuOpen(false)}
        >
          Konsultasi Gratis ↗
        </a>
      </div>
    </>
  )
}
