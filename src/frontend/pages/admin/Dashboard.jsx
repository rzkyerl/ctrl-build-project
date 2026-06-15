export const Dashboard = () => {
  return (
    <div>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}>
          Dashboard
        </h1>
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,.45)',
          margin: 0,
        }}>
          Selamat datang di admin portal CTRLBuild
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          padding: '2rem', 
          borderRadius: '2px', 
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            marginBottom: '1rem',
          }}>
            Total Portfolios
          </p>
          <p style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}>
            0
          </p>
        </div>
      </div>
    </div>
  );
};
