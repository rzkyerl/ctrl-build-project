import { useEffect, useRef, useState, useCallback } from 'react'
import '../styles/css/nyx-terminal.css'

/* Left-side image */
const sideImageUrl = new URL('../../../assets/images/nyx-agent/nyx agent - 1.webp', import.meta.url).href

/* ── Terminal lines data ── */
interface TermLine {
  type:  'cmd' | 'output' | 'output-success'
  prompt?: string
  text:   string
  delay?: number
}

const termLines: TermLine[] = [
  { type: 'cmd',            prompt: '$', text: 'npx nyx-agent init',                 delay: 500 },
  { type: 'output-success',                 text: '✓ Nyx Agent initialized',           delay: 800 },
  { type: 'output',                         text: '  → Config: ~/.nyx/config.json',     delay: 200 },
  { type: 'output',                         text: '  → Models: 5 available',            delay: 100 },
  { type: 'cmd',            prompt: '$', text: 'nyx-agent chat "Summarize my project"', delay: 1000 },
  { type: 'output',                         text: '> Reading project structure…',      delay: 600 },
  { type: 'output',                         text: '> Analyzing 24 files across 3 dirs', delay: 300 },
  { type: 'output-success',                 text: '✓ Summary generated (832 tokens)',  delay: 500 },
  { type: 'output',                         text: '  → Saved to memory',               delay: 200 },
  { type: 'cmd',            prompt: '$', text: '',                                   delay: 600 },
]

/* ── Typewriter hook ── */
function useTypewriter(lines: TermLine[], active: boolean) {
  const [visibleLines, setVisibleLines] = useState<
    { line: TermLine; typedText: string; done: boolean }[]
  >([])
  const [showCursor, setShowCursor] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!active) return

    let cancelled = false
    const timers = timersRef.current

    setVisibleLines([])
    setShowCursor(false)

    let elapsed = 0

    lines.forEach((line, idx) => {
      elapsed += line.delay ?? 0

      const startTimer = setTimeout(() => {
        if (cancelled) return
        setVisibleLines((prev) => [...prev, { line, typedText: '', done: false }])

        const chars = line.text.split('')
        let charIdx = 0
        const charInterval = setInterval(() => {
          if (cancelled) return
          charIdx++
          setVisibleLines((prev) => {
            const next = [...prev]
            if (next[idx]) {
              next[idx] = { ...next[idx], typedText: line.text.slice(0, charIdx) }
            }
            return next
          })
          if (charIdx >= chars.length) {
            clearInterval(charInterval)
            setVisibleLines((prev) => {
              const next = [...prev]
              if (next[idx]) next[idx] = { ...next[idx], done: true }
              return next
            })
            if (idx === lines.length - 1) {
              setShowCursor(true)
            }
          }
        }, 30)
        timers.push(charInterval as unknown as ReturnType<typeof setTimeout>)
      }, elapsed)
      timers.push(startTimer)
    })

    return () => {
      cancelled = true
      timers.forEach((t) => clearTimeout(t))
    }
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [active])

  return { visibleLines, showCursor }
}

export function NyxTerminal() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true)
          section.querySelectorAll('.nyx-reveal').forEach((el) => el.classList.add('in-view'))
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  const { visibleLines, showCursor } = useTypewriter(termLines, active)

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard?.writeText(text)
  }, [])

  return (
    <section className="nyx-terminal-section" id="terminal" ref={sectionRef}>
      <div className="nyx-terminal-grid">
        {/* LEFT — Image */}
        <div className="nyx-terminal-image nyx-reveal">
          <img src={sideImageUrl} alt="Nyx Agent" loading="lazy" />
        </div>

        {/* RIGHT — CLI Install */}
        <div className="nyx-terminal-right nyx-reveal">
          {/* Header */}
          <div className="nyx-terminal-header">
            <h2 className="nyx-terminal-title">Install via Terminal</h2>
            <p className="nyx-terminal-sub">
              Nyx Agent CLI runs on any platform. Install in seconds,
              configure once, and you're ready to go.
            </p>
          </div>

          {/* Terminal window */}
          <div className="nyx-terminal-window">
            {/* Title bar */}
            <div className="nyx-terminal-bar">
              <div className="nyx-terminal-dots">
                <span className="nyx-terminal-dot" />
                <span className="nyx-terminal-dot" />
                <span className="nyx-terminal-dot" />
              </div>
              <span className="nyx-terminal-bar-title">nyx-agent</span>
            </div>

            {/* Body */}
            <div className="nyx-terminal-body">
              {visibleLines.map((vl, i) => (
                <div key={i}>
                  {vl.line.type === 'cmd' ? (
                    <div className="nyx-terminal-line">
                      {vl.line.prompt && (
                        <span className="nyx-terminal-prompt">{vl.line.prompt}</span>
                      )}
                      <span className="nyx-terminal-cmd">{vl.typedText}</span>
                      {showCursor && i === visibleLines.length - 1 && (
                        <span className="nyx-terminal-cursor" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={`nyx-terminal-output${vl.line.type === 'output-success' ? ' success' : ''}`}
                    >
                      {vl.typedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Install commands */}
          <div className="nyx-terminal-commands">
            {[
              { label: 'npm',   text: 'npm i -g nyx-agent' },
              { label: 'yarn',  text: 'yarn global add nyx-agent' },
              { label: 'pnpm',  text: 'pnpm add -g nyx-agent' },
              { label: 'npx',   text: 'npx nyx-agent' },
            ].map((cmd) => (
              <button
                key={cmd.label}
                className="nyx-terminal-cmd-btn"
                onClick={() => copyToClipboard(cmd.text)}
                title="Click to copy"
              >
                <span className="nyx-terminal-cmd-label">{cmd.label}</span>
                <span className="nyx-terminal-cmd-text">{cmd.text}</span>
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="nyx-terminal-disclaimer">
            ⚠ Nyx Agent is currently in active development and not yet fully functional.
            Expect breaking changes and incomplete features.
          </p>
        </div>
      </div>
    </section>
  )
}
