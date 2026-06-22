export default function StatusBadge({ status }) {
  const config = {
    active:    { bg: 'bg-green-900/40', text: 'text-green-400', border: 'border-green-700/40', label: 'Active' },
    inactive:  { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-600', label: 'Inactive' },
    resigned:  { bg: 'bg-orange-900/40', text: 'text-orange-400', border: 'border-orange-700/40', label: 'Resigned' },
    expired:   { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-700/40', label: 'Expired' },
    expiring:  { bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-700/40', label: 'Expiring Soon' },
    valid:     { bg: 'bg-green-900/40', text: 'text-green-400', border: 'border-green-700/40', label: 'Valid' },
    admin:     { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-700/40', label: 'Admin' },
    encoder:   { bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-700/40', label: 'Encoder' },
    viewer:    { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-600', label: 'Viewer' },
  };
  const c = config[status] || config.inactive;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}
