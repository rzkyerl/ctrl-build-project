import { useEffect, useRef } from 'react'
import '../styles/css/nyx-features.css'

import img1   from '../../../assets/images/nyx-agent/Nyx Agent - 6.webp'
import img2   from '../../../assets/images/nyx-agent/nyx agent - 2.webp'
import img3   from '../../../assets/images/nyx-agent/nyx agent - 3.webp'
import img4   from '../../../assets/images/nyx-agent/nyx agent - 4.webp'
import img5   from '../../../assets/images/nyx-agent/Nyx Agent - 7.webp'
import img6   from '../../../assets/images/nyx-agent/nyx agent - 8.webp'
import bgUrl from '../../../assets/images/nyx-agent/nyx agent landscape.webp'

const items = [
  { num: '01', name: 'Tools',        tag: '15 Built-in',       img: img1, desc: 'Shell, view, read, edit, write, patch, grep, glob, fetch, sourcegraph, think, todo, agent, diagnostics everything the agent needs to work autonomously.' },
  { num: '02', name: 'Multi-Agent',  tag: 'Architecture',      img: img2, desc: 'Dedicated coder, summarizer, task, and title agents. Sub-agent spawning for parallel research with zero context cost.' },
  { num: '03', name: 'TUI',          tag: 'Terminal Interface', img: img3, desc: 'Split-pane layout with chat, sidebar, and streaming markdown. Runtime theme switching your terminal, your style.' },
  { num: '04', name: 'Integrations', tag: 'MCP + LSP',         img: img4, desc: 'Add MCP servers at runtime without restarting. Real-time LSP diagnostics after every file edit. Drop-in SKILL.md files for custom workflows.' },
  { num: '05', name: 'Providers',    tag: '12+ LLMs',          img: img5, desc: 'Anthropic, OpenAI, Gemini, OpenRouter, GitHub Copilot, xAI, Groq, AWS Bedrock, Azure, Vertex AI, and any OpenAI-compatible endpoint.' },
  { num: '06', name: 'Web Chat',     tag: 'Browser Interface',  img: img6, desc: 'Streaming responses, file upload, multiple models, session history. The same agent, accessible from your browser when you need it.' },
]

export function NyxFeatures() {
  const sectionRef  = useRef<HTMLElement>(null)
  const bgRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const bg      = bgRef.current
    if (!section || !bg) return

    /* ── Reveal grid items ── */
    const els = section.querySelectorAll('.nyx-feature-item, .nyx-features-card-header')
    const revealObs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view') }),
      { threshold: 0.08 }
    )
    els.forEach(el => revealObs.observe(el))

    /* ── Fixed background trick ──
       overflow-x: hidden on .nyx-root breaks position:sticky.
       Instead: when section reaches top of viewport, switch bg
       to position:fixed so it stays locked. When section leaves
       viewport bottom, switch back to absolute (bottom-anchored).
    */
    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const sectionTop    = rect.top
      const sectionBottom = rect.bottom

      if (sectionTop <= 0 && sectionBottom > 0) {
        // Section spanning viewport — bg fixed (locked)
        bg.classList.add('is-fixed')
        bg.classList.remove('is-bottom')
      } else if (sectionBottom <= 0) {
        // Section fully scrolled past — anchor bg to section bottom
        bg.classList.remove('is-fixed')
        bg.classList.add('is-bottom')
      } else {
        // Section not yet reached — normal position at top
        bg.classList.remove('is-fixed')
        bg.classList.remove('is-bottom')
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // run once on mount

    return () => {
      revealObs.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section className="nyx-features" id="features" ref={sectionRef}>

      {/*
        Background — starts absolute, switches to fixed when section
        hits top of viewport, switches back to bottom-anchored when
        section scrolls completely past.
      */}
      <div className="nyx-features-bg-layer" ref={bgRef}>
        <img src={bgUrl} alt="" aria-hidden="true" className="nyx-features-bg-img" />
        <div className="nyx-features-bg-overlay" />
        <div className="nyx-features-oversized" aria-hidden="true">NYX AGENT</div>
        <div className="nyx-features-end-labels">
          <span className="nyx-features-end-label">Nyx Agent v0.1.0</span>
          <span className="nyx-features-end-label">Developed by Ctrl Build</span>
        </div>
      </div>

      {/* Card layer — scrolls normally over the locked background */}
      <div className="nyx-features-card-layer">
        <div className="nyx-features-card">
          <div className="nyx-features-card-header">
            <h2 className="nyx-features-title">What Nyx Can Do</h2>
            <p className="nyx-features-sub">
              From terminal to browser one agent, 15 tools, 12+ providers,
              and a TUI that keeps you in the loop.
            </p>
          </div>

          <div className="nyx-features-grid">
            {items.map((item, i) => (
              <div
                key={item.num}
                className="nyx-feature-item"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="nyx-feature-item-head">
                  <span className="nyx-feature-item-num">{item.num}</span>
                  <div>
                    <h3 className="nyx-feature-item-name">{item.name}</h3>
                    <span className="nyx-feature-item-tag">{item.tag}</span>
                  </div>
                </div>
                <div className="nyx-feature-item-image">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </div>
                <p className="nyx-feature-item-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
