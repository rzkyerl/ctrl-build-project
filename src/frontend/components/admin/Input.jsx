import '../../styles/css/admin.css';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`admin-input ${className}`}
      {...props}
    />
  );
};
