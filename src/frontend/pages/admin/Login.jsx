import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const logoWhite = new URL('../../../assets/images/CTRLBuild-White.png', import.meta.url).href;

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      data-admin-page 
      style={{
        minHeight: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Film grain overlay seperti frontend */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        pointerEvents: 'none',
        zIndex: 1,
        mixBlendMode: 'multiply',
      }} />

      {/* Nav link back to home */}
      <div style={{
        position: 'absolute',
        top: '2.5rem',
        left: '3rem',
        zIndex: 20,
      }}>
      </div>

      {/* Main login container */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '3.5rem' }}>
            <Link to="/">
              <img
                src={logoWhite}
                alt="CTRLBuild"
                style={{
                  height: '48px',
                  width: 'auto',
                  opacity: 0.9,
                }}
              />
            </Link>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}>
              Admin Login
            </h1>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,.45)',
              margin: 0,
            }}>
              Masuk ke dashboard CTRLBuild
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.08)',
              border: '1px solid rgba(255, 68, 68, 0.25)',
              color: '#ff6b6b',
              padding: '1rem 1.25rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.5)',
                marginBottom: '0.75rem',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  color: '#ffffff',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease, background 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.5)',
                marginBottom: '0.75rem',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '2px',
                  color: '#ffffff',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease, background 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.03)';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1.1rem 2rem',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '2px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.6' : '1',
                transition: 'background 0.3s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#e0e0e0';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff';
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom ticker-like decoration */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '38px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: '.58rem',
          fontWeight: 700,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.18)',
          whiteSpace: 'nowrap',
        }}>
          CTRLBUILD · ADMIN PORTAL · SECURE ACCESS · CTRLBUILD · ADMIN PORTAL · SECURE ACCESS · 
        </div>
      </div>
    </div>
  );
};
