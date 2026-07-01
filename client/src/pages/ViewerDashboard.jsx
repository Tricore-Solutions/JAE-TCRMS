import { useState, useEffect, useCallback } from 'react';
import { Search, Users, ClipboardList, AlertTriangle, LogIn, XCircle, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { publicApi } from '../api';
import { useAuth } from '../context/AuthContext';

const TAKE_LABELS = { 1: '1st Take', 2: '2nd Take', 3: '3rd Take' };

function getCertStatus(expirationDate) {
  if (!expirationDate) return 'valid';
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [teams, setTeams] = useState([]);

  // Training history modal
  const [selected, setSelected] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'active' };
      if (search) params.search = search;
      if (filterTeam) params.team = filterTeam;
      const res = await publicApi.employees(params);
      setEmployees(res.data);
      if (!filterTeam && !search) {
        const uniqueTeams = [...new Set(res.data.map(e => e.team).filter(Boolean))].sort();
        setTeams(uniqueTeams);
      }
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterTeam]);

  useEffect(() => { load(); }, [load]);

  const openEmployee = async (emp) => {
    setSelected(emp);
    setTrainings([]);
    setTrainingLoading(true);
    try {
      const res = await publicApi.employeeTrainings(emp.id);
      setTrainings(res.data.trainings || []);
    } catch {
      setTrainings([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700/50 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">JAE TCRMS</p>
              <p className="text-xs text-slate-500">Public Employee Directory</p>
            </div>
          </div>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn size={14} /> Staff Login
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Employee Training Directory</h1>
          <p className="text-slate-400 mt-1 text-sm">Click on an employee to view their full training history.</p>
        </div>

        {/* Search and filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {teams.length > 0 && (
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teams</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 mb-6 bg-slate-800/50 border border-slate-700/50 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="text-blue-400" />
            <span className="text-slate-400">Employees:</span>
            <span className="text-white font-semibold">{employees.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList size={14} className="text-green-400" />
            <span className="text-slate-400">Total Trainings:</span>
            <span className="text-white font-semibold">{employees.reduce((s, e) => s + (e.total_trainings || 0), 0)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-slate-400">With Expired Certs:</span>
            <span className="text-white font-semibold">{employees.filter(e => e.expired_count > 0).length}</span>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80">
                {['Employee ID', 'Full Name', 'Factory', 'Line', 'Team', 'Trainings', 'Cert Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-sm">No employees found.</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr
                    key={emp.id}
                    onClick={() => openEmployee(emp)}
                    className="hover:bg-slate-700/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{emp.employee_id}</td>
                    <td className="px-4 py-3 text-white font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{emp.factory || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{emp.line || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{emp.team || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{emp.total_trainings || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.expired_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <XCircle size={12} /> {emp.expired_count} expired
                        </span>
                      ) : (
                        <StatusBadge status="valid" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-600 mt-6 text-center">
          JAE Philippines, Inc. — Read-only public view.
        </p>
      </main>

      {/* Training History Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4 bg-black/60">
          {/* Backdrop */}
          <div className="fixed inset-0" onClick={() => setSelected(null)} />

          {/* Panel */}
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.full_name}</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {selected.employee_id} · {selected.factory || '—'} · {selected.team || '—'}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Training Table */}
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <ClipboardList size={14} className="text-blue-400" />
                Training & Certification History
              </h3>

              {trainingLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No training records found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/60">
                        {['Training Title', 'Category', 'Date', 'Trainer', 'Take', 'Worker Line', 'Expiration', 'Status'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {trainings.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 text-white font-medium max-w-[180px]">
                            <p className="truncate">{t.title}</p>
                            {t.process_classification && (
                              <p className="text-xs text-slate-500 truncate">{t.process_classification}</p>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap">{t.category || '—'}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-300 whitespace-nowrap">{t.training_date}</td>
                          <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{t.trainer || '—'}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                              {TAKE_LABELS[t.take] || `Take ${t.take}`}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              t.worker_line_status === 'Original'
                                ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50'
                                : 'bg-amber-900/40 text-amber-400 border border-amber-700/50'
                            }`}>
                              {t.worker_line_status || 'Floating'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-400 whitespace-nowrap">{t.expiration_date || 'No expiry'}</td>
                          <td className="px-3 py-3">
                            <StatusBadge status={getCertStatus(t.expiration_date)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

