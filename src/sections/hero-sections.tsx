import React, { useEffect, useRef } from 'react'

const logoWhite = new URL('../assets/images/CTRLBuild-White.png', import.meta.url).href

/* ═══════════════════════════════════════════════════════════
   OPTIMIZED PARTICLE TEXT
   Performance budget: ≤8 000 particles, batched draw, no sqrt per-frame
═══════════════════════════════════════════════════════════ */
function ParticleCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement> }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })!

    /* ── Particle storage: flat typed arrays for speed ── */
    const MAX = 8000
    let paused = false   // set true when hero not visible
    // ox,oy,x,y,vx,vy,size per particle (7 floats)
    let ox!: Float32Array, oy!: Float32Array
    let px!: Float32Array, py!: Float32Array
    let vx!: Float32Array, vy!: Float32Array
    let sz!: Float32Array
    let count = 0

    let W = 0, H = 0
    let rafId: number

    // Mouse state
    let mx = -9999, my = -9999, mpx = -9999, mpy = -9999
    let mouseMoved = false

    /* ── Resize (only 1x canvas — DPR handled via CSS) ── */
    let dpr = 1
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas!.offsetWidth
      H = canvas!.offsetHeight
      canvas!.width  = Math.round(W * dpr)
      canvas!.height = Math.round(H * dpr)
      buildParticles()
    }

    /* ── Build particle field from text pixels ── */
    function buildParticles() {
      const OW = W * 2, OH = H * 2   // 2× offscreen for crisp glyph
      const off = document.createElement('canvas')
      off.width = OW; off.height = OH
      const oc = off.getContext('2d')!

      const isMobile = W < 700
      const fSz = isMobile
        ? Math.floor(W * 0.18)
        : Math.floor(Math.min(W * 0.115, H * 0.26))
      const fSz2 = fSz * 2

      const lines  = ['build your', 'vision.']
      const lineH  = fSz2 * 1.08
      const startY = OH / 2 - (lineH * lines.length) / 2 + lineH * 0.76

      oc.clearRect(0, 0, OW, OH)
      oc.fillStyle    = '#fff'
      oc.font         = `900 ${fSz2}px "Arial Black", Arial, sans-serif`
      oc.textAlign    = 'center'
      oc.textBaseline = 'alphabetic'
      lines.forEach((l, i) => oc.fillText(l, OW / 2, startY + lineH * i))

      const data = oc.getImageData(0, 0, OW, OH).data

      /* gap = 6 on 2× canvas → 3px logical spacing → ~6k–9k particles */
      const gap = isMobile ? 5 : 6

      // Collect candidate positions
      const cands: [number, number][] = []
      for (let y = 0; y < OH; y += gap) {
        for (let x = 0; x < OW; x += gap) {
          if (data[(y * OW + x) * 4 + 3] > 128) {
            cands.push([x / 2, y / 2])   // back to logical px
          }
        }
      }

      // Subsample to MAX if too many
      const n = Math.min(cands.length, MAX)
      const step = cands.length / n
      count = n

      ox = new Float32Array(n)
      oy = new Float32Array(n)
      px = new Float32Array(n)
      py = new Float32Array(n)
      vx = new Float32Array(n)
      vy = new Float32Array(n)
      sz = new Float32Array(n)

      for (let i = 0; i < n; i++) {
        const [cx, cy] = cands[Math.floor(i * step)]
        ox[i] = cx;  oy[i] = cy
        px[i] = cx + (Math.random() - 0.5) * 2
        py[i] = cy + (Math.random() - 0.5) * 2
        vx[i] = 0;   vy[i] = 0
        sz[i] = Math.random() * 0.7 + 0.35   // 0.35–1.05 px logical
      }
    }

    /* ── Physics constants ── */
    const REPEL  = 80            // repulsion radius (logical px)
    const REPEL2 = REPEL * REPEL // squared — avoids sqrt for early-out
    const FLUID  = 160
    const FLUID2 = FLUID * FLUID
    const SPRING = 0.06
    const DAMP   = 0.86

    /* ── Render / physics loop ── */
    function loop() {
      rafId = requestAnimationFrame(loop)
      if (paused) return

      const mvx = mx - mpx
      const mvy = my - mpy
      const fastMouse = (mvx * mvx + mvy * mvy) > 4  // mouse is moving

      /* Physics update (typed arrays = cache-friendly) */
      for (let i = 0; i < count; i++) {
        const dx = px[i] - mx
        const dy = py[i] - my
        const d2 = dx * dx + dy * dy

        if (d2 < REPEL2 && d2 > 0) {
          /* Inner zone: repel + swirl */
          const d    = Math.sqrt(d2)          // sqrt only when really needed
          const inv  = 1 / d
          const str  = (1 - d / REPEL)
          const f    = str * str * 7

          vx[i] += dx * inv * f
          vy[i] += dy * inv * f

          if (fastMouse) {
            const tang = 0.6 * str
            const ms   = (mvx >= 0 ? 1 : -1)
            vx[i] += -dy * inv * tang * ms
            vy[i] +=  dx * inv * tang * ms
          }
        } else if (d2 < FLUID2 && fastMouse) {
          /* Outer zone: gentle drag */
          const str = (1 - Math.sqrt(d2) / FLUID) * 0.12
          vx[i] += mvx * str
          vy[i] += mvy * str
        }

        /* Spring + damping */
        vx[i] += (ox[i] - px[i]) * SPRING
        vy[i] += (oy[i] - py[i]) * SPRING
        vx[i] *= DAMP
        vy[i] *= DAMP

        px[i] += vx[i]
        py[i] += vy[i]
      }

      mpx = mx; mpy = my

      /* Batched draw: 1 path for ALL particles = 1 draw call */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 1
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        const r = sz[i]
        ctx.moveTo(px[i] + r, py[i])
        ctx.arc(px[i], py[i], r, 0, 6.283185)   // 2π pre-computed
      }
      ctx.fill()
    }

    /* ── Events ── */
    const onMove = (e: MouseEvent) => {
      const r = canvas!.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    const onTouch = (e: TouchEvent) => {
      const r = canvas!.getBoundingClientRect()
      mx = e.touches[0].clientX - r.left
      my = e.touches[0].clientY - r.top
    }
    const onLeave = () => { mx = -9999; my = -9999; mpx = -9999; mpy = -9999 }

    canvas.addEventListener('mousemove', onMove, { passive: true })
    canvas.addEventListener('touchmove', onTouch, { passive: true })
    canvas.addEventListener('mouseleave', onLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    loop()

    // Expose pause control for parent
    ;(canvas as any).__particlePause = (v: boolean) => { paused = v }

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouch)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        zIndex: 2, pointerEvents: 'auto',
        touchAction: 'pan-y',
      }}
      aria-hidden="true"
    />
  )
}

/* ─── Hero Section ──────────────────────────────────── */
export function HeroSection() {
  const heroRef   = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Pause canvas loop when hero scrolls out of viewport
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting;
      // Pause/resume particle canvas
      (canvasRef.current as any)?.__particlePause?.(!vis);
    }, { threshold: 0 })
    obs.observe(hero)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="hero" ref={heroRef} className="hero-section">
      <ParticleCanvas canvasRef={canvasRef} />

      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}>
        Build Your Vision — CTRLBuild
      </h1>

      {/* Tagline */}
      <div style={{
        position: 'absolute', bottom: 'max(12vh, 110px)', left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.38)',
          fontSize: 'clamp(0.6rem, 1.1vw, 0.76rem)',
          fontWeight: 500, letterSpacing: '0.22em',
          textTransform: 'uppercase', margin: 0,
        }}>
          Web Development&nbsp;·&nbsp;Mobile Apps&nbsp;·&nbsp;UI/UX Design
        </p>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '3.2vh', left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem', pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: '0.56rem', fontWeight: 600,
          letterSpacing: '0.26em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
        }}>Scroll</span>
        <div style={{ position: 'relative', width: 1, height: 48, background: 'rgba(255,255,255,0.1)' }}>
          <div className="scroll-line-anim" />
        </div>
      </div>

      <style>{`
        .scroll-line-anim {
          position: absolute; top: 0; left: 0; width: 100%;
          background: rgba(255,255,255,0.6);
          animation: scrollLine 1.9s ease-in-out infinite;
        }
        @keyframes scrollLine {
          0%   { height: 0%;   top: 0%; }
          49%  { height: 100%; top: 0%; }
          100% { height: 0%;   top: 100%; }
        }
      `}</style>
    </section>
  )
}