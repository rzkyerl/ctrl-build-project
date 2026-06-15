import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { DeleteConfirmModal } from '../../../components/admin/DeleteConfirmModal';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/admin/Button';
import '../../../styles/css/admin.css';

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
        <PageHeader 
          title="Portfolios" 
          subtitle="Kelola semua portfolio proyek"
        />
        <Link
          to="/admin/portfolios/create"
          className="admin-btn admin-btn-primary"
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
          <table className="admin-portfolio-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Actions</th>
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
                  <tr key={portfolio.id}>
                    <td>{portfolio.title}</td>
                    <td>{portfolio.category}</td>
                    <td>{portfolio.slug}</td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          to={`/admin/portfolios/${portfolio.id}`}
                          className="admin-btn admin-btn-secondary admin-btn-small"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/portfolios/${portfolio.id}/edit`}
                          className="admin-btn admin-btn-secondary admin-btn-small"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => openDeleteModal(portfolio)}
                          disabled={deletingId === portfolio.id}
                        >
                          {deletingId === portfolio.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
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
