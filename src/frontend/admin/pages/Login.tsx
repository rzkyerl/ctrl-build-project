import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../backend/contexts/AuthContext'
import '../style/login.css'

const Login: React.FC = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect jika sudah login
  useEffect(() => {
    if (user) navigate('/admin/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate static random blob values sekali per mount
  const blobsData = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      size:              Math.random() * 200 + 150,
      left:              Math.random() * 80  + 10,
      top:               Math.random() * 80  + 10,
      animationDelay:    Math.random() * -20,
      animationDuration: Math.random() * 15  + 15,
    }))
  }, [])

  const blobRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20
          blob.style.marginLeft = `${x * speed}px`
          blob.style.marginTop  = `${y * speed}px`
        }
      })
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="mercury-wrapper">
      {/* SVG gooey filter */}
      <svg className="svg-filter-hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Background blobs */}
      <div className="stage">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(el) => { blobRefs.current[index] = el }}
            className="blob"
            style={{
              width:             `${data.size}px`,
              height:            `${data.size}px`,
              left:              `${data.left}%`,
              top:               `${data.top}%`,
              animationDelay:    `${data.animationDelay}s`,
              animationDuration: `${data.animationDuration}s`,
            }}
          />
        ))}
      </div>

      {/* Login form */}
      <main className="auth-container">
        <header className="login-header">
          <span className="brand-id">CTRL Build </span>
          <h1>ADMIN<br />ACCESS</h1>
        </header>

        <form autoComplete="off" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <div className="login-input-glow" />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                tabIndex={-1}
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
              </button>
            </div>
            <div className="login-input-glow" />
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="login-submit-wrap">
            <div className="mercury-drop" />
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </div>
        </form>

        <footer className="login-footer">
          <span>CTRL BUILD SYSTEM</span>
          <span>v0.0.1</span>
        </footer>
      </main>
    </div>
  )
}

export default Login
