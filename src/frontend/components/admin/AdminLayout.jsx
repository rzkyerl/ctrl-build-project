import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const logoWhite = new URL('../../../assets/images/CTRLBuild-White.png', import.meta.url).href;

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div data-admin-page style={{ display: 'flex', minHeight: '100vh', background: '#000000', position: 'relative' }}>
      {/* Film grain overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'multiply',
      }} />

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'rgba(0,0,0,0.85)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '3rem' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <img
              src={logoWhite}
              alt="CTRLBuild"
              style={{
                height: '36px',
                width: 'auto',
                opacity: 0.9,
              }}
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.25rem' }}>
              <Link
                to="/admin/dashboard"
                style={{
                  display: 'block',
                  padding: '0.85rem 1.25rem',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: isActive('/admin/dashboard') ? '#ffffff' : 'rgba(255,255,255,.4)',
                  textDecoration: 'none',
                  borderRadius: '2px',
                  background: isActive('/admin/dashboard') ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/admin/dashboard')) {
                    e.target.style.background = 'rgba(255,255,255,0.03)';
                    e.target.style.color = 'rgba(255,255,255,.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/admin/dashboard')) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'rgba(255,255,255,.4)';
                  }
                }}
              >
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '0.25rem' }}>
              <Link
                to="/admin/portfolios"
                style={{
                  display: 'block',
                  padding: '0.85rem 1.25rem',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: isActive('/admin/portfolios') ? '#ffffff' : 'rgba(255,255,255,.4)',
                  textDecoration: 'none',
                  borderRadius: '2px',
                  background: isActive('/admin/portfolios') ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive('/admin/portfolios')) {
                    e.target.style.background = 'rgba(255,255,255,0.03)';
                    e.target.style.color = 'rgba(255,255,255,.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive('/admin/portfolios')) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'rgba(255,255,255,.4)';
                  }
                }}
              >
                Portfolios
              </Link>
            </li>
          </ul>
        </nav>

        {/* User info & logout */}
        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.3)',
              margin: '0 0 0.35rem 0',
            }}>
              Logged in as
            </p>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.85rem',
              color: '#ffffff',
              margin: 0,
            }}>
              {user?.name || user?.email}
            </p>
          </div>
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.4)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'rgba(255,100,100,.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'rgba(255,255,255,.4)';
            }}
          >
            ← Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2.5rem 3rem', position: 'relative', zIndex: 10 }}>
        <Outlet />
      </main>
    </div>
  );
};
