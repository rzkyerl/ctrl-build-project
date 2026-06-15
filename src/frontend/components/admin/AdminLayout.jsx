import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/css/admin.css';

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
    <div className="admin-layout">
      {/* Film grain overlay */}
      <div className="admin-film-grain" />

      {/* Sidebar */}
      <aside className="admin-sidebar">
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
        <nav className="admin-sidebar-nav">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.25rem' }}>
              <Link
                to="/admin/dashboard"
                className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '0.25rem' }}>
              <Link
                to="/admin/portfolios"
                className={`admin-nav-link ${isActive('/admin/portfolios') ? 'active' : ''}`}
              >
                Portfolios
              </Link>
            </li>
          </ul>
        </nav>

        {/* User info & logout */}
        <div className="admin-sidebar-footer">
          <div style={{ marginBottom: '1rem' }}>
            <p className="admin-sidebar-footer-label">
              Logged in as
            </p>
            <p className="admin-sidebar-footer-user">
              {user?.name || user?.email}
            </p>
          </div>
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className="admin-logout-link"
          >
            ← Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
