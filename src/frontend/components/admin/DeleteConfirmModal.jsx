export function DeleteConfirmModal({ title, message, onConfirm, onCancel, loading = false }) {
  if (!title && !message) return null;

  return (
    <div data-admin-page style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onCancel}>
      <div style={{
        background: 'rgba(20, 20, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '2px',
        padding: '2rem',
        maxWidth: '420px',
        width: '100%',
        margin: '1rem',
      }} onClick={(e) => e.stopPropagation()}>
        {title && (
          <h3 style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: '0 0 0.75rem 0',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h3>
        )}
        {message && (
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.95rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0 0 2rem 0',
            lineHeight: '1.5',
          }}>
            {message}
          </p>
        )}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? '0.5' : '1',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.target.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 75, 75, 0.1)',
              border: '1px solid rgba(255, 75, 75, 0.4)',
              borderRadius: '2px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: '#ff6b6b',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? '0.5' : '1',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(255, 75, 75, 0.2)';
                e.target.style.borderColor = 'rgba(255, 75, 75, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 75, 75, 0.1)';
              e.target.style.borderColor = 'rgba(255, 75, 75, 0.4)';
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
