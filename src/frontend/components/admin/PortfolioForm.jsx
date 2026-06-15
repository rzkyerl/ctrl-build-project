import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/css/admin.css';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { FormGroup } from './FormGroup';
import { ErrorMessage } from './ErrorMessage';
import { PageHeader } from './PageHeader';
import { api } from '../../services/api';

export const PortfolioForm = ({ 
  initialData = null, 
  onSubmit, 
  loading, 
  error, 
  submitText = 'Create Portfolio',
  title = 'Create Portfolio',
  subtitle = 'Tambahkan portfolio proyek baru'
}) => {
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    category: '',
    imgUrl: '',
    overview: '',
    goals: '',
    features: '',
    architecture: '',
    techStack: [],
    link: '',
  });
  const [availableTechStacks, setAvailableTechStacks] = useState([]);
  const [fetchingTechStacks, setFetchingTechStacks] = useState(true);

  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        const data = await api.getStacks();
        setAvailableTechStacks(data);
      } catch (err) {
        console.error('Failed to fetch tech stacks:', err);
      } finally {
        setFetchingTechStacks(false);
      }
    };
    fetchTechStacks();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        slug: initialData.slug || '',
        title: initialData.title || '',
        category: initialData.category || '',
        imgUrl: initialData.imgUrl || '',
        overview: initialData.overview || '',
        goals: initialData.goals || '',
        features: initialData.features ? JSON.stringify(initialData.features, null, 2) : '',
        architecture: initialData.architecture || '',
        techStack: initialData.techStack ? initialData.techStack.map(t => t.id) : [],
        link: initialData.link || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTechStackChange = (techStackId) => {
    setFormData(prev => {
      const isSelected = prev.techStack.includes(techStackId);
      return {
        ...prev,
        techStack: isSelected 
          ? prev.techStack.filter(id => id !== techStackId) 
          : [...prev.techStack, techStackId]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div data-admin-page>
      <PageHeader 
        title={title} 
        subtitle={subtitle}
        backTo="/admin/portfolios"
      />
      
      <ErrorMessage message={error} />
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div className="admin-form-grid">
          <FormGroup label="Slug *">
            <Input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="contoh-project-kerja"
            />
          </FormGroup>
          
          <FormGroup label="Category *">
            <Input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="Web Development"
            />
          </FormGroup>
        </div>
        
        <FormGroup label="Title *">
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Judul Proyek"
          />
        </FormGroup>
        
        <FormGroup label="Image URL">
          <Input
            type="text"
            name="imgUrl"
            value={formData.imgUrl}
            onChange={handleChange}
            placeholder="https://"
          />
        </FormGroup>
        
        <FormGroup label="Overview">
          <Textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows="4"
            placeholder="Deskripsi singkat proyek..."
          />
        </FormGroup>
        
        <FormGroup label="Goals">
          <Textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            rows="4"
            placeholder="Tujuan proyek..."
          />
        </FormGroup>
        
        <FormGroup label="Features (JSON)">
          <Textarea
            name="features"
            value={formData.features}
            onChange={handleChange}
            rows="4"
            placeholder='["Fitur 1", "Fitur 2"]'
          />
        </FormGroup>
        
        <FormGroup label="Architecture">
          <Textarea
            name="architecture"
            value={formData.architecture}
            onChange={handleChange}
            rows="4"
            placeholder="Deskripsi arsitektur..."
          />
        </FormGroup>
        
        <FormGroup label="Tech Stack *">
          {fetchingTechStacks ? (
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              color: 'rgba(255,255,255,.4)',
              margin: 0,
            }}>
              Loading tech stacks...
            </p>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              {availableTechStacks.map(techStack => (
                <label
                  key={techStack.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: formData.techStack.includes(techStack.id) 
                      ? 'rgba(255,255,255,0.15)' 
                      : 'rgba(255,255,255,0.05)',
                    border: formData.techStack.includes(techStack.id) 
                      ? '1px solid rgba(255,255,255,0.3)' 
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: '#ffffff',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.techStack.includes(techStack.id)}
                    onChange={() => handleTechStackChange(techStack.id)}
                    style={{
                      margin: 0,
                    }}
                  />
                  {techStack.icon && (
                    <img
                      src={techStack.icon}
                      alt={techStack.name}
                      style={{
                        width: '16px',
                        height: '16px',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                  {techStack.name}
                </label>
              ))}
            </div>
          )}
        </FormGroup>
        
        <FormGroup label="Live Link">
          <Input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://"
          />
        </FormGroup>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/admin/portfolios"
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </Link>
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? `${submitText.includes('Create') ? 'Creating' : 'Updating'}...` : submitText}
          </Button>
        </div>
      </form>
    </div>
  );
};
