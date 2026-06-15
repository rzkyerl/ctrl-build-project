import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Button } from '../../components/admin/Button';
import { Input } from '../../components/admin/Input';
import { FormGroup } from '../../components/admin/FormGroup';
import { ErrorMessage } from '../../components/admin/ErrorMessage';
import '../../styles/css/admin.css';

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
    <div className="admin-login">
      {/* Film grain overlay */}
      <div className="admin-film-grain" />

      {/* Nav link back to home */}
      <div style={{
        position: 'absolute',
        top: '2.5rem',
        left: '3rem',
        zIndex: 20,
      }} />

      {/* Main login container */}
      <div className="admin-login-container">
        <div className="admin-login-card">
          {/* Logo */}
          <div className="admin-login-logo">
            <Link to="/">
              <img
                src={logoWhite}
                alt="CTRLBuild"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="admin-login-title">
            <h1>Admin Login</h1>
            <p>Masuk ke dashboard CTRLBuild</p>
          </div>

          {/* Error message */}
          <ErrorMessage message={error} />

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <FormGroup label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>

      {/* Bottom ticker-like decoration */}
      <div className="admin-login-bottom">
        <div className="admin-login-bottom-text">
          CTRLBuild · Admin Portal · Secure Access · CTRLBuild · Admin Portal · Secure Access · 
        </div>
      </div>
    </div>
  );
};
