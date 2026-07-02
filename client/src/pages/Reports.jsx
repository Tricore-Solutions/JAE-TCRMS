import { useState, useEffect, useRef } from 'react';
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

const TAKE_AXIS = [1, 2, 3];
const TAKE_LABELS = { 1: '1st Take', 2: '2nd Take', 3: '3rd Take' };
const TAKE_BAR_COLORS = ['#1D72B8', '#5A9FD4', '#A8CCE8'];
const BAR_ANIM_MS = 500;
const SIMPLE_BAR_ANIM_MS = 850;
const PAGE_ENTER_MS = 320;
const CHART_HEIGHT = 140;

function buildYTicks(max) {
  if (max <= 1) return [0, 1];
  const step = Math.max(1, Math.ceil(max / 4));
  const ticks = [0];
  for (let v = step; v < max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

function TakesPerMonthChart({ months, data }) {
  const [barsVisible, setBarsVisible] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  const maxCount = Math.max(
    1,
    ...months.flatMap(month => TAKE_AXIS.map(t => data[month]?.[String(t)] || 0)),
  );
  const yTicks = buildYTicks(maxCount);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setBarsVisible(true);
      return;
    }

    setBarsVisible(false);
    const timer = setTimeout(() => setBarsVisible(true), PAGE_ENTER_MS + 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-5 mb-10">
        {TAKE_AXIS.map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TAKE_BAR_COLORS[i] }} />
            <span className="text-xs text-gray-500">{TAKE_LABELS[t]}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 sm:gap-3">
        <div className="relative w-6 sm:w-8 flex-shrink-0" style={{ height: CHART_HEIGHT }}>
          {yTicks.map(tick => (
            <span
              key={tick}
              className="absolute right-0 text-[11px] text-gray-400 tabular-nums -translate-y-1/2"
              style={{ bottom: `${(tick / maxCount) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0 overflow-visible">
          <div className="relative overflow-visible" style={{ height: CHART_HEIGHT }}>
            {yTicks.map(tick => (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-dashed border-gray-200 pointer-events-none"
                style={{ bottom: `${(tick / maxCount) * 100}%` }}
              />
            ))}

            <div className="relative h-full flex items-end overflow-visible">
              {months.map((month, monthIdx) => (
                <div key={month} className="flex-1 flex items-end justify-center gap-1.5 sm:gap-2 h-full px-1 overflow-visible">
                  {TAKE_AXIS.map((t, i) => {
                    const val = data[month]?.[String(t)] || 0;
                    const heightPct = val > 0 ? Math.max((val / maxCount) * 100, 6) : 0;
                    const delay = monthIdx * 50 + i * 35;
                    const barId = `${month}-${t}`;
                    return (
                      <div
                        key={t}
                        className={`relative h-full w-8 sm:w-9 flex flex-col justify-end overflow-visible ${val > 0 ? 'cursor-default' : ''}`}
                        onMouseEnter={val > 0 ? () => setHoveredBar(barId) : undefined}
                        onMouseLeave={val > 0 ? () => setHoveredBar(null) : undefined}
                      >
                        {hoveredBar === barId && (
                          <span
                            className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold text-gray-800 tabular-nums pointer-events-none leading-none"
                            style={{ bottom: `calc(${heightPct}% + 4px)` }}
                          >
                            {val}
                          </span>
                        )}
                        <div className="h-full bg-[#f2f2f2] rounded-t-md flex flex-col justify-end overflow-hidden">
                          {val > 0 && (
                            <div
                              className="w-full rounded-t-sm origin-bottom"
                              style={{
                                height: `${heightPct}%`,
                                backgroundColor: TAKE_BAR_COLORS[i],
                                transform: barsVisible ? 'scaleY(1)' : 'scaleY(0)',
                                transition: `transform ${BAR_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex mt-3">
            {months.map(month => (
              <div key={month} className="flex-1 text-center px-1">
                <span className="text-[11px] text-gray-500">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleBar({ label, value, max, color = 'bg-blue-500', animDelay = 0 }) {
  const [fillVisible, setFillVisible] = useState(false);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setFillVisible(true);
      return;
    }

    setFillVisible(false);
    const timer = setTimeout(() => setFillVisible(true), PAGE_ENTER_MS + 140 + animDelay);
    return () => clearTimeout(timer);
  }, [animDelay, pct]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{
            width: `${pct}%`,
            transform: fillVisible ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
            transition: `transform ${SIMPLE_BAR_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right flex-shrink-0">{value}</span>
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
  const [contentKey, setContentKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isInitialLoad = useRef(true);
  const [exporting, setExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState({ factory: '', category: '' });

  const load = async () => {
    const isRefresh = !isInitialLoad.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

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
      if (isRefresh) setContentKey(k => k + 1);
    } catch {
      toast('Failed to load reports.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false;
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

  const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500'];

  return (
    <Layout
      title="Reports"
      actions={
        <button onClick={load} disabled={loading || refreshing} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      }
    >
      <div key={contentKey} className={contentKey > 0 ? 'page-enter' : undefined}>
      {/* Overview stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-28 animate-pulse" />
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
        <div className="app-panel p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Tag size={16} className="text-[#1D72B8]" /> Training by Category
          </h3>
          {byCategory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((row, i) => (
                <SimpleBar
                  key={row.category}
                  label={row.category}
                  value={row.count}
                  max={maxCategory}
                  color={categoryColors[i % categoryColors.length]}
                  animDelay={i * 50}
                />
              ))}
            </div>
          )}
        </div>

        {/* By Factory */}
        <div className="app-panel p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Factory size={16} className="text-green-600" /> Employees by Factory
          </h3>
          {byFactory.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No data available</p>
          ) : (
            <div className="space-y-3">
              {byFactory.map((row, i) => (
                <div key={row.factory}>
                  <SimpleBar
                    label={row.factory}
                    value={row.employee_count}
                    max={maxFactory}
                    color="bg-green-500"
                    animDelay={i * 60}
                  />
                  <p className="text-xs text-gray-500 mt-0.5 ml-[156px]">{row.training_count} training records</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Takes per Month — X: Month, Y: Count */}
      <div className="app-panel p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1D72B8]" /> Takes per Month
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Training records logged per month, broken down by attempt number.
        </p>
        {!takesPerMonth.months || takesPerMonth.months.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No data available</p>
        ) : (
          <TakesPerMonthChart
            months={takesPerMonth.months}
            data={takesPerMonth.data}
          />
        )}
      </div>

      {/* Expiring certifications list */}
      <div className="app-panel p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" /> Certifications Requiring Attention (next 60 days + expired)
        </h3>
        {expiring.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No expiring or expired certifications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Training</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Factory / Team</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiring.slice(0, 20).map(item => (
                  <tr key={item.id} className="hover:bg-white">
                    <td className="py-3 text-gray-900 font-medium">{item.full_name}</td>
                    <td className="py-3 text-gray-700">{item.title}</td>
                    <td className="py-3 text-gray-500 text-xs">{item.factory} / {item.team}</td>
                    <td className="py-3 text-gray-700">{item.expiration_date}</td>
                    <td className="py-3"><StatusBadge status={item.cert_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expiring.length > 20 && (
              <p className="text-xs text-gray-500 text-center mt-4">Showing 20 of {expiring.length} records. Export CSV for full list.</p>
            )}
          </div>
        )}
      </div>

      {/* CSV Export */}
      <div className="app-panel p-6">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Download size={16} className="text-gray-500" /> Export Training Records
        </h3>
        <p className="text-sm text-gray-500 mb-5">Download all training records as a CSV file for reporting or backup.</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Factory</label>
            <select
              value={exportFilter.factory}
              onChange={e => setExportFilter(f => ({ ...f, factory: e.target.value }))}
              className="app-input px-3 py-2 text-sm"
            >
              <option value="">All Factories</option>
              {byFactory.map(f => <option key={f.factory} value={f.factory}>{f.factory}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Category</label>
            <select
              value={exportFilter.category}
              onChange={e => setExportFilter(f => ({ ...f, category: e.target.value }))}
              className="app-input px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {byCategory.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
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
      </div>
    </Layout>
  );
}
