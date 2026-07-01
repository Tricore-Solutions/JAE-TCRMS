import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { trainingsApi, employeesApi, reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const CATEGORIES = ['Safety', 'Technical', 'Quality', 'Management', 'Regulatory', 'Orientation', 'Other'];
const VALIDITY_OPTIONS = [3, 6, 12, 18, 24, 36, 60];

function getCertStatus(expirationDate) {
  if (!expirationDate) return 'valid';
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

const WORKER_LINE_STATUSES = ['Floating', 'Original'];
const TAKE_OPTIONS = [
  { value: 1, label: '1st Take' },
  { value: 2, label: '2nd Take' },
  { value: 3, label: '3rd Take' },
];

const emptyForm = {
  employee_id: '', title: '', category: '', training_date: '',
  trainer: '', validity_months: 12, process_classification: '', remarks: '',
  worker_line_status: 'Floating', take: 1,
};

export default function Training() {
  const { isAdmin, isEncoder } = useAuth();
  const { show: toast } = useToast();
  const canEdit = isAdmin || isEncoder;

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorkerLine, setFilterWorkerLine] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [withValidity, setWithValidity] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [recordLogs, setRecordLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterWorkerLine) params.worker_line_status = filterWorkerLine;
      if (filterStatus === 'expired') params.expired = 'true';
      if (filterStatus === 'expiring') params.expiring_soon = 'true';
      const [trRes, empRes] = await Promise.all([
        trainingsApi.list(params),
        employeesApi.list({ status: 'active' }),
      ]);
      setRecords(trRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      toast('Failed to load training records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus, filterWorkerLine]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setWithValidity(true);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setSelected(record);
    setForm({
      employee_id: record.employee_id,
      title: record.title,
      category: record.category,
      training_date: record.training_date,
      trainer: record.trainer,
      validity_months: record.validity_months,
      process_classification: record.process_classification,
      remarks: record.remarks,
      worker_line_status: record.worker_line_status || 'Floating',
      take: record.take || 1,
    });
    setWithValidity(record.category !== 'Orientation' || !!record.expiration_date);
    setModalOpen(true);
  };

  const openView = async (record) => {
    setSelected(record);
    setViewTab('details');
    setRecordLogs([]);
    setViewModal(true);
    setLogsLoading(true);
    try {
      const res = await reportsApi.recordLogs('trainings', record.id);
      setRecordLogs(res.data);
    } catch { /* ignore */ } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.title || !form.training_date) {
      toast('Employee, title, and training date are required.', 'warning');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      validity_months: form.category === 'Orientation' && !withValidity ? 0 : form.validity_months,
    };
    try {
      if (selected) {
        await trainingsApi.update(selected.id, payload);
        toast('Training record updated.', 'success');
      } else {
        await trainingsApi.create(payload);
        toast('Training record added.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await trainingsApi.remove(id);
      toast('Training record deleted.', 'success');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete record.', 'error');
    }
  };

  const columns = [
    { key: 'employee_name', label: 'Employee', render: (v, row) => (
      <div>
        <p className="text-white font-medium text-sm">{v}</p>
        <p className="text-xs text-slate-500">{row.emp_code}</p>
      </div>
    )},
    { key: 'title', label: 'Training Title', render: v => (
      <span className="text-sm text-slate-200">{v}</span>
    )},
    { key: 'category', label: 'Category', render: v => (
      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{v || '—'}</span>
    )},
    { key: 'training_date', label: 'Date' },
    { key: 'expiration_date', label: 'Expiration', render: (v, row) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={getCertStatus(v)} />
        <span className="text-xs text-slate-500">{v || 'No expiry'}</span>
      </div>
    )},
    { key: 'worker_line_status', label: 'Worker Line Status', render: v => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        v === 'Original'
          ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50'
          : 'bg-amber-900/40 text-amber-400 border border-amber-700/50'
      }`}>
        {v || 'Floating'}
      </span>
    )},
    { key: 'take', label: 'Take', render: v => (
      <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full">
        {TAKE_OPTIONS.find(o => o.value === v)?.label || `${v || 1}st Take`}
      </span>
    )},
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={e => { e.stopPropagation(); openView(row); }} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors" title="View">
          <Eye size={14} />
        </button>
        {canEdit && (
          <>
            <button onClick={e => { e.stopPropagation(); openEdit(row); }} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors" title="Edit">
              <Edit2 size={14} />
            </button>
            {isAdmin && (
              <button onClick={e => { e.stopPropagation(); setDeleteConfirm(row); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      </div>
    )},
  ];

  return (
    <Layout
      title="Training Records"
      actions={canEdit && (
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Add Training Record
        </button>
      )}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee or training..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon</option>
        </select>
        <select
          value={filterWorkerLine}
          onChange={e => setFilterWorkerLine(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Worker Line</option>
          {WORKER_LINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={records} loading={loading} emptyMessage="No training records found." />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Training Record' : 'Add Training Record'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Employee *</label>
            <select
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              disabled={!!selected}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Training Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Basic Safety Orientation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Training Date *</label>
            <input
              type="date"
              value={form.training_date}
              onChange={e => setForm(f => ({ ...f, training_date: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Trainer / Conducted By</label>
            <input
              type="text"
              value={form.trainer}
              onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Trainer name or organization"
            />
            {form.category === 'Orientation' && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withValidity}
                  onChange={e => setWithValidity(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm text-slate-300">With Validity</span>
              </label>
            )}
          </div>
          {!(form.category === 'Orientation' && !withValidity) && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Validity (months)</label>
                <select
                  value={form.validity_months}
                  onChange={e => setForm(f => ({ ...f, validity_months: parseInt(e.target.value) }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {VALIDITY_OPTIONS.map(v => <option key={v} value={v}>{v} months</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Process Classification</label>
                <input
                  type="text"
                  value={form.process_classification}
                  onChange={e => setForm(f => ({ ...f, process_classification: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. General, Production"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Worker Line Status</label>
            <select
              value={form.worker_line_status}
              onChange={e => setForm(f => ({ ...f, worker_line_status: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WORKER_LINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Take</label>
            <select
              value={form.take}
              onChange={e => setForm(f => ({ ...f, take: parseInt(e.target.value) }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TAKE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </div>
        {form.training_date && form.validity_months && !(form.category === 'Orientation' && !withValidity) && (
          <div className="mt-4 bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              Calculated expiration: <span className="text-white font-medium">
                {(() => {
                  const d = new Date(form.training_date);
                  d.setMonth(d.getMonth() + parseInt(form.validity_months));
                  return d.toISOString().split('T')[0];
                })()}
              </span> ({form.validity_months} months from training date)
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors">
            {saving ? 'Saving...' : selected ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Training Record Details" size="md">
        {selected && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-700/40 rounded-lg p-1">
              {['details', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                    viewTab === tab ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'history' ? `History (${recordLogs.length})` : 'Details'}
                </button>
              ))}
            </div>

            {viewTab === 'details' ? (
              <dl className="space-y-3">
                {[
                  { label: 'Employee', value: `${selected.employee_name} (${selected.emp_code})` },
                  { label: 'Training Title', value: selected.title },
                  { label: 'Category', value: selected.category || '—' },
                  { label: 'Training Date', value: selected.training_date },
                  { label: 'Trainer', value: selected.trainer || '—' },
                  { label: 'Validity', value: `${selected.validity_months} months` },
                  { label: 'Expiration Date', value: selected.expiration_date || '—' },
                  { label: 'Status', value: <StatusBadge status={getCertStatus(selected.expiration_date)} /> },
                  { label: 'Process Classification', value: selected.process_classification || '—' },
                  { label: 'Worker Line Status', value: selected.worker_line_status || 'Floating' },
                  { label: 'Take', value: TAKE_OPTIONS.find(o => o.value === selected.take)?.label || `${selected.take || 1}st Take` },
                  { label: 'Remarks', value: selected.remarks || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-700/50">
                    <dt className="text-sm text-slate-400 flex-shrink-0">{label}</dt>
                    <dd className="text-sm text-white text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {logsLoading ? (
                  <p className="text-slate-500 text-sm text-center py-6">Loading history...</p>
                ) : recordLogs.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No history available.</p>
                ) : recordLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-slate-700/40 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.action === 'CREATE' ? 'bg-green-400' :
                        log.action === 'UPDATE' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <p className="text-sm text-white font-medium flex-1">{log.username}</p>
                      <span className="text-xs text-slate-500">{log.created_at}</span>
                    </div>
                    <p className="text-xs text-slate-400 ml-4">{log.summary}</p>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="ml-4 space-y-1 border-l-2 border-slate-600 pl-3">
                        {Object.entries(log.changes).map(([field, { before, after }]) => (
                          <div key={field} className="text-xs">
                            <span className="text-slate-500 capitalize">{field.replace(/_/g, ' ')}:</span>
                            <span className="text-red-400 line-through ml-1">{before ?? '—'}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-green-400">{after ?? '—'}</span>
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
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Training Record" size="sm">
        <p className="text-slate-300 text-sm">
          Are you sure you want to delete the training record "<span className="text-white font-medium">{deleteConfirm?.title}</span>" for <span className="text-white font-medium">{deleteConfirm?.employee_name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
