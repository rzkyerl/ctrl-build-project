import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

/* ═══════════════════════════════════════════════════
   usePopoverPosition — Hook for absolutely-positioned
   dropdowns that need to escape an `overflow: hidden`
   ancestor (e.g. the BorderBeam-wrapped composer box).

   Returns a ref for the trigger element, a position
   object ({top, left, placement}), and re-calculates
   the position on scroll/resize so the dropdown stays
   anchored to the trigger.

   Usage:
     const { triggerRef, position } = usePopoverPosition(open, { placement: 'top' })
     <button ref={triggerRef}>Open</button>
     {open && createPortal(
       <div style={{ position: 'fixed', top: position.top, left: position.left }}>
         ...content...
       </div>,
       document.body
     )}
══════════════════════════════════════════════════ */

const VIEWPORT_GAP = 6    // gap between trigger and popover
const EDGE_PADDING = 8    // distance from viewport edges

export function usePopoverPosition(isOpen, { placement = 'top', offset = 0 } = {}) {
  const triggerRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0, actualPlacement: placement })

  const recompute = useCallback(() => {
    const el = triggerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    // Use sensible default sizes; the popover will measure itself on first paint.
    // We pick flip thresholds here. The model dropdown has 6 items (~320px tall),
    // the file menu is shorter. Use a higher estimate so we flip earlier when
    // there's not enough room above.
    const estHeight = 340
    const estWidth  = 280

    // Decide vertical placement: prefer `placement`, flip if it doesn't fit.
    // For `placement: 'top'`, the popover sits ABOVE the trigger, so its
    // bottom edge should be at `rect.top - VIEWPORT_GAP`, which means its
    // top edge is at `rect.top - VIEWPORT_GAP - estHeight`.
    // For `placement: 'bottom'`, the popover sits BELOW the trigger, so its
    // top edge is at `rect.bottom + VIEWPORT_GAP`.
    let actualPlacement = placement
    let top

    if (placement === 'top') {
      const bottomEdge = rect.top - VIEWPORT_GAP - offset
      if (bottomEdge - estHeight < EDGE_PADDING) {
        // Not enough room above — flip below
        actualPlacement = 'bottom'
        top = rect.bottom + VIEWPORT_GAP + offset
      } else {
        top = bottomEdge - estHeight
      }
    } else {
      const desired = rect.bottom + VIEWPORT_GAP + offset
      if (desired + estHeight > window.innerHeight - EDGE_PADDING) {
        actualPlacement = 'top'
        const bottomEdge = rect.top - VIEWPORT_GAP - offset
        top = Math.max(EDGE_PADDING, bottomEdge - estHeight)
      } else {
        top = desired
      }
    }

    // Horizontal: align to trigger's left edge, but clamp inside the viewport.
    let left = rect.left
    const maxLeft = window.innerWidth - estWidth - EDGE_PADDING
    if (left > maxLeft) left = maxLeft
    if (left < EDGE_PADDING) left = EDGE_PADDING

    setPosition({ top, left, actualPlacement })
  }, [placement, offset])

  useEffect(() => {
    if (!isOpen) return
    recompute()
    window.addEventListener('resize', recompute)
    window.addEventListener('scroll', recompute, true)
    return () => {
      window.removeEventListener('resize', recompute)
      window.removeEventListener('scroll', recompute, true)
    }
  }, [isOpen, recompute])

  return { triggerRef, position, recompute }
}

/**
 * Popover — A portal-rendered dropdown that escapes any
 * overflow:hidden ancestor. Use with usePopoverPosition.
 *
 * @param {object} props
 * @param {boolean} props.open — whether the popover is open
 * @param {object} props.position — {top, left, actualPlacement}
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function Popover({ open, position, className = '', children, ...rest }) {
  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`popover-portal ${className}`}
      data-placement={position.actualPlacement}
      style={{
        position: 'fixed',
        top:  `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 10000,
      }}
      {...rest}
    >
      {children}
    </div>,
    document.querySelector('.ai-chat-root') || document.body
  )
}

