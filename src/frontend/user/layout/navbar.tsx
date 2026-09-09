import React, { useEffect, useState, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ContactModal } from '../components/ui/ContactModal'
import logoWhite from '../../../assets/images/CTRLBuild-White.png'
import logoDark  from '../../../assets/images/CTRLBuild-Black.png'

const menuItems = [
  { label: 'Home',         href: '/#hero' },
  { label: 'Services',     href: '/#services' },
  { label: 'Products',     href: '/#products' },
  { label: 'Portfolio',    href: '/#portfolio' },
  { label: 'How It Works', href: '/#workflow' },
  { label: 'Testimonials', href: '/#testimonials' },
  { label: 'Contact',      href: '/#contact' },
]

export function Navbar() {
  const [scrolled,      setScrolled]      = useState(false)
  const [heroVisible,   setHeroVisible]   = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const sectionIds = menuItems.map(m => m.href.replace('/#', ''))

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // At the very top → highlight hero
      if (isHomePage && window.scrollY < 100) {
        setActiveSection('hero')
        return
      }

      // Near the bottom of the page → highlight the last section
      if (isHomePage) {
        const nearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80
        if (nearBottom) {
          setActiveSection(sectionIds[sectionIds.length - 1])
          return
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Use a looser rootMargin so short / bottom sections still register
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { rootMargin: '-20% 0px -20% 0px', threshold: 0 })

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) sectionObs.observe(el)
    })

    let heroObs: IntersectionObserver | null = null
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

          <a href="#" className="btn btn-primary nav-cta" id="nav-cta" onClick={(e) => { e.preventDefault(); setContactModalOpen(true) }}>
            Free Consultation
          </a>

          {/* Hamburger */}
          <button
            className={`nav-hamburger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
          href="#"
          className="nav-mobile-link"
          style={{
            marginTop: '2rem',
            fontSize: 'clamp(1rem, 3vw, 1.4rem)',
            letterSpacing: '0.12em',
            opacity: 0.45,
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
          }}
          onClick={(e) => { e.preventDefault(); setContactModalOpen(true); setMenuOpen(false) }}
        >
          Free Consultation ↗
        </a>
      </div>
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </>
  )
}
