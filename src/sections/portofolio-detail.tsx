import { Link } from 'react-router-dom'
import '../styles/css/portofolio-detail.css'

// Import mock images
import img3nt from '../assets/images/portofolio/3nt-studio/3nt-home-mockup-opt.webp'
import imgBookingin from '../assets/images/portofolio/bookingin/bookingin-home-mockup-opt.webp'
import imgEktm from '../assets/images/portofolio/ektm/HomePages.png'
import imgBerbagi from '../assets/images/portofolio/berbagilagi/berbagi-home-mockup-opt.webp'
import imgTheDays from '../assets/images/portofolio/the-days/thedays-home-mockup-opt.webp'
import imgAnagata from '../assets/images/portofolio/anagata-executive/anagata-home-mockup.png'

const projects = [
  { id: '3nt-studio', title: '3NT Studio - Website Photostudio', category: 'Web Development', img: img3nt },
  { id: 'bookingin', title: 'Bookingin - Website Hotel', category: 'Web Development', img: imgBookingin },
  { id: 'ektm', title: 'EKTM - Mobile Apps EKTM', category: 'Mobile Apps', img: imgEktm },
  { id: 'berbagi-lagi', title: 'Berbagi Lagi - Website Donasi', category: 'Web Development', img: imgBerbagi },
  { id: 'the-days', title: 'The Days - Website Coffee', category: 'Web Development', img: imgTheDays },
  { id: 'anagata-executive', title: 'Anagata Executive - Website JobPortal', category: 'Web Development', img: imgAnagata },
]

export const PortofolioDetail = () => {
  return (
    <div className="projects-page-wrapper">
      <section className="projects-page">
        <div className="projects-header">
          <h1 className="projects-title">Portofolio</h1>
        </div>
        
        <div className="projects-grid">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
              <div className="project-img-wrapper">
                <img src={project.img} alt={project.title} loading="lazy" draggable="false" />
              </div>
              <div className="project-info">
                <h2 className="project-name">{project.title}</h2>
                <p className="project-category">{project.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
