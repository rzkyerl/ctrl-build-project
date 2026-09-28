import { useEffect, useRef } from 'react'
import '../styles/css/nyx-features.css'

import img1   from '../../../assets/images/nyx-agent/Nyx Agent - 6.webp'
import img2   from '../../../assets/images/nyx-agent/nyx agent - 2.webp'
import img3   from '../../../assets/images/nyx-agent/nyx agent - 3.webp'
import img4   from '../../../assets/images/nyx-agent/nyx agent - 4.webp'
import img5   from '../../../assets/images/nyx-agent/Nyx Agent - 7.webp'
import img6   from '../../../assets/images/nyx-agent/Nyx Agent - 8.webp'
import bgUrl from '../../../assets/images/nyx-agent/nyx agent landscape.webp'

const items = [
  { num: '01', name: 'Streaming Chat', tag: 'Markdown Responses', img: img1, desc: 'Chat with Nyx Agent and follow its responses as they arrive, with readable Markdown formatting for code, lists, and tables.' },
  { num: '02', name: 'Model Choice', tag: 'Multiple Providers', img: img2, desc: 'Choose from supported AI providers, use automatic fallback, or connect a custom OpenAI-compatible model from the browser.' },
  { num: '03', name: 'Web Search', tag: 'Sources & Citations', img: img3, desc: 'Get answers grounded in current web results, with source citations shown alongside the response.' },
  { num: '04', name: 'File Analysis', tag: 'Upload & Ask', img: img4, desc: 'Upload documents, spreadsheets, presentations, images, or text files and ask Nyx Agent to analyze their contents.' },
  { num: '05', name: 'Chat History', tag: 'Saved in Your Browser', img: img5, desc: 'Return to previous conversations with session history, plus options to pin, rename, or delete chats.' },
  { num: '06', name: 'Document Export', tag: 'PDF · DOCX · XLSX', img: img6, desc: 'Turn an assistant response into a downloadable PDF, Word document, or Excel spreadsheet.' },
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
       rAF-throttled to avoid forced layout recalc on every scroll event.
    */
    let scrollRaf: number | null = null
    const onScroll = () => {
      if (scrollRaf !== null) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        const rect = section!.getBoundingClientRect()
        const sectionTop    = rect.top
        const sectionBottom = rect.bottom

        if (sectionTop <= 0 && sectionBottom > 0) {
          bg!.classList.add('is-fixed')
          bg!.classList.remove('is-bottom')
        } else if (sectionBottom <= 0) {
          bg!.classList.remove('is-fixed')
          bg!.classList.add('is-bottom')
        } else {
          bg!.classList.remove('is-fixed')
          bg!.classList.remove('is-bottom')
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // run once on mount

    return () => {
      revealObs.disconnect()
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf)
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
            <h2 className="nyx-features-title">Nyx Agent Web Chat</h2>
            <p className="nyx-features-sub">
              A browser-based AI assistant for streaming conversations, web research,
              file analysis, and document creation.
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
