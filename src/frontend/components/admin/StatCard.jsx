import '../../styles/css/admin.css';

export const StatCard = ({ label, value, className = '' }) => {
  return (
    <div className={`admin-stat-card ${className}`}>
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value}</p>
    </div>
  );
};
