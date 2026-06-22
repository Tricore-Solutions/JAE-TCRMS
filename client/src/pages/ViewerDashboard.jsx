import { useState, useEffect, useCallback } from 'react';
import { Search, Users, ClipboardList, AlertTriangle, LogIn, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { publicApi } from '../api';

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [teams, setTeams] = useState([]);

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
      // Server might not be configured — show empty state gracefully
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterTeam]);

  useEffect(() => { load(); }, [load]);

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
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogIn size={14} /> Staff Login
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Employee Training Directory</h1>
          <p className="text-slate-400 mt-1 text-sm">View employee training and certification status. Read-only access.</p>
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

        {/* Table */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80">
                {['Employee ID', 'Full Name', 'Factory', 'Line', 'Team', 'Trainings', 'Cert Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-600 mt-6 text-center">
          JAE Philippines, Inc. — This is a read-only public view. Training details are restricted to authorized staff.
        </p>
      </main>
    </div>
  );
}
