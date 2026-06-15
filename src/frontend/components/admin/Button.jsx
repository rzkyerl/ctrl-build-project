import '../../styles/css/admin.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'default', 
  fullWidth = false, 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseClass = 'admin-btn';
  const variantClass = `admin-btn-${variant}`;
  const sizeClass = size !== 'default' ? `admin-btn-${size}` : '';
  const fullWidthClass = fullWidth ? 'admin-btn-full' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
