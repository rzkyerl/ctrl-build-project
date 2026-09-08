import './App.css'
import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'

// User
import { Navbar }               from './frontend/user/layout/navbar'
import { Footer }               from './frontend/user/layout/footer'
import { HomePage }             from './frontend/user/pages/Home'
import { PortofolioDetail }     from './frontend/user/sections/portofolio-detail'
import { PortofolioMoreDetail } from './frontend/user/sections/portofolio-more-detail'

// Admin layout & auth
import { AdminLayout }    from './frontend/admin/components/AdminLayout'
import { ProtectedRoute } from './frontend/admin/components/ProtectedRoute'
import Login              from './frontend/admin/pages/Login'

// Admin pages — lazy-loaded to keep public bundle small
import { lazy, Suspense } from 'react'
const Dashboard       = lazy(() => import('./frontend/admin/pages/Dashboard'))
const PortfolioList   = lazy(() => import('./frontend/admin/pages/portfolio/index'))
const PortfolioCreate = lazy(() => import('./frontend/admin/pages/portfolio/create'))
const PortfolioEdit   = lazy(() => import('./frontend/admin/pages/portfolio/edit'))
const PortfolioDetail = lazy(() => import('./frontend/admin/pages/portfolio/detail'))
const StackList       = lazy(() => import('./frontend/admin/pages/stack/index'))
const StackCreate     = lazy(() => import('./frontend/admin/pages/stack/create'))
const StackEdit       = lazy(() => import('./frontend/admin/pages/stack/edit'))

// AI Chat page — lazy-loaded
const AiChatPage = lazy(() => import('./frontend/ai-chat/AiChatPage'))

/* Admin loading fallback */
function AdminFallback() {
  return (
    <div className="ad-loading" style={{ height: '100vh' }}>
      LOADING...
    </div>
  )
}

/* Custom Cursor */
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

/* Scroll Progress Bar */
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

/* Magnetic Buttons */
function MagneticEffect() {
  useEffect(() => {
    const SELECTORS = '.btn-primary, .ct-btn--primary, .pf-view-all-btn, .nav-cta'
    const STRENGTH  = 0.35
    const RADIUS    = 90

    const btnData     = new Map()
    const btnCleanups = []

    let pendingRaf = null
    let mouseX = 0
    let mouseY = 0

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (pendingRaf !== null) return
      pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null
        btnData.forEach(({ rect }, btn) => {
          const cx   = rect.left + rect.width  / 2
          const cy   = rect.top  + rect.height / 2
          const dx   = mouseX - cx
          const dy   = mouseY - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < RADIUS) {
            const pull = (1 - dist / RADIUS) * STRENGTH
            btn.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`
          }
        })
      })
    }

    const bindBtn = (btn) => {
      if (btn.__magneticBound) return
      btn.__magneticBound = true
      const onEnter = () => {
        btnData.set(btn, { rect: btn.getBoundingClientRect() })
        btn.style.transition = 'transform .1s linear'
        btn.style.willChange = 'transform'
      }
      const onLeave = () => {
        btnData.delete(btn)
        btn.style.transform = ''
        btn.style.transition = 'transform .65s cubic-bezier(0.19,1,0.22,1)'
        const onEnd = () => { btn.style.willChange = ''; btn.removeEventListener('transitionend', onEnd) }
        btn.addEventListener('transitionend', onEnd)
      }
      btn.addEventListener('mouseenter', onEnter)
      btn.addEventListener('mouseleave', onLeave)
      btnCleanups.push(() => {
        btn.removeEventListener('mouseenter', onEnter)
        btn.removeEventListener('mouseleave', onLeave)
      })
    }

    const apply = () => document.querySelectorAll(SELECTORS).forEach(bindBtn)
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    const obs = new MutationObserver(apply)
    obs.observe(document.body, { childList: true, subtree: true })
    apply()

    return () => {
      if (pendingRaf !== null) cancelAnimationFrame(pendingRaf)
      document.removeEventListener('mousemove', onMouseMove)
      btnCleanups.forEach(fn => fn())
      obs.disconnect()
    }
  }, [])

  return null
}

/* App */
function App() {
  const location     = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isChatRoute  = location.pathname.startsWith('/chat')

  // Routes that use default cursor (no custom cursor / lenis / magnetic)
  const isAppRoute = isAdminRoute || isChatRoute

  useEffect(() => {
    if (isAppRoute) {
      document.body.style.cursor = 'auto'
      if (isAdminRoute) document.body.dataset.adminPage = 'true'
      else delete document.body.dataset.adminPage
    } else {
      document.body.style.cursor = 'none'
      delete document.body.dataset.adminPage
    }
  }, [isAppRoute, isAdminRoute])

  useEffect(() => {
    if (isAppRoute) return
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
  }, [isAppRoute])

  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  if (isChatRoute) {
    return (
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/chat"            element={<AiChatPage />} />
          <Route path="/chat/:sessionId" element={<AiChatPage />} />
        </Routes>
      </Suspense>
    )
  }

  if (isAdminRoute) {
    return (
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          {/* Public admin route */}
          <Route path="/admin/login" element={<Login />} />

          {/* Protected admin routes — wrapped in AdminLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin"                          element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard"                element={<Dashboard />} />
              <Route path="/admin/portfolios"               element={<PortfolioList />} />
              <Route path="/admin/portfolios/create"        element={<PortfolioCreate />} />
              <Route path="/admin/portfolios/:id"           element={<PortfolioDetail />} />
              <Route path="/admin/portfolios/:id/edit"      element={<PortfolioEdit />} />
              <Route path="/admin/stacks"                   element={<StackList />} />
              <Route path="/admin/stacks/create"            element={<StackCreate />} />
              <Route path="/admin/stacks/:id/edit"          element={<StackEdit />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
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
