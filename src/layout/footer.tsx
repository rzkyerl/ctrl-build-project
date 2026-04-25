import '../styles/css/footer.css'

const logoWhite = new URL('../assets/images/CTRLBuild-White-Footer.png', import.meta.url).href

const links = [
  { label: 'Layanan',    href: '#services' },
  { label: 'Portfolio',  href: '#portfolio' },
  { label: 'Cara Kerja', href: '#workflow' },
  { label: 'Kontak',     href: '#contact' },
]

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/ctrlbuild_' },
  { label: 'Email', href: 'mailto:ctrlbuild2023@gmail.com' },
]

export const Footer = () => {
  return (
    <footer className="ft-footer" id="footer">
      <div className="ft-container">

        <div className="ft-top">
          {/* Brand */}
          <div className="ft-brand">
            <img src={logoWhite} alt="CTRLBuild" className="ft-logo" />
            <p className="ft-tagline">
              Jasa & Joki pembuatan website,<br />mobile apps, dan UI/UX design.
            </p>
          </div>

          {/* Nav */}
          <nav className="ft-nav" aria-label="Footer">
            <span className="ft-nav-title">Menu</span>
            {links.map(l => (
              <a key={l.label} href={l.href} className="ft-link">{l.label}</a>
            ))}
          </nav>

          {/* Socials */}
          <div className="ft-socials">
            <span className="ft-nav-title">Ikuti Kami</span>
            {socials.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ft-social"
                aria-label={s.label}
              >
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>

        <div className="ft-divider" />

        <div className="ft-bottom">
          <p className="ft-copy">© {new Date().getFullYear()} CTRLBuild. Semua hak dilindungi.</p>
          <span className="ft-copy">PEMBANGUN NEGERI</span>
        </div>

      </div>
    </footer>
  )
}
