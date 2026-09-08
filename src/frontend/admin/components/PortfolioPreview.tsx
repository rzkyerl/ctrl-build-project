import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Feature } from './FeatureList'

interface PreviewData {
  title: string
  category: string
  imageUrl: string
  overview: string
  goals: string
  features: Feature[]
  architecture: string
  techStack: string[]
  link: string
}

interface PortfolioPreviewProps {
  data: PreviewData
}

export const PortfolioPreview: React.FC<PortfolioPreviewProps> = ({ data }) => {
  const hasContent = data.title || data.overview || data.imageUrl

  if (!hasContent) {
    return (
      <div style={{ padding:40, textAlign:'center', color:'var(--ad-text-muted)', fontSize:13 }}>
        Start filling the form to see a preview
      </div>
    )
  }

  return (
    <div style={{ fontSize:13, lineHeight:1.6, color:'var(--ad-text)' }}>
      {/* Hero image */}
      {data.imageUrl && (
        <div style={{ marginBottom:16 }}>
          <img
            src={data.imageUrl}
            alt={data.title}
            style={{ width:'100%', borderRadius:6, objectFit:'cover', maxHeight:200, display:'block' }}
          />
        </div>
      )}

      {/* Title + category */}
      <div style={{ marginBottom:12 }}>
        {data.category && (
          <span style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ad-text-muted)' }}>
            {data.category}
          </span>
        )}
        {data.title && (
          <h2 style={{ fontSize:18, fontWeight:700, marginTop:4, marginBottom:0, letterSpacing:'-0.02em' }}>
            {data.title}
          </h2>
        )}
      </div>

      {/* Live link */}
      {data.link && (
        <a
          href={data.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, color:'var(--ad-text-dim)', fontFamily:'var(--ad-mono)', marginBottom:16, textDecoration:'none', borderBottom:'1px solid var(--ad-border)' }}
        >
          <ExternalLink size={11} /> {data.link}
        </a>
      )}

      {/* Overview */}
      {data.overview && (
        <section style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ad-text-muted)', marginBottom:6 }}>Overview</h3>
          <p style={{ color:'var(--ad-text-dim)', margin:0 }}>{data.overview}</p>
        </section>
      )}

      {/* Goals */}
      {data.goals && (
        <section style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ad-text-muted)', marginBottom:6 }}>Goals</h3>
          <p style={{ color:'var(--ad-text-dim)', margin:0 }}>{data.goals}</p>
        </section>
      )}

      {/* Features */}
      {data.features.filter(f => f.title).length > 0 && (
        <section style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ad-text-muted)', marginBottom:8 }}>Features</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.features.filter(f => f.title).map((f, i) => (
              <div key={i} style={{ padding:'8px 10px', background:'var(--ad-surface2)', borderRadius:6, border:'1px solid var(--ad-border)' }}>
                <div style={{ fontWeight:600, fontSize:12, marginBottom:2 }}>{f.title}</div>
                {f.desc && <div style={{ fontSize:11, color:'var(--ad-text-dim)' }}>{f.desc}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Architecture */}
      {data.architecture && (
        <section style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ad-text-muted)', marginBottom:6 }}>Architecture</h3>
          <p style={{ color:'var(--ad-text-dim)', margin:0 }}>{data.architecture}</p>
        </section>
      )}

      {/* Tech Stack */}
      {data.techStack.length > 0 && (
        <section>
          <h3 style={{ fontFamily:'var(--ad-mono)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ad-text-muted)', marginBottom:8 }}>Tech Stack</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {data.techStack.map((t, i) => (
              <span key={i} style={{ padding:'3px 8px', borderRadius:12, border:'1px solid var(--ad-border)', fontSize:11, color:'var(--ad-text-dim)', fontFamily:'var(--ad-mono)' }}>
                {t}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
