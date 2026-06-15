import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { DeleteConfirmModal } from '../../../components/admin/DeleteConfirmModal';
import { PageHeader } from '../../../components/admin/PageHeader';
import { Button } from '../../../components/admin/Button';
import '../../../styles/css/admin.css';

export const TechStacks = () => {
  const [techStacks, setTechStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [techStackToDelete, setTechStackToDelete] = useState(null);

  const fetchTechStacks = async () => {
    try {
      const data = await api.getStacks();
      setTechStacks(data);
    } catch (err) {
      console.error('Failed to fetch tech stacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechStacks();
  }, []);

  const openDeleteModal = (techStack) => {
    setTechStackToDelete(techStack);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setTechStackToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!techStackToDelete) return;

    try {
      setDeletingId(techStackToDelete.id);
      await api.deleteStack(techStackToDelete.id);
      setTechStacks(prev => prev.filter(t => t.id !== techStackToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete tech stack:', err);
      alert('Failed to delete tech stack');
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
          title="Tech Stacks" 
          subtitle="Kelola semua tech stack dan tools"
        />
        <Link
          to="/admin/tech-stacks/create"
          className="admin-btn admin-btn-primary"
        >
          + Add Tech Stack
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
                <th>Icon</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {techStacks.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ 
                    textAlign: 'center', 
                    padding: '4rem 1.5rem', 
                    fontFamily: "'Inter', system-ui, sans-serif",
                    color: 'rgba(255,255,255,.3)',
                  }}>
                    No tech stacks found
                  </td>
                </tr>
              ) : (
                techStacks.map((techStack) => (
                  <tr key={techStack.id}>
                    <td>
                      {techStack.icon ? (
                        <img
                          src={techStack.icon}
                          alt={techStack.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '2px',
                        }} />
                      )}
                    </td>
                    <td>{techStack.name}</td>
                    <td>{techStack.slug}</td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          to={`/admin/tech-stacks/${techStack.id}`}
                          className="admin-btn admin-btn-secondary admin-btn-small"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/tech-stacks/${techStack.id}/edit`}
                          className="admin-btn admin-btn-secondary admin-btn-small"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => openDeleteModal(techStack)}
                          disabled={deletingId === techStack.id}
                        >
                          {deletingId === techStack.id ? 'Deleting...' : 'Delete'}
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

      <DeleteConfirmModal
        title={showDeleteModal ? `Delete "${techStackToDelete?.name}"?` : ''}
        message={showDeleteModal ? 'This action cannot be undone. Are you sure you want to delete this tech stack?' : ''}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        loading={deletingId === techStackToDelete?.id}
      />
    </div>
  );
};
