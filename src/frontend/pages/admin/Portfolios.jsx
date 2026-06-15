import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

export const Portfolios = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState(null);

  const fetchPortfolios = async () => {
    try {
      const data = await api.getPortfolios();
      setPortfolios(data);
    } catch (err) {
      console.error('Failed to fetch portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const openDeleteModal = (portfolio) => {
    setPortfolioToDelete(portfolio);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setPortfolioToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!portfolioToDelete) return;

    try {
      setDeletingId(portfolioToDelete.id);
      await api.deletePortfolio(portfolioToDelete.id);
      // Refresh list after deletion
      setPortfolios(prev => prev.filter(p => p.id !== portfolioToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete portfolio:', err);
      alert('Failed to delete portfolio');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div data-admin-page>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        marginBottom: '2.5rem' 
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            Portfolios
          </h1>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,.45)',
            margin: 0,
          }}>
            Kelola semua portfolio proyek
          </p>
        </div>
        <Link
          to="/admin/portfolios/create"
          style={{
            padding: '0.9rem 1.75rem',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            borderRadius: '2px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
          onMouseLeave={(e) => e.target.style.background = '#ffffff'}
        >
          + Add Portfolio
        </Link>
      </div>

      {loading ? (
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          color: 'rgba(255,255,255,.4)',
        }}>Loading...</p>
      ) : (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '2px', 
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '1.25rem 1.5rem', 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                }}>
                  Title
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '1.25rem 1.5rem', 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                }}>
                  Category
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '1.25rem 1.5rem', 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                }}>
                  Slug
                </th>
                <th style={{ 
                  textAlign: 'right', 
                  padding: '1.25rem 1.5rem', 
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolios.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ 
                    textAlign: 'center', 
                    padding: '4rem 1.5rem', 
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: 'rgba(255,255,255,.3)',
                  }}>
                    No portfolios found
                  </td>
                </tr>
              ) : (
                portfolios.map((portfolio) => (
                  <tr key={portfolio.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ 
                      padding: '1.25rem 1.5rem', 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.95rem',
                      color: '#ffffff',
                    }}>
                      {portfolio.title}
                    </td>
                    <td style={{ 
                      padding: '1.25rem 1.5rem', 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,.6)',
                    }}>
                      {portfolio.category}
                    </td>
                    <td style={{ 
                      padding: '1.25rem 1.5rem', 
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.9rem',
                      color: 'rgba(255,255,255,.4)',
                    }}>
                      {portfolio.slug}
                    </td>
                    <td style={{ 
                      padding: '1.25rem 1.5rem', 
                      textAlign: 'right',
                    }}>
                      <Link
                        to={`/admin/portfolios/${portfolio.id}`}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '2px',
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          letterSpacing: '.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,.6)',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          marginRight: '0.75rem',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                          e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                          e.target.style.color = 'rgba(255,255,255,.6)';
                        }}
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin/portfolios/${portfolio.id}/edit`}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '2px',
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          letterSpacing: '.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,.6)',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          marginRight: '0.75rem',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                          e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                          e.target.style.color = 'rgba(255,255,255,.6)';
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => openDeleteModal(portfolio)}
                        disabled={deletingId === portfolio.id}
                        style={{
                          padding: '0.6rem 1.25rem',
                          background: 'transparent',
                          border: '1px solid rgba(255,100,100,0.3)',
                          borderRadius: '2px',
                          fontFamily: "'Inter', system-ui, sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          letterSpacing: '.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,120,120,.8)',
                          cursor: deletingId === portfolio.id ? 'not-allowed' : 'pointer',
                          opacity: deletingId === portfolio.id ? '0.6' : '1',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (deletingId !== portfolio.id) {
                            e.target.style.background = 'rgba(255,100,100,0.1)';
                            e.target.style.borderColor = 'rgba(255,100,100,0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = 'rgba(255,100,100,0.3)';
                        }}
                      >
                        {deletingId === portfolio.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        title={showDeleteModal ? `Delete "${portfolioToDelete?.title}"?` : ''}
        message={showDeleteModal ? 'This action cannot be undone. Are you sure you want to delete this portfolio?' : ''}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        loading={deletingId === portfolioToDelete?.id}
      />
    </div>
  );
};
