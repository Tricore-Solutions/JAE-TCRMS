import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Users, ClipboardList, AlertTriangle, LogIn, ArrowLeft, ChevronRight, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageEnter from '../components/PageEnter';
import DataTable from '../components/DataTable';
import { publicApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

const TAKE_LABELS = { 1: '1st Take', 2: '2nd Take', 3: '3rd Take' };
const EMPLOYMENT_STATUSES = [
  'FAMSI - Proby',
  'FAMSI - Reg',
  'MDHII - Proby',
  'MDHII - Reg',
  'Regular - JAE',
];

function getCertStatus(expirationDate) {
  if (!expirationDate) return 'valid';
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

function getTrainingRowClass(expirationDate) {
  const status = getCertStatus(expirationDate);
  if (status === 'expired') return 'bg-red-50 hover:bg-red-100';
  if (status === 'expiring') return 'bg-amber-50 hover:bg-amber-100';
  return 'hover:bg-gray-50';
}

function getExpirationTextClass(expirationDate) {
  const status = getCertStatus(expirationDate);
  if (status === 'expired') return 'text-red-600 font-medium';
  if (status === 'expiring') return 'text-amber-700 font-medium';
  if (!expirationDate) return 'text-gray-500';
  return 'text-green-600 font-medium';
}

function getCertUncert(expirationDate) {
  if (!expirationDate) return 'CERT';
  const today = new Date().toISOString().split('T')[0];
  return expirationDate < today ? 'UNCERT' : 'CERT';
}

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isInitialLoad = useRef(true);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');
  const [filterTrainingTitle, setFilterTrainingTitle] = useState('');
  const [filterCertStatus, setFilterCertStatus] = useState('');
  const [filterExpiryFrom, setFilterExpiryFrom] = useState('');
  const [filterExpiryTo, setFilterExpiryTo] = useState('');
  const [teams, setTeams] = useState([]);

  // Training history modal
  const [selected, setSelected] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  const load = useCallback(async () => {
    const isRefresh = !isInitialLoad.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = { status: 'active' };
      if (search) params.search = search;
      if (filterTeam) params.team = filterTeam;
      if (filterEmploymentStatus) params.employment_status = filterEmploymentStatus;
      if (filterTrainingTitle) params.training_title = filterTrainingTitle;
      if (filterCertStatus) params.cert_status = filterCertStatus;
      if (filterExpiryFrom) params.expiry_from = filterExpiryFrom;
      if (filterExpiryTo) params.expiry_to = filterExpiryTo;
      const res = await publicApi.employees(params);
      setEmployees(res.data);
      if (!filterTeam && !search && !filterEmploymentStatus && !filterTrainingTitle && !filterCertStatus) {
        const uniqueTeams = [...new Set(res.data.map(e => e.team).filter(Boolean))].sort();
        setTeams(uniqueTeams);
      }
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false;
    }
  }, [search, filterTeam, filterEmploymentStatus, filterTrainingTitle, filterCertStatus, filterExpiryFrom, filterExpiryTo]);

  const clearFilters = () => {
    setSearch('');
    setFilterTeam('');
    setFilterEmploymentStatus('');
    setFilterTrainingTitle('');
    setFilterCertStatus('');
    setFilterExpiryFrom('');
    setFilterExpiryTo('');
  };

  const hasActiveFilters = search || filterTeam || filterEmploymentStatus || filterTrainingTitle || filterCertStatus || filterExpiryFrom || filterExpiryTo;

  useEffect(() => { load(); }, [load]);

  const openEmployee = async (emp) => {
    setSelected(emp);
    setTrainings([]);
    setTrainingLoading(true);
    try {
      const params = {};
      if (filterTrainingTitle) params.training_title = filterTrainingTitle;
      if (filterCertStatus) params.cert_status = filterCertStatus;
      if (filterExpiryFrom) params.expiry_from = filterExpiryFrom;
      if (filterExpiryTo) params.expiry_to = filterExpiryTo;
      const res = await publicApi.employeeTrainings(emp.id, params);
      const list = [...(res.data.trainings || [])].sort((a, b) => {
        const da = a.training_date || '';
        const db = b.training_date || '';
        if (da !== db) return db.localeCompare(da);
        return (b.id || 0) - (a.id || 0);
      });
      setTrainings(list);
    } catch {
      setTrainings([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  const columns = [
    {
      key: 'employee_id',
      label: 'Employee ID',
      render: (v) => <span className="font-mono text-xs text-[#1D72B8]">{v}</span>,
    },
    {
      key: 'full_name',
      label: 'Full Name',
      render: (v) => <span className="text-gray-900 font-medium">{v}</span>,
    },
    { key: 'factory', label: 'Factory', render: (v) => v || '—' },
    { key: 'line', label: 'Line', render: (v) => v || '—' },
    { key: 'team', label: 'Team', render: (v) => v || '—' },
    {
      key: 'hire_date',
      label: 'Date Hired',
      render: (v) => <span className="whitespace-nowrap">{formatDate(v)}</span>,
    },
    { key: 'employment_status', label: 'Employment Status', render: (v) => v || '—' },
    {
      key: 'total_trainings',
      label: 'Trainings',
      render: (v) => <span className="text-sm text-gray-900 font-medium">{v || 0}</span>,
    },
    {
      key: 'expired_count',
      label: 'Cert Status',
      render: (v) => (
        v > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <XCircle size={12} /> {v} expired
          </span>
        ) : (
          <StatusBadge status="valid" />
        )
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: () => <span className="text-gray-500"><ChevronRight size={14} /></span>,
    },
  ];

  return (
    <div className="min-h-screen bg-white app-scroll-lock">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <img src={`${import.meta.env.BASE_URL}jae-logo.png`} alt="JAE" className="h-10 w-auto object-contain flex-shrink-0" />
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
        <div className="space-y-3 mb-6">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
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
            <select
              value={filterEmploymentStatus}
              onChange={e => setFilterEmploymentStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              <option value="">All Employment Status</option>
              {EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Search training title..."
              value={filterTrainingTitle}
              onChange={e => setFilterTrainingTitle(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8] min-w-48 flex-1"
            />

            <select
              value={filterCertStatus}
              onChange={e => setFilterCertStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              <option value="">All Cert Status</option>
              <option value="expired">Expired</option>
              <option value="expiring30">Expiring in 30 days</option>
              <option value="expiring60">Expiring in 60 days</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Expiry date:</span>
              <input
                type="date"
                value={filterExpiryFrom}
                onChange={e => setFilterExpiryFrom(e.target.value)}
                title="Expiry date from"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={filterExpiryTo}
                onChange={e => setFilterExpiryTo(e.target.value)}
                title="Expiry date to"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
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
        <DataTable
          columns={columns}
          data={employees}
          loading={loading && !refreshing}
          refreshing={refreshing}
          emptyMessage="No employees found."
          onRowClick={openEmployee}
        />

        <p className="text-xs text-gray-400 mt-6 text-center">
          JAE Philippines, Inc. — Read-only public view.
        </p>
      </main>
      </PageEnter>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || ''}
        description={selected ? `${selected.employee_id} · ${selected.factory || '—'} Factory · ${selected.line || '—'} · Team ${selected.team || '—'}` : ''}
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
                  {['Training Title', 'Category', 'Training Date', 'Expiration', 'CERT/UNCERT', 'Take', 'Trainer', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trainings.map(t => {
                  const certLabel = t.cert_uncert === 'UNCERT' || t.cert_uncert === 'CERT'
                    ? t.cert_uncert
                    : getCertUncert(t.expiration_date);
                  return (
                  <tr key={t.id} className={`transition-colors ${getTrainingRowClass(t.expiration_date)}`}>
                    <td className="px-3 py-3 text-gray-900 font-medium max-w-[180px]">
                      <p className="truncate">{t.title}</p>
                      {t.process_classification && (
                        <p className="text-xs text-gray-500 truncate">{t.process_classification}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{t.category || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{formatDate(t.training_date)}</td>
                    <td className={`px-3 py-3 whitespace-nowrap ${getExpirationTextClass(t.expiration_date)}`}>
                      {t.expiration_date ? formatDate(t.expiration_date) : 'No expiry'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        certLabel === 'CERT'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {certLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {TAKE_LABELS[t.take] || `Take ${t.take}`}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{t.trainer || '—'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={getCertStatus(t.expiration_date)} />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

