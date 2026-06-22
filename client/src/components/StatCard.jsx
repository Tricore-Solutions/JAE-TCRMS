export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   { bg: 'bg-blue-900/30', icon: 'text-blue-400', border: 'border-blue-700/30' },
    green:  { bg: 'bg-green-900/30', icon: 'text-green-400', border: 'border-green-700/30' },
    red:    { bg: 'bg-red-900/30', icon: 'text-red-400', border: 'border-red-700/30' },
    amber:  { bg: 'bg-amber-900/30', icon: 'text-amber-400', border: 'border-amber-700/30' },
    purple: { bg: 'bg-purple-900/30', icon: 'text-purple-400', border: 'border-purple-700/30' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`rounded-xl border ${c.border} bg-slate-800/60 p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`${c.bg} rounded-xl p-3`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
