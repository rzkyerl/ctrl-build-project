import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'

const testimonials = [
  {
    quote: "Transformed our entire creative process overnight.",
    author: "Bayu Tri Novianto",
    role: "Founder 3NT Studio",
    company: "3NT Studio",
  },
  {
    quote: "The most elegant solution we've ever implemented.",
    author: "Anonymous",
    role: "Consultant",
    company: "Anagata Executive",
  },
  {
    quote: "Pure craftsmanship in every single detail.",
    author: "Anonymous",
    role: "Student",
    company: "Student",
  },
]

export function Testimonial() {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 200 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const numberX = useTransform(x, [-200, 200], [-20, 20])
  const numberY = useTransform(y, [-200, 200], [-10, 10])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      mouseX.set(e.clientX - (rect.left + rect.width / 2))
      mouseY.set(e.clientY - (rect.top + rect.height / 2))
    }
  }

  const goNext = () => setActiveIndex((prev) => (prev + 1) % testimonials.length)
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  useEffect(() => {
    const timer = setInterval(goNext, 6000)
    return () => clearInterval(timer)
  }, [])

  const current = testimonials[activeIndex]

  return (
    <div
      ref={containerRef}
      className="tm-inner"
      onMouseMove={handleMouseMove}
    >
      {/* Oversized parallax index number */}
      <motion.div className="tm-bg-num" style={{ x: numberX, y: numberY }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'block' }}
          >
            {String(activeIndex + 1).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Layout */}
      <div className="tm-layout">

        {/* Left column — vertical label + progress bar */}
        <div className="tm-sidebar">
          <motion.span
            className="tm-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Testimonials
          </motion.span>
          <div className="tm-progress-track">
            <motion.div
              className="tm-progress-fill"
              animate={{ height: `${((activeIndex + 1) / testimonials.length) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Center — main content */}
        <div className="tm-content">

          {/* Company label */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`company-${activeIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="tm-company"
            >
              {current.company}
            </motion.p>
          </AnimatePresence>

          {/* Quote with word-by-word reveal */}
          <div className="tm-quote-wrap">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={`quote-${activeIndex}`}
                className="tm-quote"
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {current.quote.split(' ').map((word, i) => (
                  <motion.span
                    key={i}
                    className="tm-word"
                    variants={{
                      hidden: { opacity: 0, y: 20, rotateX: 90 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        transition: {
                          duration: 0.5,
                          delay: i * 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                      exit: {
                        opacity: 0,
                        y: -10,
                        transition: { duration: 0.2, delay: i * 0.02 },
                      },
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Author + navigation row */}
          <div className="tm-footer-row">
            <AnimatePresence mode="wait">
              <motion.div
                key={`author-${activeIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="tm-author"
              >
                <motion.div
                  className="tm-author-line"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
                <div>
                  <p className="tm-author-name">{current.author}</p>
                  <p className="tm-author-role">{current.role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next */}
            <div className="tm-nav">
              <motion.button
                onClick={goPrev}
                className="tm-nav-btn"
                whileTap={{ scale: 0.95 }}
                aria-label="Previous testimonial"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
              <motion.button
                onClick={goNext}
                className="tm-nav-btn"
                whileTap={{ scale: 0.95 }}
                aria-label="Next testimonial"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="tm-ticker" aria-hidden="true">
        <motion.div
          className="tm-ticker-track"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="tm-ticker-item">
              {testimonials.map((t) => t.company).join(' • ')} •
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
