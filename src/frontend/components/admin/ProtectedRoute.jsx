import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
      }}>
        Loading...
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/admin/login" replace />;
};
