import { useParams, Link } from 'react-router-dom'
import '../styles/css/portofolio-more-detail.css'

// Import project images (reusing existing ones)
import img3nt from '../assets/images/portofolio/3nt-studio/3nt-home-mockup-opt.webp'
import imgBookingin from '../assets/images/portofolio/bookingin/bookingin-home-mockup-opt.webp'
import imgEktm from '../assets/images/portofolio/ektm/HomePages.png'
import imgBerbagi from '../assets/images/portofolio/berbagilagi/berbagi-home-mockup-opt.webp'
import imgTheDays from '../assets/images/portofolio/the-days/thedays-home-mockup-opt.webp'
import imgAnagata from '../assets/images/portofolio/anagata-executive/anagata-home-mockup.png'

const projectDetails = {
  '3nt-studio': {
    title: '3NT Studio - Website Photostudio',
    category: 'Web Development',
    img: img3nt,
    overview: 'Proyek ini adalah 3NT Studio, sebuah platform website premium yang berfungsi sebagai Portfolio Fotografi & Sistem Booking Otomatis. Website ini dirancang dengan estetika modern, minimalis, dan monokromatik untuk memberikan kesan mewah dan profesional bagi sebuah studio foto.',
    goals: 'Proyek ini bertujuan untuk menjadi etalase digital bagi 3NT Studio dalam memamerkan karya fotografi mereka sekaligus menyediakan sistem manajemen pemesanan (booking) yang terintegrasi bagi calon klien.',
    features: [
      { title: 'Portfolio Dinamis', desc: 'Galeri foto yang dapat dikelola secara langsung melalui Sanity CMS dengan efek visual menarik.' },
      { title: 'Sistem Booking Otomatis', desc: 'Pengguna dapat memilih paket dan tanggal pemesanan dengan konfirmasi PDF real-time.' },
      { title: 'Interactive Photobooth', desc: 'Fitur unik untuk mengambil foto monokrom langsung dari browser.' },
      { title: 'Cinematic Hero Section', desc: 'Latar belakang video layar penuh dan animasi tipografi yang halus.' },
      { title: 'Admin Dashboard', desc: 'Dashboard berbasis Sanity Studio untuk mengelola konten dan reservasi.' }
    ],
    architecture: 'Proyek ini menggunakan arsitektur modern yang memisahkan Frontend (React 19 + Vite + Tailwind CSS 4) dan Backend/CMS (Sanity.io).',
    techStack: ['React 19', 'Vite', 'Tailwind CSS 4', 'Sanity CMS', 'Framer Motion', 'jsPDF', 'TypeScript'],
    link: 'https://3nt-studio.vercel.app'
  },
  // Add more projects as needed
}

export const PortofolioMoreDetail = () => {
  const { id } = useParams()
  const project = projectDetails[id as keyof typeof projectDetails]

  if (!project) {
    return (
      <div className="project-more-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Project Not Found</h2>
          <Link to="/projects" style={{ color: '#fff', marginTop: '20px', display: 'inline-block' }}>Back to Portfolio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="project-more-detail">
      <div className="detail-container">
        <header className="detail-header">
          <Link to="/projects" className="detail-category">← Back to Portfolio</Link>
          <span className="detail-category">{project.category}</span>
          <h1 className="detail-title">{project.title}</h1>
        </header>

        <div className="detail-hero-img">
          <img src={project.img} alt={project.title} />
        </div>

        <div className="detail-content">
          <aside className="detail-sidebar">
            <div className="sidebar-item">
              <h3>Role</h3>
              <p>Full-stack Developer / UI Designer</p>
            </div>
            <div className="sidebar-item">
              <h3>Technology</h3>
              <ul>
                {project.techStack.map(tech => (
                  <li key={tech} className="tech-tag">{tech}</li>
                ))}
              </ul>
            </div>
            {project.link && (
              <div className="sidebar-item">
                <h3>Live Project</h3>
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="visit-btn">
                  Visit Website
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}
          </aside>

          <main className="detail-main">
            <section className="detail-section">
              <h2>Project Overview</h2>
              <p>{project.overview}</p>
            </section>

            <section className="detail-section">
              <h2>Goals</h2>
              <p>{project.goals}</p>
            </section>

            <section className="detail-section">
              <h2>Core Features</h2>
              <div className="feature-list">
                {project.features.map(feature => (
                  <div key={feature.title} className="feature-item">
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2>Architecture</h2>
              <p>{project.architecture}</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
