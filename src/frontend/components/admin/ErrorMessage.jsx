import '../../styles/css/admin.css';

export const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`admin-error ${className}`}>
      {message}
    </div>
  );
};
