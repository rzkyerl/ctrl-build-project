import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/css/admin.css';
import { Button } from './Button';
import { Input } from './Input';
import { FormGroup } from './FormGroup';
import { ErrorMessage } from './ErrorMessage';
import { PageHeader } from './PageHeader';

export const TechStackForm = ({ 
  initialData = null, 
  onSubmit, 
  loading, 
  error, 
  submitText = 'Create Tech Stack',
  title = 'Create Tech Stack',
  subtitle = 'Tambahkan tech stack baru'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        icon: initialData.icon || '',
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
        backTo="/admin/tech-stacks"
      />
      
      <ErrorMessage message={error} />
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div className="admin-form-grid">
          <FormGroup label="Name *">
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="React"
            />
          </FormGroup>
          
          <FormGroup label="Slug *">
            <Input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="react"
            />
          </FormGroup>
        </div>
        
        <FormGroup label="Icon URL">
          <Input
            type="text"
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            placeholder="https://cdn.simpleicons.org/react/000000"
          />
        </FormGroup>
        
        {formData.icon && (
          <div style={{ marginBottom: '2rem' }}>
            <p className="admin-stat-label">Preview Icon</p>
            <img
              src={formData.icon}
              alt="Icon Preview"
              style={{
                width: '64px',
                height: '64px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/admin/tech-stacks"
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
