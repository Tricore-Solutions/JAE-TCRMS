import { useState, useEffect } from 'react';
import { Download, BarChart3, Factory, Tag, AlertTriangle, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { reportsApi } from '../api';
import { useToast } from '../components/Toast';

function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TAKE_COLORS = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-cyan-500'];

function SimpleBar({ label, value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-white w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export default function Reports() {
  const { show: toast } = useToast();
  const [overview, setOverview] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [byFactory, setByFactory] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [takesPerMonth, setTakesPerMonth] = useState({ months: [], takes: [], data: {} });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState({ factory: '', category: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [ovRes, catRes, facRes, expRes, tpmRes] = await Promise.all([
        reportsApi.overview(),
        reportsApi.byCategory(),
        reportsApi.byFactory(),
        reportsApi.expiring(),
        reportsApi.takesPerMonth(),
      ]);
      setOverview(ovRes.data);
      setByCategory(catRes.data);
      setByFactory(facRes.data);
      setExpiring(expRes.data);
      setTakesPerMonth(tpmRes.data);
    } catch {
      toast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportsApi.exportTrainings(exportFilter);
      const today = new Date().toISOString().split('T')[0];
      exportToCSV(res.data, `JAE-TCRMS-Training-Report-${today}.csv`);
      toast(`Exported ${res.data.length} records to CSV.`, 'success');
    } catch {
      toast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const maxCategory = Math.max(...byCategory.map(r => r.count), 1);
  const maxFactory = Math.max(...byFactory.map(r => r.employee_count), 1);
  const maxTakes = takesPerMonth.data
    ? Math.max(...Object.values(takesPerMonth.data).flatMap(m => Object.values(m)), 1)
    : 1;

  const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500'];

  return (
    <Layout
      title="Reports"
      actions={
        <button onClick={load} disabled={loading} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      {/* Overview stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard title="Active Employees" value={overview?.totalEmployees ?? '—'} icon={BarChart3} color="blue" />
          <StatCard title="Total Trainings" value={overview?.totalTrainings ?? '—'} icon={Tag} color="green" />
          <StatCard title="Expired Certifications" value={overview?.expiredCerts ?? '—'} icon={AlertTriangle} color="red" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* By Category */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Tag size={16} className="text-blue-400" /> Training by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((row, i) => (
                <SimpleBar key={row.category} label={row.category} value={row.count} max={maxCategory} color={categoryColors[i % categoryColors.length]} />
              ))}
            </div>
          )}
        </div>

        {/* By Factory */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Factory size={16} className="text-green-400" /> Employees by Factory
          </h3>
          {byFactory.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byFactory.map((row, i) => (
                <div key={row.factory}>
                  <SimpleBar label={row.factory} value={row.employee_count} max={maxFactory} color="bg-green-500" />
                  <p className="text-xs text-slate-500 mt-0.5 ml-[156px]">{row.training_count} training records</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Takes per Month — X: Take number, Y: Month */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
          <BarChart3 size={16} className="text-purple-400" /> Takes per Month
        </h3>
        {!takesPerMonth.months || takesPerMonth.months.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {takesPerMonth.takes.map((t, i) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${TAKE_COLORS[i % TAKE_COLORS.length]}`} />
                  <span className="text-xs text-slate-400">Take {t}</span>
                </div>
              ))}
            </div>
            {/* Chart rows: Y = Month, X = Take bars */}
            <div className="space-y-3">
              {takesPerMonth.months.map(month => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-20 flex-shrink-0 text-right">{month}</span>
                  <div className="flex-1 flex items-center gap-1">
                    {takesPerMonth.takes.map((t, i) => {
                      const val = takesPerMonth.data[month]?.[String(t)] || 0;
                      const pct = maxTakes > 0 ? Math.round((val / maxTakes) * 100) : 0;
                      return (
                        <div key={t} className="flex flex-col items-center gap-0.5 flex-1">
                          <span className="text-xs text-slate-400">{val > 0 ? val : ''}</span>
                          <div className="w-full bg-slate-700 rounded h-6 overflow-hidden">
                            <div
                              className={`h-full ${TAKE_COLORS[i % TAKE_COLORS.length]} rounded transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* X axis labels */}
            <div className="flex items-center gap-3 mt-2">
              <span className="w-20 flex-shrink-0" />
              <div className="flex-1 flex gap-1">
                {takesPerMonth.takes.map(t => (
                  <div key={t} className="flex-1 text-center text-xs text-slate-500">Take {t}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expiring certifications list */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" /> Certifications Requiring Attention (next 60 days + expired)
        </h3>
        {expiring.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No expiring or expired certifications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-left text-xs font-semibold text-slate-400 uppercase">Employee</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-400 uppercase">Training</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-400 uppercase">Factory / Team</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-400 uppercase">Expiry Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {expiring.slice(0, 20).map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 text-white font-medium">{item.full_name}</td>
                    <td className="py-3 text-slate-300">{item.title}</td>
                    <td className="py-3 text-slate-400 text-xs">{item.factory} / {item.team}</td>
                    <td className="py-3 text-slate-300">{item.expiration_date}</td>
                    <td className="py-3"><StatusBadge status={item.cert_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expiring.length > 20 && (
              <p className="text-xs text-slate-500 text-center mt-4">Showing 20 of {expiring.length} records. Export CSV for full list.</p>
            )}
          </div>
        )}
      </div>

      {/* CSV Export */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
          <Download size={16} className="text-slate-400" /> Export Training Records
        </h3>
        <p className="text-sm text-slate-500 mb-5">Download all training records as a CSV file for reporting or backup.</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Factory</label>
            <select
              value={exportFilter.factory}
              onChange={e => setExportFilter(f => ({ ...f, factory: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Factories</option>
              {byFactory.map(f => <option key={f.factory} value={f.factory}>{f.factory}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Category</label>
            <select
              value={exportFilter.category}
              onChange={e => setExportFilter(f => ({ ...f, category: e.target.value }))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {byCategory.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
