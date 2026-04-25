import './App.css'
import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { Navbar } from './layout/navbar'
import { Footer } from './layout/footer'
import { HeroSection } from './sections/hero-sections'
import { ServicesSection } from './sections/services-section'
import { PortfolioSection } from './sections/portfolio-section'
import { WorkflowSection } from './sections/workflow-section'
import { ContactSection } from './sections/contact-section'

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="app-shell">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <WorkflowSection />
      <ContactSection />
      <Footer />
    </div>
  )
}

export default App
