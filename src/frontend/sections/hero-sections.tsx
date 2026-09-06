import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// Import the GLB file so Vite processes it and generates the correct URL in production.
// Without this, the path '/src/assets/3d/ai_robot.glb' is only valid on the dev server.
import aiRobotUrl from '../../assets/3d/ai_robot.glb?url'
import { ThreeErrorBoundary } from '../components/ui/ThreeErrorBoundary'

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

    // WebGL context creation can fail in headless/constrained environments.
    // Throw so the enclosing ThreeErrorBoundary can catch and suppress the component.
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch (err) {
      throw new Error(`[ThreeNetwork] WebGL context creation failed: ${err}`)
    }
    if (!renderer.getContext()) {
      renderer.dispose()
      throw new Error('[ThreeNetwork] WebGL context is null after creation')
    }

    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    camera.position.z = 30

    const N = 90
    const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N)
    const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      px[i] = (Math.random() - .5) * 48; py[i] = (Math.random() - .5) * 28; pz[i] = (Math.random() - .5) * 18
      vx[i] = (Math.random() - .5) * .025; vy[i] = (Math.random() - .5) * .025; vz[i] = (Math.random() - .5) * .012
    }

    const ptArr  = new Float32Array(N * 3)
    const ptGeo  = new THREE.BufferGeometry()
    const ptAttr = new THREE.BufferAttribute(ptArr, 3)
    ptAttr.setUsage(THREE.DynamicDrawUsage)
    ptGeo.setAttribute('position', ptAttr)
    scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .18, transparent: true, opacity: .55 })))

    const MAX_L = 400
    const lnArr  = new Float32Array(MAX_L * 6)
    const lnGeo  = new THREE.BufferGeometry()
    const lnAttr = new THREE.BufferAttribute(lnArr, 3)
    lnAttr.setUsage(THREE.DynamicDrawUsage)
    lnGeo.setAttribute('position', lnAttr)
    const lnMesh = new THREE.LineSegments(lnGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .06 }))
    scene.add(lnMesh)

    const THRESH2 = 100
    let rafId: number, t = 0

    function animate() {
      rafId = requestAnimationFrame(animate)
      t += .005
      for (let i = 0; i < N; i++) {
        px[i] += vx[i]; py[i] += vy[i]; pz[i] += vz[i]
        if (Math.abs(px[i]) > 25) vx[i] *= -1
        if (Math.abs(py[i]) > 15) vy[i] *= -1
        if (Math.abs(pz[i]) > 10) vz[i] *= -1
        ptArr[i*3]=px[i]; ptArr[i*3+1]=py[i]; ptArr[i*3+2]=pz[i]
      }
      ptAttr.needsUpdate = true
      let lc = 0
      for (let i = 0; i < N; i++) {
        for (let j = i+1; j < N && lc < MAX_L; j++) {
          const dx=px[i]-px[j], dy=py[i]-py[j], dz=pz[i]-pz[j]
          if (dx*dx+dy*dy+dz*dz < THRESH2) {
            const b=lc*6; lnArr[b]=px[i]; lnArr[b+1]=py[i]; lnArr[b+2]=pz[i]
            lnArr[b+3]=px[j]; lnArr[b+4]=py[j]; lnArr[b+5]=pz[j]; lc++
          }
        }
      }
      lnAttr.needsUpdate = true; lnGeo.setDrawRange(0, lc*2)
      camera.position.x += (mouseRef.current.x*4 - camera.position.x)*.04
      camera.position.y += (mouseRef.current.y*2.5 - camera.position.y)*.04
      camera.lookAt(scene.position)
      scene.rotation.y = Math.sin(t*.25)*.12; scene.rotation.x = Math.sin(t*.18)*.05
      renderer.render(scene, camera)
    }
    animate()

    const onMove = (e: MouseEvent) => { mouseRef.current = { x:(e.clientX/W-.5)*2, y:-(e.clientY/H-.5)*2 } }
    const onResize = () => { W=el.offsetWidth; H=el.offsetHeight; camera.aspect=W/H; camera.updateProjectionMatrix(); renderer.setSize(W,H) }
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

  return <div ref={containerRef} style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none' }} aria-hidden="true" />
}

/* ── Particle Canvas ─────────────────────────────── */
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
    let mx = -9999, my = -9999, mpx = -9999, mpy = -9999, dpr = 1

    function resize() {
      dpr = Math.min(window.devicePixelRatio||1, 2)
      W = canvas!.offsetWidth; H = canvas!.offsetHeight
      canvas!.width = Math.round(W*dpr); canvas!.height = Math.round(H*dpr)
      buildParticles()
    }

    function buildParticles() {
      // Guard against zero-sized canvas to avoid IndexSizeError
      if (canvas!.offsetWidth===0 || canvas!.offsetHeight===0) {
        setTimeout(buildParticles, 100)
        return
      }
      const OW=W*2, OH=H*2
      const off = document.createElement('canvas'); off.width=OW; off.height=OH
      const oc = off.getContext('2d')!
      const isMobile = W < 700
      const fSz = isMobile ? Math.floor(W*.18) : Math.floor(Math.min(W*.115, H*.26))
      const fSz2 = fSz*2
      const lines = ['build your','vision.']
      const lineH = fSz2*1.08
      const startY = OH/2-(lineH*lines.length)/2+lineH*.76
      oc.clearRect(0,0,OW,OH); oc.fillStyle='#fff'
      oc.font=`700 ${fSz2}px "Space Grotesk", Arial, sans-serif`
      oc.textAlign='center'; oc.textBaseline='alphabetic'
      lines.forEach((l,i) => oc.fillText(l, OW/2, startY+lineH*i))
      const data = oc.getImageData(0,0,OW,OH).data
      const gap = isMobile ? 5 : 6
      const cands: [number,number][] = []
      for (let y=0; y<OH; y+=gap) for (let x=0; x<OW; x+=gap)
        if (data[(y*OW+x)*4+3]>128) cands.push([x/2, y/2])
      const n=Math.min(cands.length,MAX); const step=cands.length/n; count=n
      ox=new Float32Array(n); oy=new Float32Array(n)
      px=new Float32Array(n); py=new Float32Array(n)
      vx=new Float32Array(n); vy=new Float32Array(n); sz=new Float32Array(n)
      for (let i=0; i<n; i++) {
        const [cx,cy]=cands[Math.floor(i*step)]
        ox[i]=cx; oy[i]=cy; px[i]=cx+(Math.random()-.5)*2; py[i]=cy+(Math.random()-.5)*2
        vx[i]=0; vy[i]=0; sz[i]=Math.random()*.8+.4
      }
    }

    const REPEL=80, REPEL2=6400, FLUID2=25600, SPRING=.06, DAMP=.86

    function loop() {
      rafId = requestAnimationFrame(loop)
      if (paused) return
      const mvx=mx-mpx, mvy=my-mpy, fastMouse=mvx*mvx+mvy*mvy>4
      for (let i=0; i<count; i++) {
        const dx=px[i]-mx, dy=py[i]-my, d2=dx*dx+dy*dy
        if (d2<REPEL2&&d2>0) {
          const d=Math.sqrt(d2), inv=1/d, str=(1-d/REPEL), f=str*str*7
          vx[i]+=dx*inv*f; vy[i]+=dy*inv*f
          if (fastMouse) { const tang=.6*str, ms=mvx>=0?1:-1; vx[i]+=-dy*inv*tang*ms; vy[i]+=dx*inv*tang*ms }
        } else if (d2<FLUID2&&fastMouse) { const str=(1-Math.sqrt(d2)/160)*.12; vx[i]+=mvx*str; vy[i]+=mvy*str }
        vx[i]+=(ox[i]-px[i])*SPRING; vy[i]+=(oy[i]-py[i])*SPRING
        vx[i]*=DAMP; vy[i]*=DAMP; px[i]+=vx[i]; py[i]+=vy[i]
      }
      mpx=mx; mpy=my
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H)
      ctx.fillStyle='#ffffff'; ctx.beginPath()
      for (let i=0; i<count; i++) { const r=sz[i]; ctx.moveTo(px[i]+r,py[i]); ctx.arc(px[i],py[i],r,0,6.283185) }
      ctx.fill()
    }

    const onMove  = (e: MouseEvent)  => { const r=canvas!.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top }
    const onTouch = (e: TouchEvent)  => { const r=canvas!.getBoundingClientRect(); mx=e.touches[0].clientX-r.left; my=e.touches[0].clientY-r.top }
    const onLeave = () => { mx=-9999; my=-9999; mpx=-9999; mpy=-9999 }

    canvas.addEventListener('mousemove', onMove, { passive: true })
    canvas.addEventListener('touchmove', onTouch, { passive: true })
    canvas.addEventListener('mouseleave', onLeave)
    const ro = new ResizeObserver(resize); ro.observe(canvas)
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
      position:'absolute', inset:0, width:'100%', height:'100%',
      zIndex:2, pointerEvents:'auto', touchAction:'pan-y',
    }} aria-hidden="true" />
  )
}

/* ── 3D Robot (GLB Model) ────────────────────────── */
function RobotScene() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let W = el.offsetWidth, H = el.offsetHeight

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    camera.position.set(0, 0.4, 6)

    // WebGL context creation can fail in headless/constrained environments.
    // Throw so the enclosing ThreeErrorBoundary can catch and suppress the component.
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch (err) {
      throw new Error(`[RobotScene] WebGL context creation failed: ${err}`)
    }
    if (!renderer.getContext()) {
      renderer.dispose()
      throw new Error('[RobotScene] WebGL context is null after creation')
    }

    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0x8899bb, 0.6))

    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(3, 6, 4); key.castShadow = true; scene.add(key)

    const fill = new THREE.DirectionalLight(0x4466ff, 1.0)
    fill.position.set(-4, 2, 2); scene.add(fill)

    const rim = new THREE.DirectionalLight(0xffffff, 1.4)
    rim.position.set(0, 4, -5); scene.add(rim)

    const frontGlow = new THREE.PointLight(0x00bbff, 3.0, 8)
    frontGlow.position.set(0, 1.5, 3); scene.add(frontGlow)

    const chestGlow = new THREE.PointLight(0x0088ff, 2.0, 5)
    chestGlow.position.set(0, 1.0, 2); scene.add(chestGlow)

    /* ── Mouse ── */
    const mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mouse.x = ((e.clientX - r.left) / W - 0.5) * 2
      mouse.y = -((e.clientY - r.top)  / H - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    /* ── Load GLB ── */
    let robot: THREE.Group | null = null
    let mixer: THREE.AnimationMixer | null = null
    let rafId: number, t = 0

    const loader = new GLTFLoader()
    loader.load(
      aiRobotUrl,
      (gltf) => {
        robot = gltf.scene

        // Auto-center & scale the model to fit the viewport
        const box3 = new THREE.Box3().setFromObject(robot)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box3.getSize(size); box3.getCenter(center)

        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3.2 / maxDim
        robot.scale.setScalar(scale)
        robot.position.sub(center.multiplyScalar(scale))
        robot.position.y -= 1.0   // downward offset

        // Enable shadows on all meshes and enhance materials
        robot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            const mesh = child as THREE.Mesh
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              mats.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.envMapIntensity = 1.2
                  mat.needsUpdate = true
                }
              })
            }
          }
        })

        scene.add(robot)

        // Play animations if the GLB has any
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(robot)
          gltf.animations.forEach((clip) => {
            mixer!.clipAction(clip).play()
          })
        }
      },
      undefined,
      (err) => console.error('[RobotScene] Failed to load ai_robot.glb:', err)
    )

    /* ── Animate ── */
    const clock = new THREE.Clock()
    function animate() {
      rafId = requestAnimationFrame(animate)
      t += 0.016
      const delta = clock.getDelta()

      if (mixer) mixer.update(delta)

      if (robot) {
        // Float up/down
        robot.position.y = -1.0 + Math.sin(t * 0.85) * 0.07

        // Body follows mouse slowly
        cur.x += (mouse.x * 0.18 - cur.x) * 0.04
        cur.y += (mouse.y * 0.08 - cur.y) * 0.04
        robot.rotation.y = cur.x
        robot.rotation.x = cur.y
      }

      // Pulse glow lights
      const pulse = 0.7 + Math.sin(t * 2.8) * 0.3
      frontGlow.intensity = 3.0 * pulse
      chestGlow.intensity = 2.0 * pulse

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      W = el.offsetWidth; H = el.offsetHeight
      camera.aspect = W / H; camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
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
    <div ref={wrapRef} style={{
      position: 'absolute', right: 0, top: 0,
      width: '52%', height: '100%',
      zIndex: 3, overflow: 'hidden', background: 'transparent',
    }}>
      {/* blend to the left */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.3) 22%, transparent 42%)',
        pointerEvents: 'none',
      }} />
    </div>
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
      <ThreeErrorBoundary>
        <ThreeNetwork />
      </ThreeErrorBoundary>

      {/* Layer 2 – Particle text (left) */}
      <div className="hero-particle-panel" style={{
        position: 'absolute', left: 0, top: 0,
        width: '55%', height: '100%', zIndex: 2, pointerEvents: 'auto',
      }}>
        <ParticleCanvas canvasRef={canvasRef} />
      </div>

      {/* Layer 3 – Robot 3D (right) */}
      <div className="hero-robot-panel" style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      }}>
        <ThreeErrorBoundary>
          <RobotScene />
        </ThreeErrorBoundary>
      </div>

      {/* SEO h1 */}
      <h1 style={{ position:'absolute', width:1, height:1, overflow:'hidden', opacity:0 }}>
        CTRLBuild — Professional Website &amp; Mobile App Development Services
      </h1>

      <div className="hero-meta hero-meta--left" aria-hidden="true">Est. 2023</div>
      <div className="hero-meta hero-meta--right" aria-hidden="true">Pembangun Negeri</div>

      <div className="hero-tagline" aria-hidden="true">
        Web Development&nbsp;·&nbsp;Mobile Apps&nbsp;·&nbsp;UI/UX Design
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <span className="hero-scroll__label">Scroll</span>
        <div className="hero-scroll__line"><div className="hero-scroll__bar" /></div>
      </div>

      <div className="hero-ticker" aria-hidden="true">
        <div className="hero-ticker__track"><span>{ticker}</span><span>{ticker}</span></div>
      </div>

      <style>{`
        .hero-meta {
          position: absolute; top: calc(70px + 2.5rem); z-index: 10;
          font-size: .6rem; font-weight: 700; letter-spacing: .22em;
          text-transform: uppercase; color: rgba(255,255,255,.25); pointer-events: none;
        }
        .hero-meta--left  { left: 3rem; }
        .hero-meta--right { right: 3rem; }

        .hero-tagline {
          position: absolute; bottom: max(13vh, 120px); left: 50%;
          transform: translateX(-50%); z-index: 10;
          font-size: clamp(.55rem, 1vw, .7rem); font-weight: 600;
          letter-spacing: .26em; text-transform: uppercase;
          color: rgba(255,255,255,.3); white-space: nowrap; pointer-events: none;
        }

        .hero-scroll {
          position: absolute; bottom: 3.5vh; left: 50%;
          transform: translateX(-50%); z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: .5rem; pointer-events: none;
        }
        .hero-scroll__label {
          font-size: .5rem; font-weight: 700; letter-spacing: .28em;
          text-transform: uppercase; color: rgba(255,255,255,.22);
        }
        .hero-scroll__line { position: relative; width: 1px; height: 52px; background: rgba(255,255,255,.08); }
        .hero-scroll__bar {
          position: absolute; top: 0; left: 0; width: 100%; background: rgba(255,255,255,.55);
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
          z-index: 10; display: flex; align-items: center; pointer-events: none;
          contain: layout style; /* prevent ticker track from triggering body-level overflow */
        }
        .hero-ticker__track {
          display: flex; white-space: nowrap;
          width: max-content; /* explicit width prevents paint bleed on iOS Safari */
          will-change: transform;
          animation: tickerScroll 28s linear infinite;
        }
        .hero-ticker__track span {
          font-size: .58rem; font-weight: 700; letter-spacing: .18em;
          text-transform: uppercase; color: rgba(255,255,255,.18); padding: 0 1rem;
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .hero-robot-panel { display: none !important; }
          .hero-particle-panel { width: 100% !important; }
          /* Prevent tagline from bleeding on very narrow screens */
          .hero-tagline {
            white-space: normal;
            text-align: center;
            left: 1.5rem;
            right: 1.5rem;
            transform: none;
          }
        }
      `}</style>
    </section>
  )
}
