import { Link } from 'react-router-dom'
import '../styles/css/portfolio-section.css'

import img1 from '../../assets/images/portofolio/3nt-studio/3nt-home-1.png'
import img2 from '../../assets/images/portofolio/berbagilagi/berbagi-home.png'
import img3 from '../../assets/images/portofolio/ektm/HomePages.png'
import img4 from '../../assets/images/portofolio/3nt-studio/3nt-photobooth-online.png'
import img5 from '../../assets/images/portofolio/the-days/thedays-home.png'
import img6 from '../../assets/images/portofolio/bookingin/bookingin-home.png'
import img7 from '../../assets/images/portofolio/anagata-executive/anagata-home.png'

const portfolioItems = [
  { src: img1, name: '3NT Studio',     cat: 'Web' },
  { src: img2, name: 'Berbagi Lagi',   cat: 'Web' },
  { src: img3, name: 'EKTM',           cat: 'Mobile' },
  { src: img4, name: 'Photobooth',     cat: 'Web' },
  { src: img5, name: 'The Days',       cat: 'Web' },
  { src: img6, name: 'BookingIn',      cat: 'Web' },
  { src: img7, name: 'Anagata Exec.',  cat: 'Web' },
]

const row1 = [portfolioItems[0], portfolioItems[2], portfolioItems[4], portfolioItems[1], portfolioItems[5], portfolioItems[3], portfolioItems[6]]
const row2 = [portfolioItems[3], portfolioItems[5], portfolioItems[1], portfolioItems[4], portfolioItems[2], portfolioItems[0], portfolioItems[6]]

export const PortfolioSection = () => {
  const row1Track = [...row1, ...row1]
  const row2Track = [...row2, ...row2]

  return (
    <section className="pf-section" id="portfolio">

      {/* Section header */}
      <div className="pf-header">
        <span className="section-label" style={{ color: 'rgba(255,255,255,0.35)' }}>— Selected Work</span>
        <h2 className="pf-big-title">Portfolio</h2>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="pf-marquee-row pf-marquee-row--forward">
        {row1Track.map((item, i) => (
          <div className="pf-marquee-img" key={`r1-${i}`}>
            <img src={item.src} alt={item.name} loading="lazy" draggable="false" />
            <div className="pf-img-overlay">
              <span className="pf-img-name">{item.name}</span>
              <span className="pf-img-cat">{item.cat}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 — scrolls right */}
      <div className="pf-marquee-row pf-marquee-row--reverse">
        {row2Track.map((item, i) => (
          <div className="pf-marquee-img" key={`r2-${i}`}>
            <img src={item.src} alt={item.name} loading="lazy" draggable="false" />
            <div className="pf-img-overlay">
              <span className="pf-img-name">{item.name}</span>
              <span className="pf-img-cat">{item.cat}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pf-btn-container">
        <Link to="/projects" className="pf-view-all-btn">
          <span>View All Projects</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </Link>
      </div>

    </section>
  )
}
