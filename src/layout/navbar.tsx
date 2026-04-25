import React, { useEffect, useState } from 'react'
import '../App.css'

const menuItems = [
  { label: 'Layanan',    href: '#services' },
  { label: 'Portfolio',  href: '#portfolio' },
  { label: 'Cara Kerja', href: '#workflow' },
  { label: 'Kontak',     href: '#contact' },
]

const logoWhite = new URL('../assets/images/CTRLBuild-White.png', import.meta.url).href
const logoDark  = new URL('../assets/images/CTRLBuild-Black.png', import.meta.url).href

export function Navbar() {
  const [scrolled,     setScrolled]     = useState(false)
  const [heroVisible,  setHeroVisible]  = useState(true)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    const heroEl = document.getElementById('hero')
    if (heroEl) {
      const obs = new IntersectionObserver(
        ([e]) => setHeroVisible(e.isIntersecting),
        { threshold: 0.05 }
      )
      obs.observe(heroEl)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        obs.disconnect()
      }
    }
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const onHero = heroVisible

  return (
    <header
      className={[
        'navbar',
        scrolled   ? 'is-scrolled'    : '',
        onHero     ? 'navbar--on-hero' : 'navbar--off-hero',
      ].join(' ')}
    >
      <nav className="navbar-inner" aria-label="Primary">
        <a className="brand" href="#top" aria-label="CTRLBuild home">
          <img
            src={onHero ? logoWhite : logoDark}
            alt="CTRLBuild"
            className="brand-logo"
          />
        </a>

        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a href={item.href} className="menu-link">{item.label}</a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="btn btn-primary nav-cta" id="nav-cta">
          Konsultasi Gratis
        </a>
      </nav>
    </header>
  )
}
