export default function FieldLabel({ children, required = false, className = '' }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`.trim()}>
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}
