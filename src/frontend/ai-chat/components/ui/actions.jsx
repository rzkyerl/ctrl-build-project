import { createContext, useContext } from 'react'

/* ═══════════════════════════════════════════════════
   Actions — A horizontal row of action buttons shown
   below a chat message (Copy, Retry, Like, etc.)

   Adapts the shadcn-style "ai-actions" pattern to this
   project's plain-CSS / JSX conventions.  Uses lucide-react
   icons (already a dependency) instead of next/image.

   Usage:
     <Actions>
       <Action label="Copy" onClick={handleCopy}>
         <CopyIcon size={14} />
       </Action>
       ...
     </Actions>
══════════════════════════════════════════════════ */

/** Context so each Action can communicate with its parent Actions row (e.g. for single-select toggles like Like/Dislike). */
const ActionsContext = createContext(null)

/** Hook for child Action buttons to read parent state if needed. */
export function useActionsContext() {
  return useContext(ActionsContext)
}

/**
 * Actions — container for a horizontal group of Action buttons.
 *
 * @param {object}   props
 * @param {string}  [props.className]  — extra classes appended to defaults
 * @param {React.ReactNode} props.children — Action components
 * @param {string}  [props.size]        — "sm" | "md" (default: "sm")
 * @param {boolean} [props.alwaysVisible] — if true, actions don't hide on mouse-leave
 */
export function Actions({ className = '', children, size = 'sm', alwaysVisible = false, ...rest }) {
  return (
    <ActionsContext.Provider value={{ size }}>
      <div
        className={`chat-msg-actions${alwaysVisible ? ' always-visible' : ''}${className ? ' ' + className : ''}`}
        role="toolbar"
        aria-label="Message actions"
        {...rest}
      >
        {children}
      </div>
    </ActionsContext.Provider>
  )
}

/**
 * Action — a single icon button inside an Actions row.
 *
 * @param {object}    props
 * @param {string}    props.label      — accessible label / tooltip
 * @param {function} [props.onClick]   — click handler
 * @param {boolean}  [props.active]    — visually highlighted (e.g. liked/disliked)
 * @param {boolean}  [props.disabled]
 * @param {React.ReactNode} props.children — icon element
 */
export function Action({ label, onClick, active = false, disabled = false, children, ...rest }) {
  return (
    <button
      type="button"
      className={`chat-msg-action-btn${active ? ' active' : ''}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
}
