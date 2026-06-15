import { Link } from 'react-router-dom';
import '../../styles/css/admin.css';

export const PageHeader = ({ title, subtitle, backTo, className = '' }) => {
  return (
    <div className={`admin-page-header ${className}`}>
      {backTo && (
        <div className="admin-page-header-with-back">
          <Link to={backTo} className="admin-back-link">
            ←
          </Link>
          <div>
            <h1 className="admin-h1">{title}</h1>
            {subtitle && <p className="admin-text">{subtitle}</p>}
          </div>
        </div>
      )}
      {!backTo && (
        <div>
          <h1 className="admin-h1">{title}</h1>
          {subtitle && <p className="admin-text">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};
