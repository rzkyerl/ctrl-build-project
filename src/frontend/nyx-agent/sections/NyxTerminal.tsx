import { useEffect, useRef } from 'react'
import '../styles/css/nyx-terminal.css'

/* Mobile-side image */
import sideImageUrl from '../../../assets/images/nyx-agent/nyx agent - 1.webp'
import previewVideoUrl from '../../../assets/videos/nyxagent-preview-hq.mp4'
import previewPosterUrl from '../../../assets/videos/nyxagent-poster-hq.webp'

export function NyxTerminal() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          section.querySelectorAll('.nyx-reveal').forEach((el) => el.classList.add('in-view'))
          void videoRef.current?.play().catch(() => {})
        } else {
          videoRef.current?.pause()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="nyx-terminal-section" id="terminal" ref={sectionRef}>
      <div className="nyx-terminal-grid">
        {/* Mobile image */}
        <div className="nyx-terminal-image nyx-reveal">
          <img src={sideImageUrl} alt="Nyx Agent" loading="lazy" />
        </div>

        {/* RIGHT — Web chat preview */}
        <div className="nyx-terminal-right nyx-reveal">
          {/* Header */}
          <div className="nyx-terminal-header">
            <h2 className="nyx-terminal-title">Nyx Agent Chat</h2>
            <p className="nyx-terminal-sub">
              Chat with AI in your browser. Choose models, search the web,
              and work with your files in one place.
            </p>
          </div>

          {/* Web chat video preview */}
          <div className="nyx-terminal-video-frame">
            <video
              ref={videoRef}
              className="nyx-terminal-video"
              src={previewVideoUrl}
              poster={previewPosterUrl}
              aria-label="Nyx Agent Chat web interface preview"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            >
              Your browser does not support HTML video.
            </video>
          </div>
        </div>
      </div>
    </section>
  )
}
