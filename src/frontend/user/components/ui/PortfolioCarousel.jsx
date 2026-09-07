/**
 * PortfolioCarousel — adapted from 21st.dev / framer-thumbnail-carousel
 * Ported: TypeScript → JSX, Tailwind → plain CSS classes
 * Dep: motion/react (already installed)
 */

import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'
import PortfolioWebGL from '../ui/PortfolioWebGL';
import '../../styles/css/portfolio-carousel.css';

const FULL_WIDTH_PX      = 120
const COLLAPSED_WIDTH_PX = 35
const MARGIN_PX          = 2

// ─── Thumbnail strip ──────────────────────────────────────────────────────────

function Thumbnails({ items, index, setIndex }) {
  const ref = useRef(null)

  // Keep the active thumbnail centred in the strip
  useEffect(() => {
    if (!ref.current) return
    let scrollPos = 0
    for (let i = 0; i < index; i++) scrollPos += COLLAPSED_WIDTH_PX + 2 // gap=2
    scrollPos += MARGIN_PX
    const centerOffset = ref.current.offsetWidth / 2 - FULL_WIDTH_PX / 2
    scrollPos -= centerOffset
    ref.current.scrollTo({ left: scrollPos, behavior: 'smooth' })
  }, [index])

  return (
    <div ref={ref} className="pc-thumbnails-scroll">
      <div className="pc-thumbnails-track">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => setIndex(i)}
            initial={false}
            animate={i === index ? 'active' : 'inactive'}
            variants={{
              active: {
                width: FULL_WIDTH_PX,
                marginLeft: MARGIN_PX,
                marginRight: MARGIN_PX,
              },
              inactive: {
                width: COLLAPSED_WIDTH_PX,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pc-thumb-btn"
          >
            <img
              src={item.url}
              alt={item.title}
              className="pc-thumb-img"
              draggable={false}
            />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Main carousel ────────────────────────────────────────────────────────────

/**
 * @param {{
 *   items: Array<{ id: number|string, url: string, title: string, cat?: string }>,
 * }} props
 */
export function PortfolioCarousel({ items }) {
  const [index, setIndex]         = useState(0)
  const [isDragging, setDragging] = useState(false)
  const containerRef              = useRef(null)
  const x                         = useMotionValue(0)

  // Spring-snap to the active slide whenever index changes
  useEffect(() => {
    if (isDragging || !containerRef.current) return
    const w = containerRef.current.offsetWidth || 1
    animate(x, -index * w, {
      type: 'spring',
      stiffness: 300,
      damping:   30,
    })
  }, [index, isDragging, x])

  const goTo = (i) => setIndex(Math.max(0, Math.min(items.length - 1, i)))

  return (
    <div className="pc-root">
      {/* ── Main image viewport ── */}
      <div className="pc-main-wrap" ref={containerRef}>

        <motion.div
          className="pc-strip"
          drag="x"
          dragElastic={0.2}
          dragMomentum={false}
          style={{ x }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false)
            const w  = containerRef.current?.offsetWidth || 1
            const ox = info.offset.x
            const vx = info.velocity.x
            let next = index
            if      (Math.abs(vx) > 500)     next = vx > 0 ? index - 1 : index + 1
            else if (Math.abs(ox) > w * 0.3) next = ox > 0 ? index - 1 : index + 1
            goTo(next)
          }}
        >
          {items.map((item) => (
            <div key={item.id} className="pc-slide">
              <PortfolioWebGL url={item.url} title={item.title} />
            </div>
          ))}
        </motion.div>

        {/* Prev */}
        <button
          className={`pc-nav pc-nav--prev${index === 0 ? ' pc-nav--disabled' : ''}`}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous project"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next */}
        <button
          className={`pc-nav pc-nav--next${index === items.length - 1 ? ' pc-nav--disabled' : ''}`}
          onClick={() => goTo(index + 1)}
          disabled={index === items.length - 1}
          aria-label="Next project"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide info overlay — bottom-left */}
        <div className="pc-info">
          <span className="pc-info-index">{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          <span className="pc-info-title">{items[index]?.title}</span>
          {items[index]?.cat && <span className="pc-info-cat">{items[index].cat}</span>}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      <Thumbnails items={items} index={index} setIndex={goTo} />
    </div>
  )
}

export default PortfolioCarousel
