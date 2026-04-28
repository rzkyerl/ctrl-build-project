import './App.css'
import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Navbar } from './layout/navbar'
import { Footer } from './layout/footer'
import { HomePage } from './pages/Home'
import { PortofolioDetail } from './sections/portofolio-detail'
import { PortofolioMoreDetail } from './sections/portofolio-more-detail'
function App() {
  const location = useLocation()

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

  // Reset scroll on location change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<PortofolioDetail />} />
        <Route path="/projects/:id" element={<PortofolioMoreDetail />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
