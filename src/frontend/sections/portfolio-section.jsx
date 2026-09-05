import { Link } from 'react-router-dom'
import { ImageStreamHero } from '../components/ui/ImageStreamHero'
import '../styles/css/portfolio-section.css'

// Portfolio screenshot images — all landscape, used as the corridor stream
import img1 from '../../assets/images/portofolio/3nt-studio/3nt-home-1.webp'
import img2 from '../../assets/images/portofolio/berbagilagi/berbagi-home.webp'
import img3 from '../../assets/images/portofolio/ektm/HomePages.webp'
import img4 from '../../assets/images/portofolio/3nt-studio/3nt-photobooth-online.webp'
import img5 from '../../assets/images/portofolio/the-days/thedays-home.webp'
import img6 from '../../assets/images/portofolio/bookingin/bookingin-home.webp'
import img7 from '../../assets/images/portofolio/anagata-executive/anagata-home.webp'

// Feed the corridor — both rails loop through this list
const STREAM_IMAGES = [
  { src: img1, alt: '3NT Studio website' },
  { src: img2, alt: 'Berbagi Lagi web app' },
  { src: img3, alt: 'EKTM mobile app' },
  { src: img4, alt: 'Photobooth web design' },
  { src: img5, alt: 'The Days website' },
  { src: img6, alt: 'BookingIn web app' },
  { src: img7, alt: 'Anagata Executive website' },
]

// Corridor geometry tuned for landscape screenshots (wider cards, shallower
// height) so the full image composition is visible inside each card.
const CORRIDOR_PATH = {
  cardWidth:   22,   // slightly wider cards to suit landscape images
  cardHeight:  14,   // height: 14 / 22 ≈ 0.64 ratio → landscape-friendly
  cardRadius:  0.5,
  birthHeight: 3.0,
  exitHeight:  48,
  railBirth:  -12,
  railExit:    46,
  fan:         3.2,
  turnBirth:   5,
  turnExit:    26,
  stops:       28,
}

export const PortfolioSection = () => (
  <section className="pf-section" id="portfolio">

    <ImageStreamHero
      images={STREAM_IMAGES}
      cards={9}
      speed={20}
      axis={58}
      path={CORRIDOR_PATH}
      className="pf-corridor"
    >
      {/* ── Foreground content ── */}
      <div className="pf-foreground">

        {/* Top-left: section label + title */}
        <div className="pf-header">
          <span className="section-label pf-label">— Selected Work</span>
          <h2 className="pf-big-title">Portfolio</h2>
        </div>

        {/* Bottom-right: CTA */}
        <div className="pf-cta">
          <Link to="/projects" className="pf-view-all-btn">
            <span>View All Projects</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </Link>
        </div>

      </div>
    </ImageStreamHero>

  </section>
)
