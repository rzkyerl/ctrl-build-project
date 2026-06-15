import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { PortfolioForm } from '../../../components/admin/PortfolioForm';

export const EditPortfolio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await api.getPortfolioById(id);
        setPortfolio(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch portfolio');
      } finally {
        setFetching(false);
      }
    };
    fetchPortfolio();
  }, [id]);

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      // Process techStack from comma-separated to array
      const processedData = {
        ...formData,
        techStack: formData.techStack.split(',').map(s => s.trim()).filter(s => s),
        features: formData.features ? JSON.parse(formData.features) : null,
      };

      await api.updatePortfolio(id, processedData);
      navigate('/admin/portfolios');
    } catch (err) {
      setError(err.message || 'Failed to update portfolio');
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
    <PortfolioForm
      initialData={portfolio}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      submitText="Update Portfolio"
      title="Edit Portfolio"
      subtitle="Ubah detail portfolio proyek"
    />
  );
};
