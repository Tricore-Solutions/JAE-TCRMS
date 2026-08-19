import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ClipboardList, LogIn, ArrowLeft, ChevronRight, Sheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import PageEnter from '../components/PageEnter';
import DataTable from '../components/DataTable';
import { publicApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils/date';
import { sheetFromRows, writeWorkbook, XLSX } from '../utils/xlsxExport';

const TAKE_LABELS = { 1: '1st Take', 2: '2nd Take', 3: '3rd Take' };
const EMPLOYMENT_STATUSES = [
  'FAMSI - Proby',
  'FAMSI - Reg',
  'MDHII - Proby',
  'MDHII - Reg',
  'Regular - JAE',
];

function getCertStatus(expirationDate, remarks) {
  if (remarks === 'INACTIVE') return 'invalid';
  if (!expirationDate) return 'valid';
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

function getTrainingRowClass(expirationDate, remarks) {
  const status = getCertStatus(expirationDate, remarks);
  if (status === 'expired') return 'bg-red-50 hover:bg-red-100';
  if (status === 'expiring') return 'bg-amber-50 hover:bg-amber-100';
  return 'hover:bg-gray-50';
}

function getExpirationTextClass(expirationDate, remarks) {
  const status = getCertStatus(expirationDate, remarks);
  if (status === 'expired') return 'text-red-600 font-medium';
  if (status === 'expiring') return 'text-amber-700 font-medium';
  if (!expirationDate) return 'text-gray-500';
  return 'text-green-600 font-medium';
}

function certRecertLabel(value) {
  return value === 'RE-CERT' ? 'RE-CERT' : 'CERT';
}

function certStatusLabel(status) {
  if (status === 'expired') return 'Expired';
  if (status === 'expiring') return 'Expiring';
  return 'Valid';
}

function takeLabel(take) {
  return TAKE_LABELS[take] || `Take ${take || 1}`;
}

function buildDirectoryWorkbook({ employees, trainings }) {
  const wb = XLSX.utils.book_new();

  const employeeColumns = [
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'fullName', header: 'Full Name' },
    { key: 'factory', header: 'Factory' },
    { key: 'line', header: 'Line' },
    { key: 'team', header: 'Team' },
    { key: 'hireDate', header: 'Date Hired' },
    { key: 'employmentStatus', header: 'Employment Status' },
    { key: 'totalTrainings', header: 'Total Trainings' },
    { key: 'expiredCount', header: 'Expired Certifications' },
  ];

  const employeeRows = employees.map(emp => ({
    employeeId: emp.employee_id,
    fullName: emp.full_name,
    factory: emp.factory || '',
    line: emp.line || '',
    team: emp.team || '',
    hireDate: formatDate(emp.hire_date, ''),
    employmentStatus: emp.employment_status || '',
    totalTrainings: emp.total_trainings || 0,
    expiredCount: emp.expired_count || 0,
  }));

  const employeeSheet = sheetFromRows(employeeRows, employeeColumns);
  XLSX.utils.book_append_sheet(wb, employeeSheet, 'Employee Directory');

  const trainingColumns = [
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'fullName', header: 'Full Name' },
    { key: 'factory', header: 'Factory' },
    { key: 'line', header: 'Line' },
    { key: 'team', header: 'Team' },
    { key: 'title', header: 'Training Title' },
    { key: 'category', header: 'Category' },
    { key: 'classification', header: 'Classification' },
    { key: 'trainingDate', header: 'Training Date' },
    { key: 'expiration', header: 'Expiration' },
    { key: 'certRecert', header: 'CERT/RE-CERT' },
    { key: 'take', header: 'Take' },
    { key: 'trainer', header: 'Trainer' },
    { key: 'status', header: 'Status' },
  ];

  const trainingRows = trainings.map(t => ({
    employeeId: t.employee_id,
    fullName: t.full_name,
    factory: t.factory || '',
    line: t.line || '',
    team: t.team || '',
    title: t.title || '',
    category: t.category || '',
    classification: t.process_classification || '',
    trainingDate: formatDate(t.training_date, ''),
    expiration: t.expiration_date ? formatDate(t.expiration_date, '') : 'No expiry',
    certRecert: certRecertLabel(t.cert_recert),
    take: takeLabel(t.take),
    trainer: t.trainer || '',
    status: certStatusLabel(t.cert_status),
  }));

  const trainingSheet = sheetFromRows(trainingRows, trainingColumns);
  XLSX.utils.book_append_sheet(wb, trainingSheet, 'Training History');

  return wb;
}

function buildEmployeeTrainingWorkbook(employee, trainings) {
  const wb = XLSX.utils.book_new();

  const infoColumns = [
    { key: 'employeeId', header: 'Employee ID' },
    { key: 'fullName', header: 'Full Name' },
    { key: 'factory', header: 'Factory' },
    { key: 'line', header: 'Line' },
    { key: 'team', header: 'Team' },
    { key: 'hireDate', header: 'Date Hired' },
    { key: 'employmentStatus', header: 'Employment Status' },
    { key: 'totalTrainings', header: 'Total Trainings' },
    { key: 'expiredCount', header: 'Expired Certifications' },
  ];

  const infoRows = [{
    employeeId: employee.employee_id,
    fullName: employee.full_name,
    factory: employee.factory || '',
    line: employee.line || '',
    team: employee.team || '',
    hireDate: formatDate(employee.hire_date, ''),
    employmentStatus: employee.employment_status || '',
    totalTrainings: trainings.length,
    expiredCount: trainings.filter(t => getCertStatus(t.expiration_date, t.remarks) === 'expired').length,
  }];

  XLSX.utils.book_append_sheet(wb, sheetFromRows(infoRows, infoColumns), 'Employee Info');

  const trainingColumns = [
    { key: 'title', header: 'Training Title' },
    { key: 'category', header: 'Category' },
    { key: 'classification', header: 'Classification' },
    { key: 'trainingDate', header: 'Training Date' },
    { key: 'expiration', header: 'Expiration' },
    { key: 'certRecert', header: 'CERT/RE-CERT' },
    { key: 'take', header: 'Take' },
    { key: 'trainer', header: 'Trainer' },
    { key: 'status', header: 'Status' },
  ];

  const trainingRows = trainings.map(t => ({
    title: t.title || '',
    category: t.category || '',
    classification: t.process_classification || '',
    trainingDate: formatDate(t.training_date, ''),
    expiration: t.expiration_date ? formatDate(t.expiration_date, '') : 'No expiry',
    certRecert: certRecertLabel(t.cert_recert),
    take: takeLabel(t.take),
    trainer: t.trainer || '',
    status: certStatusLabel(getCertStatus(t.expiration_date, t.remarks)),
  }));

  XLSX.utils.book_append_sheet(wb, sheetFromRows(trainingRows, trainingColumns), 'Training History');

  return wb;
}

export default function ViewerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show: toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingEmployee, setExportingEmployee] = useState(false);
  const isInitialLoad = useRef(true);
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');
  const [filterTrainingTitle, setFilterTrainingTitle] = useState('');
  const [filterCertStatus, setFilterCertStatus] = useState('');
  const [filterExpiryFrom, setFilterExpiryFrom] = useState('');
  const [filterExpiryTo, setFilterExpiryTo] = useState('');
  const [filterTrainingFrom, setFilterTrainingFrom] = useState('');
  const [filterTrainingTo, setFilterTrainingTo] = useState('');
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
      if (filterTrainingFrom) params.training_from = filterTrainingFrom;
      if (filterTrainingTo) params.training_to = filterTrainingTo;
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
  }, [search, filterTeam, filterEmploymentStatus, filterTrainingTitle, filterCertStatus, filterExpiryFrom, filterExpiryTo, filterTrainingFrom, filterTrainingTo]);

  const clearFilters = () => {
    setSearch('');
    setFilterTeam('');
    setFilterEmploymentStatus('');
    setFilterTrainingTitle('');
    setFilterCertStatus('');
    setFilterExpiryFrom('');
    setFilterExpiryTo('');
    setFilterTrainingFrom('');
    setFilterTrainingTo('');
  };

  const hasActiveFilters = search || filterTeam || filterEmploymentStatus || filterTrainingTitle || filterCertStatus || filterExpiryFrom || filterExpiryTo || filterTrainingFrom || filterTrainingTo;

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await publicApi.exportDirectory();
      const { employees: allEmployees, trainings } = res.data;
      if (!allEmployees.length) {
        toast('No employees to export.', 'warning');
        return;
      }
      const wb = buildDirectoryWorkbook({ employees: allEmployees, trainings });
      const today = new Date().toISOString().split('T')[0];
      writeWorkbook(wb, `JAE-TRMS-Public-Directory-${today}.xlsx`);
      toast(
        `Exported ${allEmployees.length} employee(s) and ${trainings.length} training record(s) to Excel.`,
        'success',
      );
    } catch {
      toast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportEmployee = () => {
    if (!selected) return;
    if (!trainings.length) {
      toast('No training records to export.', 'warning');
      return;
    }
    setExportingEmployee(true);
    try {
      const wb = buildEmployeeTrainingWorkbook(selected, trainings);
      const safeId = String(selected.employee_id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const today = new Date().toISOString().split('T')[0];
      writeWorkbook(wb, `JAE-TRMS-${safeId}-Trainings-${today}.xlsx`);
      toast(`Exported ${trainings.length} training record(s) to Excel.`, 'success');
    } catch {
      toast('Export failed.', 'error');
    } finally {
      setExportingEmployee(false);
    }
  };

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
      if (filterTrainingFrom) params.training_from = filterTrainingFrom;
      if (filterTrainingTo) params.training_to = filterTrainingTo;
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
      key: 'training_titles',
      label: 'Training Titles',
      render: (v) => (
        v ? (
          <span className="text-sm text-gray-700 line-clamp-2 max-w-md" title={v}>{v}</span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      ),
    },
    {
      key: 'expired_count',
      label: 'Cert Status',
      render: (v) => (
        <StatusBadge status={v > 0 ? 'invalid' : 'valid'} />
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
    <div className="h-screen bg-white flex flex-col overflow-hidden app-scroll-lock">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 z-30">
        <div className="w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <img src={`${import.meta.env.BASE_URL}jae-logo.png`} alt="JAE" className="h-10 w-auto object-contain flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-gray-900 leading-tight truncate">Training Records Management System</p>
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
      <PageEnter className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 flex flex-col w-full mx-auto px-6 pt-4 pb-3">
        <div className="flex-shrink-0 space-y-3 bg-white pb-3 mb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Training Directory</h1>
              <p className="text-gray-500 mt-0.5 text-sm">Click on an employee to view their full training history.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm px-3 py-2 rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-200 transition-colors disabled:opacity-40 whitespace-nowrap flex-shrink-0"
              title="Export all employees and training history to Excel"
            >
              <Sheet size={14} />
              {exporting ? 'Exporting…' : 'Export Excel'}
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
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
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8] min-w-48 flex-1"
              />

              <select
                value={filterCertStatus}
                onChange={e => setFilterCertStatus(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              >
                <option value="">All Cert Status</option>
                <option value="expired">Expired</option>
                <option value="expiring30">Expiring in 30 days</option>
                <option value="expiring60">Expiring in 60 days</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-colors whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Training date:</span>
                <input
                  type="date"
                  value={filterTrainingFrom}
                  onChange={e => setFilterTrainingFrom(e.target.value)}
                  title="Training date from"
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={filterTrainingTo}
                  onChange={e => setFilterTrainingTo(e.target.value)}
                  title="Training date to"
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Expiry date:</span>
                <input
                  type="date"
                  value={filterExpiryFrom}
                  onChange={e => setFilterExpiryFrom(e.target.value)}
                  title="Expiry date from"
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={filterExpiryTo}
                  onChange={e => setFilterExpiryTo(e.target.value)}
                  title="Expiry date to"
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <DataTable
            columns={columns}
            data={employees}
            loading={loading && !refreshing}
            refreshing={refreshing}
            emptyMessage="No employees found."
            onRowClick={openEmployee}
            pageSize={9}
            pageSizeOptions={[9, 12, 15, 25, 50]}
            stickyHeader
          />
        </div>

        <p className="flex-shrink-0 text-xs text-gray-400 mt-3 text-center">
          JAE Philippines, Inc. — Read-only public view.
        </p>
      </main>
      </PageEnter>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || ''}
        description={selected ? `${selected.employee_id} · ${selected.factory || '—'} Factory · ${selected.line || '—'} · Team ${selected.team || '—'}` : ''}
        size="2xl"
        bodyClassName="overflow-hidden flex flex-col p-0"
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 flex-shrink-0 border-b border-gray-100 bg-white z-20">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ClipboardList size={14} className="text-[#1D72B8]" />
            Training History
          </h3>
          <button
            type="button"
            onClick={handleExportEmployee}
            disabled={exportingEmployee || trainingLoading || trainings.length === 0}
            className="flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm px-3 py-1.5 rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-200 transition-colors disabled:opacity-40 whitespace-nowrap flex-shrink-0"
            title="Export this employee's training history to Excel"
          >
            <Sheet size={14} />
            {exportingEmployee ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>

        {trainingLoading ? (
          <div className="flex items-center justify-center py-16 px-6">
            <div className="w-6 h-6 border-2 border-[#1D72B8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-16 px-6 text-gray-500 text-sm">No training records found.</div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto px-6 pb-5">
            <table className="min-w-full w-max text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50">
                  {['Training Title', 'Category', 'Training Date', 'Expiration', 'CERT/RE-CERT', 'Take', 'Trainer', 'Status'].map(h => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50 shadow-[inset_0_-1px_0_0_#e5e7eb]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trainings.map(t => {
                  const certLabel = certRecertLabel(t.cert_recert);
                  return (
                  <tr key={t.id} className={`transition-colors ${getTrainingRowClass(t.expiration_date, t.remarks)}`}>
                    <td className="px-3 py-3 text-gray-900 font-medium max-w-[180px]">
                      <p className="truncate">{t.title}</p>
                      {t.process_classification && (
                        <p className="text-xs text-gray-500 truncate">{t.process_classification}</p>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{t.category || '—'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{formatDate(t.training_date)}</td>
                    <td className={`px-3 py-3 whitespace-nowrap ${getExpirationTextClass(t.expiration_date, t.remarks)}`}>
                      {t.expiration_date ? formatDate(t.expiration_date) : 'No expiry'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        certLabel === 'CERT'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {certLabel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {TAKE_LABELS[t.take] || `Take ${t.take}`}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{t.trainer || '—'}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={getCertStatus(t.expiration_date, t.remarks)} />
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

