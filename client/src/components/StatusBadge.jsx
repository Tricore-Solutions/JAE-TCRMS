export default function StatusBadge({ status }) {
  const config = {
    active:    { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Active' },
    inactive:  { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Inactive' },
    resigned:  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Resigned' },
    expired:   { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Expired' },
    expiring:  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Expiring Soon' },
    valid:     { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Valid' },
    admin:     { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Admin' },
    encoder:   { bg: 'bg-blue-50', text: 'text-[#1D72B8]', border: 'border-blue-200', label: 'Encoder' },
    viewer:    { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: 'Viewer' },
  };
  const c = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}
