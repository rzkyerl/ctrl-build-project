import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/* ── Three.js Network Background ────────────────── */
function ThreeNetwork() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let W = el.offsetWidth, H = el.offsetHeight

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    camera.position.z = 30

    /* ── Nodes ── */
    const N = 90
    const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N)
    const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      px[i] = (Math.random() - .5) * 48
      py[i] = (Math.random() - .5) * 28
      pz[i] = (Math.random() - .5) * 18
      vx[i] = (Math.random() - .5) * .025
      vy[i] = (Math.random() - .5) * .025
      vz[i] = (Math.random() - .5) * .012
    }

    /* Points */
    const ptArr   = new Float32Array(N * 3)
    const ptGeo   = new THREE.BufferGeometry()
    const ptAttr  = new THREE.BufferAttribute(ptArr, 3)
    ptAttr.setUsage(THREE.DynamicDrawUsage)
    ptGeo.setAttribute('position', ptAttr)
    const ptMesh  = new THREE.Points(ptGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .18, transparent: true, opacity: .55 }))
    scene.add(ptMesh)

    /* Lines */
    const MAX_L  = 400
    const lnArr  = new Float32Array(MAX_L * 6)
    const lnGeo  = new THREE.BufferGeometry()
    const lnAttr = new THREE.BufferAttribute(lnArr, 3)
    lnAttr.setUsage(THREE.DynamicDrawUsage)
    lnGeo.setAttribute('position', lnAttr)
    const lnMesh = new THREE.LineSegments(lnGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .06 }))
    scene.add(lnMesh)

    const THRESH = 10, THRESH2 = THRESH * THRESH

    let rafId: number, t = 0

    function animate() {
      rafId = requestAnimationFrame(animate)
      t += .005

      /* Update positions */
      for (let i = 0; i < N; i++) {
        px[i] += vx[i]; py[i] += vy[i]; pz[i] += vz[i]
        if (Math.abs(px[i]) > 25) vx[i] *= -1
        if (Math.abs(py[i]) > 15) vy[i] *= -1
        if (Math.abs(pz[i]) > 10) vz[i] *= -1
        ptArr[i * 3] = px[i]; ptArr[i * 3 + 1] = py[i]; ptArr[i * 3 + 2] = pz[i]
      }
      ptAttr.needsUpdate = true

      /* Update lines */
      let lc = 0
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N && lc < MAX_L; j++) {
          const dx = px[i]-px[j], dy = py[i]-py[j], dz = pz[i]-pz[j]
          if (dx*dx + dy*dy + dz*dz < THRESH2) {
            const b = lc * 6
            lnArr[b]=px[i]; lnArr[b+1]=py[i]; lnArr[b+2]=pz[i]
            lnArr[b+3]=px[j]; lnArr[b+4]=py[j]; lnArr[b+5]=pz[j]
            lc++
          }
        }
      }
      lnAttr.needsUpdate = true
      lnGeo.setDrawRange(0, lc * 2)

      /* Mouse parallax camera */
      camera.position.x += (mouseRef.current.x * 4 - camera.position.x) * .04
      camera.position.y += (mouseRef.current.y * 2.5 - camera.position.y) * .04
      camera.lookAt(scene.position)

      /* Gentle auto-rotation */
      scene.rotation.y = Math.sin(t * .25) * .12
      scene.rotation.x = Math.sin(t * .18) * .05

      renderer.render(scene, camera)
    }
    animate()

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: (e.clientX/W-.5)*2, y: -(e.clientY/H-.5)*2 }
    }
    const onResize = () => {
      W = el.offsetWidth; H = el.offsetHeight
      camera.aspect = W/H; camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0, zIndex: 1,
      pointerEvents: 'none',
    }} aria-hidden="true" />
  )
}

/* ── Optimised Particle Canvas ───────────────────── */
function ParticleCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement> }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })!

    const MAX = 8000
    let paused = false
    let ox!: Float32Array, oy!: Float32Array
    let px!: Float32Array, py!: Float32Array
    let vx!: Float32Array, vy!: Float32Array
    let sz!: Float32Array
    let count = 0, W = 0, H = 0, rafId: number
    let mx = -9999, my = -9999, mpx = -9999, mpy = -9999
    let dpr = 1

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas!.offsetWidth; H = canvas!.offsetHeight
      canvas!.width = Math.round(W * dpr); canvas!.height = Math.round(H * dpr)
      buildParticles()
    }

    function buildParticles() {
      const OW = W * 2, OH = H * 2
      const off = document.createElement('canvas')
      off.width = OW; off.height = OH
      const oc = off.getContext('2d')!
      const isMobile = W < 700
      const fSz = isMobile ? Math.floor(W * .18) : Math.floor(Math.min(W * .115, H * .26))
      const fSz2 = fSz * 2
      const lines = ['build your', 'vision.']
      const lineH = fSz2 * 1.08
      const startY = OH / 2 - (lineH * lines.length) / 2 + lineH * .76
      oc.clearRect(0, 0, OW, OH)
      oc.fillStyle = '#fff'
      oc.font = `700 ${fSz2}px "Space Grotesk", Arial, sans-serif`
      oc.textAlign = 'center'; oc.textBaseline = 'alphabetic'
      lines.forEach((l, i) => oc.fillText(l, OW / 2, startY + lineH * i))
      const data = oc.getImageData(0, 0, OW, OH).data
      const gap = isMobile ? 5 : 6
      const cands: [number, number][] = []
      for (let y = 0; y < OH; y += gap)
        for (let x = 0; x < OW; x += gap)
          if (data[(y * OW + x) * 4 + 3] > 128) cands.push([x / 2, y / 2])
      const n = Math.min(cands.length, MAX); const step = cands.length / n; count = n
      ox = new Float32Array(n); oy = new Float32Array(n)
      px = new Float32Array(n); py = new Float32Array(n)
      vx = new Float32Array(n); vy = new Float32Array(n)
      sz = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const [cx, cy] = cands[Math.floor(i * step)]
        ox[i] = cx; oy[i] = cy
        px[i] = cx + (Math.random() - .5) * 2; py[i] = cy + (Math.random() - .5) * 2
        vx[i] = 0; vy[i] = 0; sz[i] = Math.random() * .8 + .4
      }
    }

    const REPEL = 80, REPEL2 = 6400, FLUID2 = 25600, SPRING = .06, DAMP = .86

    function loop() {
      rafId = requestAnimationFrame(loop)
      if (paused) return
      const mvx = mx - mpx, mvy = my - mpy
      const fastMouse = mvx * mvx + mvy * mvy > 4
      for (let i = 0; i < count; i++) {
        const dx = px[i] - mx, dy = py[i] - my, d2 = dx * dx + dy * dy
        if (d2 < REPEL2 && d2 > 0) {
          const d = Math.sqrt(d2), inv = 1 / d, str = (1 - d / REPEL), f = str * str * 7
          vx[i] += dx * inv * f; vy[i] += dy * inv * f
          if (fastMouse) {
            const tang = .6 * str, ms = mvx >= 0 ? 1 : -1
            vx[i] += -dy * inv * tang * ms; vy[i] += dx * inv * tang * ms
          }
        } else if (d2 < FLUID2 && fastMouse) {
          const str = (1 - Math.sqrt(d2) / 160) * .12
          vx[i] += mvx * str; vy[i] += mvy * str
        }
        vx[i] += (ox[i] - px[i]) * SPRING; vy[i] += (oy[i] - py[i]) * SPRING
        vx[i] *= DAMP; vy[i] *= DAMP
        px[i] += vx[i]; py[i] += vy[i]
      }
      mpx = mx; mpy = my
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const r = sz[i]
        ctx.moveTo(px[i] + r, py[i])
        ctx.arc(px[i], py[i], r, 0, 6.283185)
      }
      ctx.fill()
    }

    const onMove = (e: MouseEvent) => {
      const r = canvas!.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
    }
    const onTouch = (e: TouchEvent) => {
      const r = canvas!.getBoundingClientRect()
      mx = e.touches[0].clientX - r.left; my = e.touches[0].clientY - r.top
    }
    const onLeave = () => { mx = -9999; my = -9999; mpx = -9999; mpy = -9999 }

    canvas.addEventListener('mousemove', onMove, { passive: true })
    canvas.addEventListener('touchmove', onTouch, { passive: true })
    canvas.addEventListener('mouseleave', onLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize(); loop()
    ;(canvas as any).__particlePause = (v: boolean) => { paused = v }

    return () => {
      cancelAnimationFrame(rafId); ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouch)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      zIndex: 2, pointerEvents: 'auto', touchAction: 'pan-y',
    }} aria-hidden="true" />
  )
}

/* ── Hero Section ────────────────────────────────── */
export function HeroSection() {
  const heroRef   = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(([e]) => {
      ;(canvasRef.current as any)?.__particlePause?.(!e.isIntersecting)
    }, { threshold: 0 })
    obs.observe(hero)
    return () => obs.disconnect()
  }, [])

  const ticker = 'WEB DEVELOPMENT · MOBILE APPS · UI/UX DESIGN · 2025 · CTRLBUILD · '.repeat(4)

  return (
    <section id="hero" ref={heroRef} className="hero-section">
      {/* Layer 1 – Three.js network */}
      <ThreeNetwork />

      {/* Layer 2 – Particle text canvas */}
      <ParticleCanvas canvasRef={canvasRef} />

      {/* SEO h1 */}
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
        CTRLBuild — Jasa Pembuatan Website &amp; Aplikasi Mobile Professional
      </h1>

      {/* Top corners */}
      <div className="hero-meta hero-meta--left" aria-hidden="true">Est. 2023</div>
      <div className="hero-meta hero-meta--right" aria-hidden="true">Pembangun Negeri</div>

      {/* Tagline */}
      <div className="hero-tagline" aria-hidden="true">
        Web Development&nbsp;·&nbsp;Mobile Apps&nbsp;·&nbsp;UI/UX Design
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll" aria-hidden="true">
        <span className="hero-scroll__label">Scroll</span>
        <div className="hero-scroll__line"><div className="hero-scroll__bar" /></div>
      </div>

      {/* Ticker */}
      <div className="hero-ticker" aria-hidden="true">
        <div className="hero-ticker__track"><span>{ticker}</span><span>{ticker}</span></div>
      </div>

      <style>{`
        .hero-meta {
          position: absolute; top: calc(70px + 2.5rem); z-index: 10;
          font-size: .6rem; font-weight: 700; letter-spacing: .22em;
          text-transform: uppercase; color: rgba(255,255,255,.25);
          pointer-events: none;
        }
        .hero-meta--left  { left: 3rem; }
        .hero-meta--right { right: 3rem; }

        .hero-tagline {
          position: absolute; bottom: max(13vh, 120px); left: 50%;
          transform: translateX(-50%); z-index: 10;
          font-size: clamp(.55rem, 1vw, .7rem); font-weight: 600;
          letter-spacing: .26em; text-transform: uppercase;
          color: rgba(255,255,255,.3); white-space: nowrap;
          pointer-events: none;
        }

        .hero-scroll {
          position: absolute; bottom: 3.5vh; left: 50%;
          transform: translateX(-50%); z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          gap: .5rem; pointer-events: none;
        }
        .hero-scroll__label {
          font-size: .5rem; font-weight: 700; letter-spacing: .28em;
          text-transform: uppercase; color: rgba(255,255,255,.22);
        }
        .hero-scroll__line {
          position: relative; width: 1px; height: 52px;
          background: rgba(255,255,255,.08);
        }
        .hero-scroll__bar {
          position: absolute; top: 0; left: 0; width: 100%;
          background: rgba(255,255,255,.55);
          animation: scrollLine 2s ease-in-out infinite;
        }
        @keyframes scrollLine {
          0%   { height: 0%;   top: 0%; }
          49%  { height: 100%; top: 0%; }
          100% { height: 0%;   top: 100%; }
        }

        .hero-ticker {
          position: absolute; bottom: 0; left: 0; right: 0;
          overflow: hidden; height: 38px;
          border-top: 1px solid rgba(255,255,255,.06);
          z-index: 10; display: flex; align-items: center;
          pointer-events: none;
        }
        .hero-ticker__track {
          display: flex; white-space: nowrap;
          animation: tickerScroll 28s linear infinite;
        }
        .hero-ticker__track span {
          font-size: .58rem; font-weight: 700; letter-spacing: .18em;
          text-transform: uppercase; color: rgba(255,255,255,.18);
          padding: 0 1rem;
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}