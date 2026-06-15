import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/css/admin.css';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { FormGroup } from './FormGroup';
import { ErrorMessage } from './ErrorMessage';
import { PageHeader } from './PageHeader';

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
    techStack: '',
    link: '',
  });

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
        techStack: initialData.techStack ? initialData.techStack.join(', ') : '',
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
        
        <FormGroup label="Tech Stack (comma separated) *">
          <Input
            type="text"
            name="techStack"
            value={formData.techStack}
            onChange={handleChange}
            required
            placeholder="React, Node.js, PostgreSQL"
          />
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
