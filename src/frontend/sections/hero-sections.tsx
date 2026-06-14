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

/* ── 3D Robot (Three.js native) ──────────────────── */
function RobotScene() {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let W = el.offsetWidth, H = el.offsetHeight

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(42, W / H, 0.1, 100)
    camera.position.set(0, 0.4, 6)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    /* ── Materials ── */
    const matBody  = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, roughness: 0.2, metalness: 0.9 })
    const matDark  = new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.3, metalness: 0.85 })
    const matGlow  = new THREE.MeshStandardMaterial({ color: 0x00c8ff, emissive: new THREE.Color(0x0066bb), emissiveIntensity: 1.5, roughness: 0.05, metalness: 0.3 })
    const matRed   = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: new THREE.Color(0xaa0000), emissiveIntensity: 1.0 })
    const matJoint = new THREE.MeshStandardMaterial({ color: 0x222830, roughness: 0.5, metalness: 0.8 })
    const matAccent= new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.3, metalness: 0.9 })

    const box  = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w,h,d,2,2,2), m)
    const cyl  = (rt: number, rb: number, h: number, seg: number, m: THREE.Material) => new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m)
    const sph  = (r: number, m: THREE.Material) => new THREE.Mesh(new THREE.SphereGeometry(r,16,12), m)

    const robot = new THREE.Group()
    robot.position.y = -0.5
    scene.add(robot)

    /* LEGS */
    const legL = new THREE.Group(); legL.position.set(-0.26, 0, 0); robot.add(legL)
    const legR = new THREE.Group(); legR.position.set( 0.26, 0, 0); robot.add(legR)
    ;[legL, legR].forEach(lg => {
      const thigh = box(0.28, 0.52, 0.28, matBody); thigh.position.y = 0.3; lg.add(thigh)
      const kneePad = box(0.32, 0.14, 0.16, matAccent); kneePad.position.y = 0.02; lg.add(kneePad)
      const shin = box(0.24, 0.5, 0.26, matBody); shin.position.y = -0.26; lg.add(shin)
      const foot = box(0.26, 0.14, 0.36, matDark); foot.position.set(0, -0.56, 0.05); lg.add(foot)
    })

    /* HIPS */
    const hips = box(0.88, 0.28, 0.44, matBody); hips.position.y = 0.62; robot.add(hips)
    const waist = cyl(0.27, 0.32, 0.2, 12, matJoint); waist.position.y = 0.78; robot.add(waist)

    /* TORSO */
    const torso = box(0.92, 1.0, 0.5, matBody); torso.position.y = 1.38; robot.add(torso)
    // chest panel
    const chestPanel = box(0.58, 0.38, 0.07, matDark); chestPanel.position.set(0, 0.08, 0.3); torso.add(chestPanel)
    const glowStrip  = box(0.4, 0.08, 0.04, matGlow); glowStrip.position.set(0, 0.08, 0.025); chestPanel.add(glowStrip)
    // shoulder details
    ;[-0.52, 0.52].forEach(x => {
      const shBolt = sph(0.075, matJoint); shBolt.position.set(x, 0.42, 0); torso.add(shBolt)
      const shPlate = box(0.12, 0.22, 0.14, matAccent); shPlate.position.set(x, 0.3, 0); torso.add(shPlate)
    })
    // vent slits
    for (let i = 0; i < 3; i++) {
      const vent = box(0.3, 0.03, 0.04, matGlow); vent.position.set(0, -0.28 + i * 0.08, 0.29); torso.add(vent)
    }

    /* NECK */
    const neck = cyl(0.13, 0.15, 0.2, 10, matJoint); neck.position.y = 1.93; robot.add(neck)

    /* HEAD */
    const headGrp = new THREE.Group(); headGrp.position.y = 2.16; robot.add(headGrp)
    const skull = box(0.7, 0.62, 0.56, matBody); headGrp.add(skull)
    // visor strip
    const visor = box(0.56, 0.17, 0.06, matDark); visor.position.set(0, 0.04, 0.31); skull.add(visor)
    // eyes
    ;[-0.14, 0.14].forEach(x => {
      const eye = box(0.11, 0.08, 0.04, matGlow); eye.position.set(x, 0, 0.015); visor.add(eye)
      // inner bright dot
      const dot = box(0.05, 0.04, 0.02, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xffffff), emissiveIntensity: 2 }))
      dot.position.set(0, 0, 0.015); eye.add(dot)
    })
    // ear panels
    ;[-0.41, 0.41].forEach(x => {
      const ear = box(0.08, 0.32, 0.24, matAccent); ear.position.set(x, 0, 0); skull.add(ear)
    })
    // antenna
    const antBase = cyl(0.035, 0.035, 0.14, 8, matJoint); antBase.position.set(0.16, 0.42, 0); skull.add(antBase)
    const antTip  = sph(0.055, matRed); antTip.position.y = 0.1; antBase.add(antTip)
    // head top ridge
    const ridge = box(0.42, 0.06, 0.28, matAccent); ridge.position.set(0, 0.34, 0); skull.add(ridge)

    /* ARMS */
    const makeArm = (side: -1 | 1) => {
      const grp = new THREE.Group(); grp.position.set(side * 0.62, 1.55, 0); robot.add(grp)
      const upper = box(0.27, 0.52, 0.26, matBody); upper.position.y = -0.28; grp.add(upper)
      const elbow = sph(0.13, matJoint); elbow.position.y = -0.57; grp.add(elbow)
      const fore = box(0.22, 0.46, 0.22, matBody); fore.position.y = -0.87; grp.add(fore)
      const wrist = cyl(0.1, 0.11, 0.1, 8, matJoint); wrist.position.y = -1.14; grp.add(wrist)
      const hand = box(0.22, 0.18, 0.16, matDark); hand.position.y = -1.27; grp.add(hand)
      // finger nubs
      for (let i = 0; i < 3; i++) {
        const fn = box(0.05, 0.1, 0.05, matJoint)
        fn.position.set(-0.07 + i * 0.07, -0.11, 0.06); hand.add(fn)
      }
      return grp
    }
    const armL = makeArm(-1)
    const armR = makeArm(1)

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0x8899bb, 0.4))

    const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(3, 6, 4); key.castShadow = true; scene.add(key)
    const fill = new THREE.DirectionalLight(0x4466ff, 0.8); fill.position.set(-4, 2, 2); scene.add(fill)
    const rim  = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(0, 4, -5); scene.add(rim)

    const eyeGlow = new THREE.PointLight(0x00bbff, 3.0, 2.5); eyeGlow.position.set(0, 2.18, 1.2); scene.add(eyeGlow)
    const chestGlow = new THREE.PointLight(0x0088ff, 1.8, 2.0); chestGlow.position.set(0, 1.38, 1.0); scene.add(chestGlow)

    /* ── Mouse ── */
    const mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mouse.x = ((e.clientX - r.left) / W - 0.5) * 2
      mouse.y = -((e.clientY - r.top)  / H - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    /* ── Animate ── */
    let rafId: number, t = 0
    function animate() {
      rafId = requestAnimationFrame(animate)
      t += 0.016

      // float
      robot.position.y = -0.5 + Math.sin(t * 0.85) * 0.07

      // body follows mouse slowly
      cur.x += (mouse.x * 0.18 - cur.x) * 0.04
      cur.y += (mouse.y * 0.08 - cur.y) * 0.04
      robot.rotation.y = cur.x
      robot.rotation.x = cur.y

      // head tracks mouse more eagerly
      headGrp.rotation.y = mouse.x * 0.32
      headGrp.rotation.x = mouse.y * 0.18

      // arm idle swing
      armL.rotation.z =  0.15 + Math.sin(t * 0.65) * 0.07
      armR.rotation.z = -0.15 - Math.sin(t * 0.65) * 0.07
      armL.rotation.x = Math.sin(t * 0.5) * 0.04
      armR.rotation.x = Math.sin(t * 0.5 + Math.PI) * 0.04

      // pulse glow
      const pulse = 0.7 + Math.sin(t * 2.8) * 0.3
      eyeGlow.intensity   = 2.5 * pulse
      chestGlow.intensity = 1.5 * pulse
      ;(glowStrip.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 * pulse
      antTip.position.y = 0.1  // keep static

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
      {/* blend ke kiri */}
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
      <ThreeNetwork />

      {/* Layer 2 – Particle text (kiri) */}
      <div className="hero-particle-panel" style={{
        position: 'absolute', left: 0, top: 0,
        width: '55%', height: '100%', zIndex: 2, pointerEvents: 'auto',
      }}>
        <ParticleCanvas canvasRef={canvasRef} />
      </div>

      {/* Layer 3 – Robot 3D (kanan) */}
      <div className="hero-robot-panel" style={{
        position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
      }}>
        <RobotScene />
      </div>

      {/* SEO h1 */}
      <h1 style={{ position:'absolute', width:1, height:1, overflow:'hidden', opacity:0 }}>
        CTRLBuild — Jasa Pembuatan Website &amp; Aplikasi Mobile Professional
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
        }
        .hero-ticker__track { display: flex; white-space: nowrap; animation: tickerScroll 28s linear infinite; }
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
        }
      `}</style>
    </section>
  )
}
