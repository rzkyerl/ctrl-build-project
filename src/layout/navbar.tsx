import React, { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import '../App.css'

const menuItems = [
  { label: 'Beranda',    href: '/#hero' },
  { label: 'Layanan',    href: '/#services' },
  { label: 'Portfolio',  href: '/#portfolio' },
  { label: 'Cara Kerja', href: '/#workflow' },
  { label: 'Kontak',     href: '/#contact' },
]

const logoWhite = new URL('../assets/images/CTRLBuild-White.png', import.meta.url).href
const logoDark  = new URL('../assets/images/CTRLBuild-Black.png', import.meta.url).href

export function Navbar() {
  const [scrolled,     setScrolled]     = useState(false)
  const [heroVisible,  setHeroVisible]  = useState(true)
  const [activeSection, setActiveSection] = useState('')
  const location = useLocation()
  
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      if (isHomePage && window.scrollY < 100) {
        setActiveSection('hero')
      }
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Observer for active menu links
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, {
      // Look for sections in the middle of the screen
      rootMargin: '-40% 0px -40% 0px'
    })

    const sectionsToObserve = menuItems.map(m => m.href.replace('/#', ''))
    sectionsToObserve.forEach(id => {
      const el = document.getElementById(id)
      if (el) sectionObserver.observe(el)
    })

    // Observer specifically for hero transparency
    const heroEl = document.getElementById('hero')
    let heroObs: IntersectionObserver | null = null
    if (heroEl) {
      heroObs = new IntersectionObserver(
        ([e]) => setHeroVisible(e.isIntersecting),
        { threshold: 0.05 }
      )
      heroObs.observe(heroEl)
    } else {
      setHeroVisible(false)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      sectionObserver.disconnect()
      if (heroObs) heroObs.disconnect()
    }
  }, [location.pathname])

  const onHero = isHomePage && heroVisible

  return (
    <header
      className={[
        'navbar',
        (scrolled || !isHomePage) ? 'is-scrolled' : '',
        onHero ? 'navbar--on-hero' : 'navbar--off-hero',
      ].join(' ')}
    >
      <nav className="navbar-inner" aria-label="Primary">
        <Link className="brand" to="/" aria-label="CTRLBuild home">
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
      </nav>
    </header>
  )
}
