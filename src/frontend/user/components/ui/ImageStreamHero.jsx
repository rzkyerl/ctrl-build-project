/**
 * ImageStreamHero — ported from 21st.dev / image-stream-hero
 * Original: TypeScript + Tailwind + shadcn  →  plain React JSX + CSS
 *
 * Pure CSS 3D corridor. Two rails of cards fly from a vanishing point toward
 * the viewer using perspective + CSS @keyframes generated at runtime.
 * Zero external dependencies beyond React itself.
 *
 * How the geometry works
 * ───────────────────────
 * 1. Apparent size grows geometrically (constant ratio per card), not
 *    linearly — keeps the ribbon solid at every depth.
 * 2. Rails open hard early then hold (fan > 1), so the ribbon bends once
 *    and runs diagonal rather than fanning as a straight cone.
 * 3. Cards are born across the axis (railBirth < 0) so the centre throat
 *    stays covered at every frame — no blink, no fade needed.
 *
 * All lengths are in `cqw` (% of container width) → shape stays proportional
 * at any size.
 */

import { useId, useMemo } from 'react'
import './../../styles/css/image-stream-hero.css'

// ─── default corridor geometry ───────────────────────────────────────────────

const PATH = {
  perspective: 30,   // lower = wider angle / more dramatic rush
  cardWidth:   18,   // world-unit card width
  cardHeight:  25,   // world-unit card height
  cardRadius:  0.4,  // corner radius
  birthHeight: 2.6,  // on-screen height where a card is born
  exitHeight:  46,   // on-screen height as a card leaves the frame
  railBirth:  -11,   // lateral offset at birth (negative = across axis)
  railExit:    44,   // lateral offset when card exits
  fan:         3.3,  // how front-loaded the opening is (>1 = early bend)
  turnBirth:   6,    // y-rotation at birth (degrees)
  turnExit:    28,   // y-rotation at exit  (degrees)
  stops:       24,   // keyframe stops — raise only if motion looks faceted
}

// ─── keyframe builder ────────────────────────────────────────────────────────

/**
 * Generates the CSS @keyframes string for one rail.
 * @param {1 | -1} dir  — 1 = right rail, -1 = left rail
 * @param {string}  name — animation name
 * @param {typeof PATH} p — corridor geometry
 */
function buildKeyframes(dir, name, p) {
  const steps = []
  for (let s = 0; s <= p.stops; s++) {
    const u = s / p.stops

    // Geometric apparent size: each card is a constant ratio bigger
    const scale =
      (p.birthHeight / p.cardHeight) *
      Math.pow(p.exitHeight / p.birthHeight, u)

    const z    = p.perspective * (1 - 1 / scale)
    const rail = p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan)
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u

    steps.push(
      `${(u * 100).toFixed(2)}%{transform:` +
      `translate3d(${(dir * rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw)` +
      ` rotateY(${(-dir * turn).toFixed(2)}deg)}`
    )
  }
  return `@keyframes ${name}{${steps.join('')}}`
}

// ─── component ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   images: Array<{ src: string, alt?: string }>,
 *   cards?:    number,   — cards per rail (default 9)
 *   speed?:    number,   — seconds per full pass (default 18)
 *   axis?:     number,   — vanishing-point Y % of height (default 55)
 *   path?:     Partial<typeof PATH>,
 *   children?: import('react').ReactNode,
 *   className?: string,
 *   style?:    object,
 * }} props
 */
export function ImageStreamHero({
  images,
  cards    = 9,
  speed    = 18,
  axis     = 55,
  path     = {},
  children,
  className = '',
  style     = {},
  ...rest
}) {
  // Unique id so multiple instances on the same page never clash
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rightName = `ish-r-${rawId}`
  const leftName  = `ish-l-${rawId}`
  const cardClass = `ish-c-${rawId}`

  // Merge caller overrides onto the defaults once
  const p = useMemo(() => ({ ...PATH, ...path }), [path])

  // Build the two @keyframes strings + the reduced-motion pause rule
  const css = useMemo(() => {
    const kfRight = buildKeyframes(1,  rightName, p)
    const kfLeft  = buildKeyframes(-1, leftName,  p)
    const rmPause = `@media(prefers-reduced-motion:reduce){.${cardClass}{animation-play-state:paused}}`
    return `${kfRight}${kfLeft}${rmPause}`
  }, [rightName, leftName, cardClass, p])

  const safeLen = Math.max(images.length, 1)

  return (
    <div
      className={`ish-root${className ? ' ' + className : ''}`}
      style={{ containerType: 'inline-size', ...style }}
      {...rest}
    >
      {/* Injected keyframes — scoped to this instance via unique names */}
      <style>{css}</style>

      {/* The 3-D corridor — decorative, hidden from assistive tech */}
      <div
        aria-hidden="true"
        className="ish-scene"
        style={{
          perspective:       `${p.perspective}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
        }}
      >
        <div className="ish-world">
          {[rightName, leftName].map((animName) =>
            Array.from({ length: cards }, (_, i) => {
              const img = images[i % safeLen]
              return (
                <div
                  key={`${animName}-${i}`}
                  className={`${cardClass} ish-card`}
                  style={{
                    left:         '50%',
                    top:          `${axis}%`,
                    width:        `${p.cardWidth}cqw`,
                    height:       `${p.cardHeight}cqw`,
                    marginLeft:   `${-p.cardWidth  / 2}cqw`,
                    marginTop:    `${-p.cardHeight / 2}cqw`,
                    borderRadius: `${p.cardRadius}cqw`,
                    animation:    `${animName} ${speed}s linear infinite`,
                    // Negative delay = card starts mid-flight, corridor is full on frame 1
                    animationDelay: `${-(i * speed) / cards}s`,
                  }}
                >
                  {img ? (
                    <img
                      src={img.src}
                      alt={img.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="ish-img"
                    />
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Foreground content slot */}
      {children}
    </div>
  )
}

export default ImageStreamHero
