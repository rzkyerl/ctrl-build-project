import '../../styles/css/admin.css';

export const FormGroup = ({ label, children, className = '' }) => {
  return (
    <div className={`admin-form-group ${className}`}>
      {label && <label className="admin-label">{label}</label>}
      {children}
    </div>
  );
};
