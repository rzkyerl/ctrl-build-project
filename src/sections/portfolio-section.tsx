import '../styles/css/portfolio-section.css'

// Import all 3nt-studio images
import img1 from '../assets/images/portofolio/3nt-studio/3nt-home-1.png'
import img2 from '../assets/images/portofolio/3nt-studio/3nt-booking.png'
import img3 from '../assets/images/portofolio/3nt-studio/3nt-location.png'
import img4 from '../assets/images/portofolio/3nt-studio/3nt-photobooth-online.png'
import img5 from '../assets/images/portofolio/3nt-studio/3nt-portofolio.png'
import img6 from '../assets/images/portofolio/3nt-studio/3nt-services.png'

const allImages = [img1, img2, img3, img4, img5, img6]

// Split images for two rows with different ordering
const row1Images = [img1, img3, img5, img2, img6, img4]
const row2Images = [img4, img6, img2, img5, img3, img1]

export const PortfolioSection = () => {
  // Duplicate images enough times for seamless loop
  // We need two identical sets so the animation loops perfectly
  const row1Track = [...row1Images, ...row1Images]
  const row2Track = [...row2Images, ...row2Images]

  return (
    <section className="pf-section" id="portfolio">

      {/* Row 1 — scrolls left */}
      <div className="pf-marquee-row pf-marquee-row--forward">
        {row1Track.map((src, i) => (
          <div className="pf-marquee-img" key={`r1-${i}`}>
            <img src={src} alt="" loading="lazy" draggable="false" />
          </div>
        ))}
      </div>

      {/* Row 2 — scrolls right */}
      <div className="pf-marquee-row pf-marquee-row--reverse">
        {row2Track.map((src, i) => (
          <div className="pf-marquee-img" key={`r2-${i}`}>
            <img src={src} alt="" loading="lazy" draggable="false" />
          </div>
        ))}
      </div>

    </section>
  )
}
