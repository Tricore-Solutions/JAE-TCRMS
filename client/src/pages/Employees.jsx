import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FieldLabel from '../components/FieldLabel';
import StatusBadge from '../components/StatusBadge';
import { employeesApi, reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const STATUSES = ['active', 'inactive', 'resigned'];
const EMPLOYMENT_STATUSES = [
  'FAMSI - Proby',
  'FAMSI - Reg',
  'MDHII - Proby',
  'MDHII - Reg',
  'Regular - JAE',
];
const emptyForm = {
  employee_id: '', last_name: '', first_name: '', middle_initial: '',
  factory: '', line: '', team: '', position: '', employment_status: '', status: 'active', hire_date: '',
};

export default function Employees() {
  const { isAdmin, isEncoder } = useAuth();
  const { show: toast } = useToast();
  const canEdit = isAdmin || isEncoder;
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ factories: [], lines: [], teams: [] });
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterFactory, setFilterFactory] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [recordLogs, setRecordLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = useCallback(async () => {
    const showSpinner = isInitialLoad.current;
    if (showSpinner) setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterFactory) params.factory = filterFactory;
      if (filterEmploymentStatus) params.employment_status = filterEmploymentStatus;
      if (search) params.search = search;
      const [empRes, filRes] = await Promise.all([
        employeesApi.list(params),
        employeesApi.filters(),
      ]);
      setEmployees(empRes.data);
      setFilters(filRes.data);
    } catch {
      toast('Failed to load employees.', 'error');
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, [search, filterStatus, filterFactory, filterEmploymentStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canEdit) {
      setSelected(null);
      setForm(emptyForm);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canEdit, setSearchParams]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setSelected(emp);
    setForm({
      employee_id: emp.employee_id,
      last_name: emp.last_name || '',
      first_name: emp.first_name || '',
      middle_initial: emp.middle_initial || '',
      factory: emp.factory,
      line: emp.line,
      team: emp.team,
      position: emp.position,
      employment_status: emp.employment_status || '',
      status: emp.status,
      hire_date: emp.hire_date || '',
    });
    setModalOpen(true);
  };

  const openView = async (emp) => {
    setSelected(emp);
    setViewTab('details');
    setRecordLogs([]);
    setViewModal(true);
    setLogsLoading(true);
    try {
      const res = await reportsApi.recordLogs('employees', emp.id);
      setRecordLogs(res.data);
    } catch { /* ignore */ } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.last_name || !form.first_name) {
      toast('Employee ID, last name, and first name are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (selected) {
        await employeesApi.update(selected.id, form);
        toast('Employee updated.', 'success');
      } else {
        await employeesApi.create(form);
        toast('Employee added.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save employee.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    try {
      await employeesApi.remove(emp.id);
      toast('Employee deactivated.', 'success');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to deactivate employee.', 'error');
    }
  };

  const columns = [
    { key: 'employee_id', label: 'Employee ID', render: v => <span className="font-mono text-xs text-[#1D72B8]">{v}</span> },
    { key: 'full_name', label: 'Full Name', render: v => (
      <span className="font-medium text-gray-900 text-sm">{v}</span>
    )},
    { key: 'employment_status', label: 'Employment Status', render: v => (
      <span className="text-sm text-gray-600">{v || '—'}</span>
    )},
    { key: 'hire_date', label: 'Date Hired', render: v => (
      <span className="text-sm text-gray-500">{v || '—'}</span>
    )},
    { key: 'team', label: 'Team' },
    { key: 'line', label: 'Line' },
    { key: 'factory', label: 'Factory' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={e => { e.stopPropagation(); openView(row); }} className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-[#1D72B8] hover:bg-blue-50 rounded-lg transition-colors">
          View
        </button>
        {canEdit && (
          <>
            <button onClick={e => { e.stopPropagation(); openEdit(row); }} className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              Edit
            </button>
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); setDeleteConfirm(row); }} className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Delete
              </button>
            )}
          </>
        )}
      </div>
    )},
  ];

  return (
    <Layout
      title="Employees"
      actions={canEdit && (
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#1D72B8] hover:bg-[#1864a3] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Employee
        </button>
      )}
    >
      <div className="space-y-3 mb-6">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select
            value={filterFactory}
            onChange={e => setFilterFactory(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          >
            <option value="">All Factories</option>
            {filters.factories.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={filterEmploymentStatus}
            onChange={e => setFilterEmploymentStatus(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          >
            <option value="">All Employment Status</option>
            {EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        emptyMessage="No employees found."
        defaultSort={{ key: 'full_name', dir: 'asc' }}
      />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Employee' : 'Add Employee'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Employee ID</FieldLabel>
            <input
              type="text"
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. EMP-011"
            />
          </div>
          <div>
            <FieldLabel required>Last Name</FieldLabel>
            <input
              type="text"
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Dela Cruz"
            />
          </div>
          <div>
            <FieldLabel required>First Name</FieldLabel>
            <input
              type="text"
              value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Juan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Initial</label>
            <input
              type="text"
              value={form.middle_initial}
              onChange={e => setForm(f => ({ ...f, middle_initial: e.target.value }))}
              maxLength={5}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. S"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Factory</label>
            <input
              type="text"
              value={form.factory}
              onChange={e => setForm(f => ({ ...f, factory: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Factory A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Line</label>
            <input
              type="text"
              value={form.line}
              onChange={e => setForm(f => ({ ...f, line: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Line 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Team</label>
            <input
              type="text"
              value={form.team}
              onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Team Alpha"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
            <input
              type="text"
              value={form.position}
              onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="e.g. Machine Operator"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Status</label>
            <select
              value={form.employment_status}
              onChange={e => setForm(f => ({ ...f, employment_status: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              <option value="">Select employment status...</option>
              {form.employment_status && !EMPLOYMENT_STATUSES.includes(form.employment_status) && (
                <option value={form.employment_status}>{form.employment_status}</option>
              )}
              {EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hire Date</label>
            <input
              type="date"
              value={form.hire_date}
              onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors">
            {saving ? 'Saving...' : selected ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Employee Details" size="md">
        {selected && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100/40 rounded-lg p-1">
              {['details', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    viewTab === tab ? 'bg-[#1D72B8] text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab === 'history' ? `History (${recordLogs.length})` : 'Details'}
                </button>
              ))}
            </div>

            {viewTab === 'details' ? (
              <dl className="space-y-0 divide-y divide-gray-200">
                {[
                  { label: 'Employee ID', value: selected.employee_id },
                  { label: 'Full Name', value: selected.full_name },
                  { label: 'Last Name', value: selected.last_name || '—' },
                  { label: 'First Name', value: selected.first_name || '—' },
                  { label: 'Middle Initial', value: selected.middle_initial || '—' },
                  { label: 'Factory', value: selected.factory || '—' },
                  { label: 'Line', value: selected.line || '—' },
                  { label: 'Team', value: selected.team || '—' },
                  { label: 'Position', value: selected.position || '—' },
                  { label: 'Employment Status', value: selected.employment_status || '—' },
                  { label: 'Hire Date', value: selected.hire_date || '—' },
                  { label: 'Status', value: <StatusBadge status={selected.status} /> },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-3">
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className="text-sm text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {logsLoading ? (
                  <p className="text-gray-500 text-sm text-center py-6">Loading history...</p>
                ) : recordLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No history available.</p>
                ) : recordLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-gray-100/40 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.action === 'CREATE' ? 'bg-green-400' :
                        log.action === 'UPDATE' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <p className="text-sm text-gray-900 font-medium flex-1">{log.full_name}</p>
                      <span className="text-xs text-gray-500">{log.created_at}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-4">{log.summary}</p>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="ml-4 space-y-1 border-l-2 border-gray-300 pl-3">
                        {Object.entries(log.changes).map(([field, { before, after }]) => (
                          <div key={field} className="text-xs">
                            <span className="text-gray-500 capitalize">{field.replace(/_/g, ' ')}:</span>
                            <span className="text-red-600 line-through ml-1">{before ?? '—'}</span>
                            <span className="text-gray-500 mx-1">→</span>
                            <span className="text-green-600">{after ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate Employee" size="sm">
        <p className="text-gray-700 text-sm">
          Deactivate <span className="text-gray-900 font-medium">{deleteConfirm?.full_name}</span>? Their training records will be preserved.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-gray-900 bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Deactivate</button>
        </div>
      </Modal>
    </Layout>
  );
}
