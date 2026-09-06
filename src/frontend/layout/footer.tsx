import '../styles/css/footer.css'

const logoWhite = new URL('../../assets/images/CTRLBuild-White-Footer.png', import.meta.url).href

const links = [
  { label: 'Services',   href: '#services' },
  { label: 'Portfolio',  href: '#portfolio' },
  { label: 'How It Works', href: '#workflow' },
  { label: 'Contact',    href: '#contact' },
]

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/ctrlbuild_' },
  { label: 'Email',     href: 'mailto:ctrlbuild2023@gmail.com' },
  { label: 'WhatsApp',  href: 'https://wa.me/6281283481468' },
]

export const Footer = () => {
  return (
    <footer className="ft-footer" id="footer">
      <div className="ft-container">

        {/* Top row */}
        <div className="ft-top">
          {/* Brand */}
          <div className="ft-brand">
            <img src={logoWhite} alt="CTRLBuild" className="ft-logo" />
            <p className="ft-tagline">
              Professional website, mobile app,<br />and UI/UX design services.
            </p>
          </div>

          {/* Nav */}
          <nav className="ft-nav" aria-label="Footer">
            <span className="ft-nav-title">Navigation</span>
            {links.map(l => (
              <a key={l.label} href={l.href} className="ft-link">{l.label}</a>
            ))}
          </nav>

          {/* Socials */}
          <div className="ft-socials">
            <span className="ft-nav-title">Follow Us</span>
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

        {/* Bottom row */}
        <div className="ft-bottom">
          <p className="ft-copy">© {new Date().getFullYear()} CTRLBuild. All rights reserved.</p>
          <span className="ft-copy ft-tagline-bottom">BUILDERS OF THE NATION</span>
        </div>

      </div>
    </footer>
  )
}
