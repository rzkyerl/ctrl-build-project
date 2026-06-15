import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader } from '../../components/admin/PageHeader';
import { Button } from '../../components/admin/Button';
import { ErrorMessage } from '../../components/admin/ErrorMessage';
import '../../styles/css/admin.css';

export const ShowPortfolio = () => {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await api.getPortfolioById(id);
        setPortfolio(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch portfolio');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
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
          to="/admin/portfolios"
          style={{
            color: 'rgba(255,255,255,.6)',
            fontFamily: "'Inter', system-ui, sans-serif",
            textDecoration: 'underline',
          }}
        >
          Back to Portfolios
        </Link>
      </div>
    );
  }

  return (
    <div data-admin-page>
      <PageHeader
        title={portfolio.title}
        subtitle="Detail portfolio proyek"
        backTo="/admin/portfolios"
      />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          to={`/admin/portfolios/${portfolio.id}/edit`}
          className="admin-btn admin-btn-secondary"
        >
          Edit
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
      }}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <p className="admin-stat-label">Slug</p>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              color: '#ffffff',
              margin: 0,
            }}>
              {portfolio.slug}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p className="admin-stat-label">Category</p>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              color: '#ffffff',
              margin: 0,
            }}>
              {portfolio.category}
            </p>
          </div>

          {portfolio.imgUrl && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Image URL</p>
              <a
                href={portfolio.imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  color: 'rgba(255,255,255,.6)',
                  textDecoration: 'underline',
                }}
              >
                {portfolio.imgUrl}
              </a>
            </div>
          )}

          {portfolio.overview && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Overview</p>
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,.8)',
                margin: 0,
                lineHeight: '1.6',
              }}>
                {portfolio.overview}
              </p>
            </div>
          )}

          {portfolio.goals && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Goals</p>
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,.8)',
                margin: 0,
                lineHeight: '1.6',
              }}>
                {portfolio.goals}
              </p>
            </div>
          )}
        </div>

        <div>
          {portfolio.features && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Features</p>
              <ul style={{
                paddingLeft: '1.25rem',
                margin: 0,
              }}>
                {Array.isArray(portfolio.features) ? (
                  portfolio.features.map((feature, i) => (
                    <li key={i} style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.95rem',
                      color: 'rgba(255,255,255,.8)',
                      marginBottom: '0.25rem',
                    }}>
                      {feature}
                    </li>
                  ))
                ) : (
                  <li style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '0.95rem',
                    color: 'rgba(255,255,255,.8)',
                  }}>
                    {JSON.stringify(portfolio.features)}
                  </li>
                )}
              </ul>
            </div>
          )}

          {portfolio.architecture && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Architecture</p>
              <p style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,.8)',
                margin: 0,
                lineHeight: '1.6',
              }}>
                {portfolio.architecture}
              </p>
            </div>
          )}

          {portfolio.techStack && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Tech Stack</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {portfolio.techStack.map((tech, i) => (
                  <span key={i} style={{
                    padding: '0.35rem 0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '0.75rem',
                    color: '#ffffff',
                  }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {portfolio.link && (
            <div style={{ marginBottom: '2rem' }}>
              <p className="admin-stat-label">Live Link</p>
              <a
                href={portfolio.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.95rem',
                  color: 'rgba(255,255,255,.6)',
                  textDecoration: 'underline',
                }}
              >
                {portfolio.link}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
