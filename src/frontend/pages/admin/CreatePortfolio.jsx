import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

export const CreatePortfolio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Process techStack from comma-separated to array
      const processedData = {
        ...formData,
        techStack: formData.techStack.split(',').map(s => s.trim()).filter(s => s),
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
    <div data-admin-page>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link 
            to="/admin/portfolios"
            style={{
              color: 'rgba(255,255,255,.4)',
              fontSize: '1.5rem',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,.4)'}
          >
            ←
          </Link>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              fontSize: '2rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}>
              Create Portfolio
            </h1>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,.45)',
              margin: 0,
            }}>
              Tambahkan portfolio proyek baru
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 68, 68, 0.08)',
          border: '1px solid rgba(255, 68, 68, 0.25)',
          color: '#ff6b6b',
          padding: '1rem 1.25rem',
          borderRadius: '2px',
          marginBottom: '2rem',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        maxWidth: '800px',
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)',
              marginBottom: '0.75rem',
            }}>
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              placeholder="contoh-project-kerja"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '2px',
                color: '#ffffff',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.3s ease, background 0.3s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                e.target.style.background = 'rgba(255,255,255,0.03)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                e.target.style.background = 'rgba(255,255,255,0.02)';
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)',
              marginBottom: '0.75rem',
            }}>
              Category *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="Web Development"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '2px',
                color: '#ffffff',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.3s ease, background 0.3s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                e.target.style.background = 'rgba(255,255,255,0.03)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                e.target.style.background = 'rgba(255,255,255,0.02)';
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Judul Proyek"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Image URL
          </label>
          <input
            type="text"
            name="imgUrl"
            value={formData.imgUrl}
            onChange={handleChange}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Overview
          </label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            rows="4"
            placeholder="Deskripsi singkat proyek..."
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Goals
          </label>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            rows="4"
            placeholder="Tujuan proyek..."
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Features (JSON)
          </label>
          <textarea
            name="features"
            value={formData.features}
            onChange={handleChange}
            rows="4"
            placeholder='["Fitur 1", "Fitur 2"]'
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Architecture
          </label>
          <textarea
            name="architecture"
            value={formData.architecture}
            onChange={handleChange}
            rows="4"
            placeholder="Deskripsi arsitektur..."
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Tech Stack (comma separated) *
          </label>
          <input
            type="text"
            name="techStack"
            value={formData.techStack}
            onChange={handleChange}
            required
            placeholder="React, Node.js, PostgreSQL"
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.5)',
            marginBottom: '0.75rem',
          }}>
            Live Link
          </label>
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px',
              color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.3s ease, background 0.3s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              e.target.style.background = 'rgba(255,255,255,0.03)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.06)';
              e.target.style.background = 'rgba(255,255,255,0.02)';
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/admin/portfolios"
            style={{
              padding: '0.9rem 1.75rem',
              background: 'transparent',
              color: 'rgba(255,255,255,.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '2px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
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
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
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
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? '0.6' : '1',
              transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffffff';
            }}
          >
            {loading ? 'Creating...' : 'Create Portfolio'}
          </button>
        </div>
      </form>
    </div>
  );
};
