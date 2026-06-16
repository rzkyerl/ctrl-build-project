import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { TechStackForm } from '../../../components/admin/TechStackForm';

export const EditTechStack = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [techStack, setTechStack] = useState(null);

  useEffect(() => {
    const fetchTechStack = async () => {
      try {
        const data = await api.getStack(id);
        setTechStack(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch tech stack');
      } finally {
        setFetching(false);
      }
    };
    fetchTechStack();
  }, [id]);

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      await api.updateStack(id, formData);
      navigate('/admin/tech-stacks');
    } catch (err) {
      setError(err.message || 'Failed to update tech stack');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{
        padding: '4rem 0',
        textAlign: 'center',
        color: 'rgba(255,255,255,.4)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        Loading...
      </div>
    );
  }

  return (
    <TechStackForm
      initialData={techStack}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitText="Update Tech Stack"
      title="Edit Tech Stack"
      subtitle="Ubah detail tech stack"
    />
  );
};
