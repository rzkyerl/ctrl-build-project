import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { TechStackForm } from '../../../components/admin/TechStackForm';

export const CreateTechStack = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      await api.createStack(formData);
      navigate('/admin/tech-stacks');
    } catch (err) {
      setError(err.message || 'Failed to create tech stack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TechStackForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitText="Create Tech Stack"
      title="Create Tech Stack"
      subtitle="Tambahkan tech stack baru"
    />
  );
};
