import './App.css'
import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Navbar }               from './frontend/layout/navbar'
import { Footer }               from './frontend/layout/footer'
import { HomePage }             from './frontend/pages/Home'
import { PortofolioDetail }     from './frontend/sections/portofolio-detail'
import { PortofolioMoreDetail } from './frontend/sections/portofolio-more-detail'
import { Login }                from './frontend/pages/admin/Login'
import { Dashboard }            from './frontend/pages/admin/Dashboard'
import { Portfolios }           from './frontend/pages/admin/Portfolio/Portfolios'
import { CreatePortfolio }      from './frontend/pages/admin/Portfolio/CreatePortfolio'
import { EditPortfolio }        from './frontend/pages/admin/Portfolio/EditPortfolio'
import { ShowPortfolio }        from './frontend/pages/admin/Portfolio/ShowPortfolio'
import { AdminLayout }          from './frontend/components/admin/AdminLayout'
import { ProtectedRoute }       from './frontend/components/admin/ProtectedRoute'
import { useAuth }              from './frontend/contexts/AuthContext'

/* ── Custom Cursor ───────────────────────────────── */
function CustomCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)
  const pos  = useRef({ x: -200, y: -200 })
  const ring = useRef({ x: -200, y: -200 })

  useEffect(() => {
    const dot    = dotRef.current
    const ringEl = ringRef.current
    if (!dot || !ringEl) return

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }

    let rafId
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * .11
      ring.current.y += (pos.current.y - ring.current.y) * .11
      ringEl.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    const onEnter = () => document.body.classList.add('cursor-hover')
    const onLeave = () => document.body.classList.remove('cursor-hover')
    document.addEventListener('mousemove', onMove, { passive: true })

    const bindHover = () => {
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    bindHover()
    const obs = new MutationObserver(bindHover)
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
      obs.disconnect()
    }
  }, [])

  return (
    <div id="custom-cursor" aria-hidden="true">
      <div id="cursor-dot"  ref={dotRef}  style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }} />
      <div id="cursor-ring" ref={ringRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }} />
    </div>
  )
}

/* ── Scroll Progress Bar ─────────────────────────── */
function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (h > 0) bar.style.transform = `scaleX(${window.scrollY / h})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div id="scroll-progress" ref={barRef} aria-hidden="true" />
}

/* ── Magnetic Buttons ────────────────────────────── */
function MagneticEffect() {
  useEffect(() => {
    const SELECTORS = '.btn-primary, .ct-btn--primary, .pf-view-all-btn, .nav-cta'
    const STRENGTH  = 0.35
    const RADIUS    = 90
    const cleanups  = []

    const apply = () => {
      document.querySelectorAll(SELECTORS).forEach(btn => {
        if (btn.__magneticBound) return   // avoid double-binding
        btn.__magneticBound = true

        const onMove = (e) => {
          const r    = btn.getBoundingClientRect()
          const cx   = r.left + r.width  / 2
          const cy   = r.top  + r.height / 2
          const dx   = e.clientX - cx
          const dy   = e.clientY - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < RADIUS) {
            const pull = (1 - dist / RADIUS) * STRENGTH
            btn.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`
            btn.style.transition = 'transform .1s linear'
          }
        }
        const onLeave = () => {
          btn.style.transform = ''
          btn.style.transition = 'transform .65s cubic-bezier(0.19,1,0.22,1)'
        }

        document.addEventListener('mousemove', onMove, { passive: true })
        btn.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          document.removeEventListener('mousemove', onMove)
          btn.removeEventListener('mouseleave', onLeave)
        })
      })
    }

    const obs = new MutationObserver(apply)
    obs.observe(document.body, { childList: true, subtree: true })
    apply()

    return () => { cleanups.forEach(fn => fn()); obs.disconnect() }
  }, [])

  return null
}

/* ═══════════════════════════════════════════════════
   App
═══════════════════════════════════════════════════ */
function App() {
  const location = useLocation()
  const { user } = useAuth()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Handle admin page cursor
  useEffect(() => {
    if (isAdminRoute) {
      document.body.style.cursor = 'auto'
      document.body.dataset.adminPage = 'true'
    } else {
      document.body.style.cursor = 'none'
      delete document.body.dataset.adminPage
    }
  }, [isAdminRoute])

  useEffect(() => {
    if (isAdminRoute) return
    
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 2,
    })
    let rafId
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf) }
    rafId = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(rafId); lenis.destroy() }
  }, [isAdminRoute])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  if (isAdminRoute) {
        return (
          <Routes>
            <Route path="/admin/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/portfolios" element={<Portfolios />} />
                <Route path="/admin/portfolios/create" element={<CreatePortfolio />} />
                <Route path="/admin/portfolios/:id" element={<ShowPortfolio />} />
                <Route path="/admin/portfolios/:id/edit" element={<EditPortfolio />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        )
      }

  return (
    <div className="app-shell">
      <ScrollProgress />
      <CustomCursor />
      <MagneticEffect />
      <Navbar />
      <Routes>
        <Route path="/"             element={<HomePage />} />
        <Route path="/projects"     element={<PortofolioDetail />} />
        <Route path="/projects/:id" element={<PortofolioMoreDetail />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
