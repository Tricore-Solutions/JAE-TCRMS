import { useState, useEffect, useCallback } from 'react';
import { Search, Users, ClipboardList, AlertTriangle, LogIn, ArrowLeft, ChevronRight, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageEnter from '../components/PageEnter';
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
    <div className="min-h-screen bg-white app-scroll-lock">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <img src="/jae-logo.png" alt="JAE" className="h-10 w-auto object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 leading-tight truncate">Training &amp; Certifications Management</p>
              <p className="text-xs text-gray-500">Public Employee Directory</p>
            </div>
          </div>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn size={14} /> Staff Login
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <PageEnter>
      <main className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Employee Training Directory</h1>
          <p className="text-gray-500 mt-1 text-sm">Click on an employee to view their full training history.</p>
        </div>

        {/* Search and filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            />
          </div>
          {teams.length > 0 && (
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              <option value="">All Teams</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 mb-6 app-panel px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="text-[#1D72B8]" />
            <span className="text-gray-500">Employees:</span>
            <span className="text-gray-900 font-semibold">{employees.length}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClipboardList size={14} className="text-green-600" />
            <span className="text-gray-500">Total Trainings:</span>
            <span className="text-gray-900 font-semibold">{employees.reduce((s, e) => s + (e.total_trainings || 0), 0)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle size={14} className="text-red-600" />
            <span className="text-gray-500">With Expired Certs:</span>
            <span className="text-gray-900 font-semibold">{employees.filter(e => e.expired_count > 0).length}</span>
          </div>
        </div>

        {/* Employee Table */}
        <div className="app-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Employee ID', 'Full Name', 'Factory', 'Line', 'Team', 'Date Hired', 'Employment Status', 'Trainings', 'Cert Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500 text-sm">No employees found.</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr
                    key={emp.id}
                    onClick={() => openEmployee(emp)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#1D72B8]">{emp.employee_id}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{emp.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.factory || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.line || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.team || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{emp.hire_date || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.employment_status || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 font-medium">{emp.total_trainings || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.expired_count > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <XCircle size={12} /> {emp.expired_count} expired
                        </span>
                      ) : (
                        <StatusBadge status="valid" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          JAE Philippines, Inc. — Read-only public view.
        </p>
      </main>
      </PageEnter>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || ''}
        description={selected ? `${selected.employee_id} · ${selected.factory || '—'} · ${selected.team || '—'}` : ''}
        size="xl"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <ClipboardList size={14} className="text-[#1D72B8]" />
          Training & Certification History
        </h3>

        {trainingLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#1D72B8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No training records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Training Title', 'Category', 'Date', 'Trainer', 'Take', 'Worker Line', 'Expiration', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trainings.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-900 font-medium max-w-[180px]">
                      <p className="truncate">{t.title}</p>
                      {t.process_classification && (
                        <p className="text-xs text-gray-500 truncate">{t.process_classification}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{t.category || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{t.training_date}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{t.trainer || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {TAKE_LABELS[t.take] || `Take ${t.take}`}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.worker_line_status === 'Original'
                          ? 'bg-blue-50 text-[#1D72B8] border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.worker_line_status || 'Floating'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{t.expiration_date || 'No expiry'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={getCertStatus(t.expiration_date)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

