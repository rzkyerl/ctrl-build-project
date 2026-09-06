import { Link } from 'react-router-dom'
import WebGLGallery from '../components/ui/WebGLGallery';
import '../styles/css/portfolio-section.css'

import img1 from '../../assets/images/portofolio/3nt-studio/3nt-home-1.webp'
import img2 from '../../assets/images/portofolio/berbagilagi/berbagi-home.webp'
import img3 from '../../assets/images/portofolio/ektm/HomePages.webp'
import img4 from '../../assets/images/portofolio/3nt-studio/3nt-photobooth-online.webp'
import img5 from '../../assets/images/portofolio/the-days/thedays-home.webp'
import img6 from '../../assets/images/portofolio/bookingin/bookingin-home.webp'
import img7 from '../../assets/images/portofolio/anagata-executive/anagata-home.webp'

const PORTFOLIO_ITEMS = [
  { id: 1, url: img1, title: '3NT Studio',      cat: 'Web Design' },
  { id: 2, url: img2, title: 'Berbagi Lagi',    cat: 'Web App'    },
  { id: 3, url: img3, title: 'EKTM',            cat: 'Mobile App' },
  { id: 4, url: img4, title: 'Photobooth',      cat: 'Web Design' },
  { id: 5, url: img5, title: 'The Days',        cat: 'Web Design' },
  { id: 6, url: img6, title: 'BookingIn',       cat: 'Web App'    },
  { id: 7, url: img7, title: 'Anagata Exec.',   cat: 'Web Design' },
]

export const PortfolioSection = () => (
  <section className="pf-section" id="portfolio">

    <div className="pf-header">
      <span className="section-label" style={{ color: 'rgba(255,255,255,0.35)' }}>
        — Selected Work
      </span>
      <h2 className="pf-big-title">Portfolio</h2>
    </div>

    <div className="pf-carousel-wrap">
      <WebGLGallery items={PORTFOLIO_ITEMS} />
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
