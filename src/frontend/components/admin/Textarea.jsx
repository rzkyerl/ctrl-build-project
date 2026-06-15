import '../../styles/css/admin.css';

export const Textarea = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`admin-textarea ${className}`}
      {...props}
    />
  );
};
