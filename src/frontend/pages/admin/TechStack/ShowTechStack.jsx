import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/admin/Button';
import { ErrorMessage } from '../../../components/admin/ErrorMessage';
import '../../../styles/css/admin.css';

export const ShowTechStack = () => {
  const { id } = useParams();
  const [techStack, setTechStack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTechStack = async () => {
      try {
        const data = await api.getStack(id);
        setTechStack(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch tech stack');
      } finally {
        setLoading(false);
      }
    };
    fetchTechStack();
  }, [id]);

  if (loading) {
    return (
      <div data-admin-page style={{
        padding: '4rem 0',
        textAlign: 'center',
        color: 'rgba(255,255,255,.4)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div data-admin-page style={{ padding: '4rem 0', textAlign: 'center' }}>
        <ErrorMessage message={error} />
        <Link
          to="/admin/tech-stacks"
          style={{
            color: 'rgba(255,255,255,.6)',
            fontFamily: "'Inter', system-ui, sans-serif",
            textDecoration: 'underline',
          }}
        >
          Back to Tech Stacks
        </Link>
      </div>
    );
  }

  return (
    <div data-admin-page>
      <PageHeader
        title={techStack.name}
        subtitle="Detail tech stack"
        backTo="/admin/tech-stacks"
      />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          to={`/admin/tech-stacks/${techStack.id}/edit`}
          className="admin-btn admin-btn-secondary"
        >
          Edit
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <p className="admin-stat-label">Slug</p>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              color: '#ffffff',
              margin: 0,
            }}>
              {techStack.slug}
            </p>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '2rem' }}>
            <p className="admin-stat-label">Icon</p>
            {techStack.icon ? (
              <img
                src={techStack.icon}
                alt={techStack.name}
                style={{
                  width: '128px',
                  height: '128px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,.4)',
                margin: 0,
              }}>
                No icon
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
