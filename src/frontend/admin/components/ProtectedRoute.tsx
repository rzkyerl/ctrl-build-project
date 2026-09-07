import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../backend/contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Tunggu Firebase selesai cek auth state sebelum redirect
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        letterSpacing: '0.05em',
      }}>
        Loading...
      </div>
    )
  }

  // Belum login → redirect ke halaman login
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
