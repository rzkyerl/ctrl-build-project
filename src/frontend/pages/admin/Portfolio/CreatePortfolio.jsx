import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { PortfolioForm } from '../../../components/admin/PortfolioForm';

export const CreatePortfolio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      const processedData = {
        ...formData,
        features: formData.features ? JSON.parse(formData.features) : undefined,
      };

      await api.createPortfolio(processedData);
      navigate('/admin/portfolios');
    } catch (err) {
      setError(err.message || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortfolioForm
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitText="Create Portfolio"
      title="Create Portfolio"
      subtitle="Tambahkan portfolio proyek baru"
    />
  );
};
