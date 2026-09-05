/**
 * ZoomSlider — adapted from 21st.dev / hyperiux zoom-slider
 * Ported to plain React JSX + CSS (no Tailwind, no TypeScript, no GSAP Club plugins).
 *
 * How it works:
 *  - Cards are absolutely positioned along a virtual strip.
 *  - A custom easing maps the raw strip offset → visual X position so the
 *    left-most card takes up most of the screen width, and cards to the right
 *    collapse into a narrow strip (the classic zoom / perspective effect).
 *  - Mouse wheel, drag, and touch all drive `state.target`; a rAF loop lerps
 *    `state.current` toward `state.target` for a buttery glide.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import gsap from 'gsap'
import '../../styles/css/zoom-slider.css'

// ─── constants ──────────────────────────────────────────────────────────────

const SCROLL_PER_PX      = 1.0
const LERP_FACTOR        = 0.08
const DRAG_LERP_FACTOR   = 0.22
const MOMENTUM_FRICTION  = 0.92
const MIN_MOMENTUM       = 0.1
const SLIDER_BOTTOM_OFFSET = 60   // px gap from viewport bottom

// Average aspect ratio of the portfolio screenshots (width / height ≈ 1.70).
// Card height is always derived as  width / CARD_ASPECT_RATIO  so the full
// image is always visible without cropping — no letterboxing needed.
const CARD_ASPECT_RATIO  = 1.70

const lerp = (a, b, n) => a + (b - a) * n

// ─── component ──────────────────────────────────────────────────────────────

/**
 * @param {{
 *   items: Array<{ src: string, name: string, cat: string, year: string }>,
 *   size?: number,
 *   easeScrollPercentage?: number,
 *   scaleOnHover?: boolean,
 *   textOnHover?: boolean,
 * }} props
 */
export function ZoomSlider({
  items = [],
  size = 1,
  easeScrollPercentage = 100,
  scaleOnHover = true,
  textOnHover  = true,
}) {
  const resolvedSize = Math.max(0.5, Number(size) || 1)
  const resolvedEase = Math.max(20, Number(easeScrollPercentage) || 100)

  const [vpW, setVpW] = useState(window.innerWidth)

  const isMobile = vpW < 640
  const isTablet = vpW >= 640 && vpW < 1025

  // Card widths — the active (leftmost) card should be comfortably large
  // but never wider than the viewport so the image doesn't spill off screen.
  const cardWidthMax  = Math.min(
    (isMobile ? 300 : isTablet ? 560 : 780) * resolvedSize,
    vpW - 40,
  )
  const cardWidthMin  = (isMobile ? 60 : 160) * resolvedSize

  // Heights are derived directly from the width so the landscape screenshots
  // are always shown in full — no vertical cropping.
  const cardHeightMax = Math.round(cardWidthMax  / CARD_ASPECT_RATIO)
  const cardHeightMin = Math.round(cardWidthMin  / CARD_ASPECT_RATIO)

  const cardStep = cardWidthMax

  const stripRef      = useRef(null)
  const imageWrapRefs = useRef([])
  const textRefs      = useRef([])
  const stateRef      = useRef({
    current: 0,
    target: 0,
    raf: null,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    velocity: 0,
  })
  const [activeIndex, setActiveIndex] = useState(0)
  const announcedRef = useRef(0)

  // ── viewport resize ──────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      setVpW(window.innerWidth)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── card positioning ─────────────────────────────────────────────────────
  const positionCards = useCallback((offset) => {
    if (!stripRef.current || !items.length) return
    const cards = Array.from(stripRef.current.children)
    const count = items.length
    const loopWidth = count * cardStep
    // Anchor cards to bottom of the slider container, not window bottom
    const containerH = stripRef.current.parentElement?.offsetHeight ?? window.innerHeight
    const bottom = containerH - SLIDER_BOTTOM_OFFSET
    const easingDistance = 2 * window.innerWidth * (resolvedEase / 100)

    // Non-linear mapping: collapses right-side cards into a narrow strip
    const mapVtoX = (v) => {
      if (v <= 0) return 0
      if (v >= easingDistance) return v - easingDistance / 2
      return (v * v) / (2 * easingDistance)
    }

    const normalizedOffset = ((offset % loopWidth) + loopWidth) % loopWidth
    const startIndex = Math.floor(normalizedOffset / cardStep)
    const frac = (normalizedOffset % cardStep) / cardStep

    for (let i = 0; i < count; i++) {
      const cardIndex = (startIndex + i) % count
      const visualOffset = (i - frac) * cardStep
      const currentX = mapVtoX(visualOffset)
      const nextX    = mapVtoX(visualOffset + cardStep)
      const visualW  = nextX - currentX

      // Height is always width / CARD_ASPECT_RATIO — image never crops
      const cardH = Math.round(visualW / CARD_ASPECT_RATIO)
      const y     = bottom - cardH

      if (!cards[cardIndex]) continue
      cards[cardIndex].style.transform = `translate(${currentX}px, ${y}px)`

      const iw = imageWrapRefs.current[cardIndex]
      if (iw) {
        iw.style.width  = `${visualW}px`
        iw.style.height = `${cardH}px`
      }
    }
  }, [cardStep, items.length, resolvedEase])

  // ── rAF loop + input handlers ─────────────────────────────────────────────
  useEffect(() => {
    if (!items.length) return
    const state = stateRef.current
    const loopWidth = items.length * cardStep

    const tick = () => {
      // momentum glide
      if (!state.isDragging && Math.abs(state.velocity) > MIN_MOMENTUM) {
        state.target  += state.velocity
        state.velocity *= MOMENTUM_FRICTION
      } else if (!state.isDragging) {
        state.velocity = 0
      }

      const lf = state.isDragging ? DRAG_LERP_FACTOR : LERP_FACTOR
      state.current = lerp(state.current, state.target, lf)

      // re-centre to avoid floating-point drift
      if (Math.abs(state.current - state.target) < 0.01) {
        const shift = Math.round(state.current / loopWidth) * loopWidth
        state.current -= shift
        state.target  -= shift
      }

      positionCards(state.current)

      const n = ((state.current % loopWidth) + loopWidth) % loopWidth
      const next = Math.floor(n / cardStep) % items.length
      if (next !== announcedRef.current) {
        announcedRef.current = next
        setActiveIndex(next)
      }

      state.raf = requestAnimationFrame(tick)
    }

    // wheel
    const onWheel = (e) => { state.target -= e.deltaY * SCROLL_PER_PX }

    // pointer drag
    const beginDrag = (x, y) => {
      state.isDragging = true
      state.lastX = x; state.lastY = y; state.velocity = 0
    }
    const moveDrag = (x, y, dir = 1) => {
      if (!state.isDragging) return
      const dx   = x - state.lastX
      const dy   = y - state.lastY
      const raw  = Math.abs(dx) >= Math.abs(dy) ? -dx : -dy
      const d    = raw * dir
      state.target  += d
      state.velocity = lerp(state.velocity, d, 0.5)
      state.lastX = x; state.lastY = y
    }
    const endDrag = () => { state.isDragging = false }

    const onMD = (e) => beginDrag(e.clientX, e.clientY)
    const onMM = (e) => moveDrag(e.clientX, e.clientY)
    const onMU = endDrag
    const onTS = (e) => beginDrag(e.touches[0].clientX, e.touches[0].clientY)
    const onTM = (e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY, -1)
    const onTE = endDrag

    window.addEventListener('wheel',      onWheel, { passive: true })
    window.addEventListener('mousedown',  onMD)
    window.addEventListener('mousemove',  onMM)
    window.addEventListener('mouseup',    onMU)
    window.addEventListener('touchstart', onTS, { passive: true })
    window.addEventListener('touchmove',  onTM, { passive: true })
    window.addEventListener('touchend',   onTE)
    window.addEventListener('touchcancel',onTE)

    state.raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(state.raf)
      window.removeEventListener('wheel',       onWheel)
      window.removeEventListener('mousedown',   onMD)
      window.removeEventListener('mousemove',   onMM)
      window.removeEventListener('mouseup',     onMU)
      window.removeEventListener('touchstart',  onTS)
      window.removeEventListener('touchmove',   onTM)
      window.removeEventListener('touchend',    onTE)
      window.removeEventListener('touchcancel', onTE)
    }
  }, [cardStep, items, positionCards])

  // ── hover text / scale animations ─────────────────────────────────────────
  useEffect(() => {
    if (!items.length) return
    const cleanups = []

    items.forEach((_, index) => {
      const textEl  = textRefs.current[index]
      const imageWrap = imageWrapRefs.current[index]
      if (!textEl || !imageWrap) return

      // Initial state: text invisible, lines clipped down
      const lines = Array.from(textEl.querySelectorAll('.zs-line-inner'))
      gsap.set(lines,  { yPercent: 100 })
      gsap.set(textEl, { autoAlpha: 0 })

      const imgEl = imageWrap.querySelector('img')
      if (imgEl) gsap.set(imgEl, { opacity: 1 })

      const onEnter = () => {
        if (textOnHover) {
          gsap.timeline()
            .set(textEl, { autoAlpha: 1 })
            .to(lines, { yPercent: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out' })
        }
        if (scaleOnHover && imgEl) {
          gsap.to(imgEl, { scale: 1.05, duration: 0.6, ease: 'power2.out' })
        }
      }

      const onLeave = () => {
        if (textOnHover) {
          gsap.to(lines, {
            yPercent: 100, duration: 0.28, stagger: 0.03, ease: 'power2.in',
            onComplete: () => gsap.set(textEl, { autoAlpha: 0 }),
          })
        } else {
          gsap.set(textEl, { autoAlpha: 0 })
          gsap.set(lines,  { yPercent: 100 })
        }
        if (scaleOnHover && imgEl) {
          gsap.to(imgEl, { scale: 1, duration: 0.6, ease: 'power2.out' })
        }
      }

      imageWrap.addEventListener('mouseenter', onEnter)
      imageWrap.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        imageWrap.removeEventListener('mouseenter', onEnter)
        imageWrap.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => cleanups.forEach(fn => fn())
  }, [items, scaleOnHover, textOnHover])

  return (
    <div className="zs-root" aria-label="Portfolio zoom slider">
      {/* sr-only live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {items.length
          ? `${items[activeIndex]?.name ?? ''}, slide ${activeIndex + 1} of ${items.length}`
          : ''}
      </div>

      <div ref={stripRef} className="zs-strip">
        {items.map((item, index) => (
          <div key={index} className="zs-card" style={{ willChange: 'transform' }}>
            {/* Text overlay above the card */}
            <div
              ref={el => { textRefs.current[index] = el }}
              className="zs-text"
            >
              <p className="zs-line"><span className="zs-line-inner zs-index">
                {String(index + 1).padStart(2, '0')}
              </span></p>
              <p className="zs-line"><span className="zs-line-inner zs-name">
                {item.name}
              </span></p>
              <p className="zs-line"><span className="zs-line-inner zs-cat">
                {item.cat}
              </span></p>
            </div>

            {/* Image wrapper — sized by the rAF loop */}
            <div
              ref={el => { imageWrapRefs.current[index] = el }}
              className="zs-image-wrap"
              style={{ width: cardWidthMin, height: cardHeightMax, willChange: 'width, height' }}
            >
              <img
                src={item.src}
                alt={item.name}
                draggable={false}
                className="zs-img"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ZoomSlider
