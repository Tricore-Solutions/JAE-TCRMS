import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Sheet, CheckSquare, Archive } from 'lucide-react';
import * as XLSX from 'xlsx';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FieldLabel from '../components/FieldLabel';
import StatusBadge from '../components/StatusBadge';
import SearchableSelect from '../components/SearchableSelect';
import { trainingsApi, employeesApi, reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const CATEGORIES = ['Safety', 'Technical', 'Quality', 'Management', 'Regulatory', 'Orientation', 'Other'];
import {
  DEFAULT_VALIDITY_OPTION,
  calcExpirationPreview,
  formatValidityLabel,
  getValidityOptionsForForm,
  getValidityPreviewLabel,
  recordToValidityOption,
  validityOptionToPayload,
} from '../utils/validity';

function getCertStatus(expirationDate) {
  if (!expirationDate) return 'valid';
  const today = new Date().toISOString().split('T')[0];
  const in60 = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

function getExpirationUrgency(expirationDate) {
  if (!expirationDate) return 'none';
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in30) return 'expiring30';
  return 'valid';
}

const WORKER_LINE_STATUSES = ['Floating', 'Original'];
const PROCESS_CLASSIFICATION_OPTIONS = ['Beginner', 'Basic', 'Expert', 'Advanced', 'Non-sensing', 'Sensing'];
const CLASSIFICATION_CHIP_STYLES = {
  Beginner: 'bg-green-50 text-green-700 border border-green-200',
  Basic: 'bg-blue-50 text-[#1D72B8] border border-blue-200',
  Advanced: 'bg-amber-50 text-amber-700 border border-amber-200',
  Expert: 'bg-purple-50 text-purple-700 border border-purple-200',
  'Non-sensing': 'bg-slate-50 text-slate-700 border border-slate-200',
  Sensing: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
};

function getClassificationChipClass(value) {
  return CLASSIFICATION_CHIP_STYLES[value] || 'bg-gray-100 text-gray-600 border border-gray-200';
}
const TAKE_OPTIONS = [
  { value: 1, label: '1st Take' },
  { value: 2, label: '2nd Take' },
  { value: 3, label: '3rd Take' },
];

const emptyForm = {
  employee_id: '', title: '', category: '', training_date: '',
  trainer: '', validity_option: DEFAULT_VALIDITY_OPTION, process_classification: '', remarks: '',
  worker_line_status: 'Floating', take: 1,
};

function buildFilterParams({ search, filterCategory, filterStatus, filterWorkerLine, filterTake, filterDateFrom, filterDateTo }) {
  const params = {};
  if (search) params.search = search;
  if (filterCategory) params.category = filterCategory;
  if (filterWorkerLine) params.worker_line_status = filterWorkerLine;
  if (filterTake) params.take = filterTake;
  if (filterDateFrom) params.date_from = filterDateFrom;
  if (filterDateTo) params.date_to = filterDateTo;
  if (filterStatus === 'expired') params.expired = 'true';
  if (filterStatus === 'expiring') params.expiring_soon = 'true';
  return params;
}

function exportToXLSX(data, filename) {
  if (!data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Records');

  // Auto-size columns based on content
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length), 10),
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

export default function Training() {
  const { isAdmin, isEncoder } = useAuth();
  const { show: toast } = useToast();
  const canEdit = isAdmin || isEncoder;
  const [searchParams, setSearchParams] = useSearchParams();

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [trainingTitles, setTrainingTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorkerLine, setFilterWorkerLine] = useState('');
  const [filterTake, setFilterTake] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

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
  const [exporting, setExporting] = useState(false);

  // Multi-select
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkArchiving, setBulkArchiving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildFilterParams({ search, filterCategory, filterStatus, filterWorkerLine, filterTake, filterDateFrom, filterDateTo });
      const [trRes, empRes, titlesRes] = await Promise.all([
        trainingsApi.list(params),
        employeesApi.list({ status: 'active' }),
        trainingsApi.titles(),
      ]);
      setRecords(trRes.data);
      setEmployees(empRes.data);
      setTrainingTitles(titlesRes.data);
      setCheckedIds(new Set());
    } catch (err) {
      toast('Failed to load training records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus, filterWorkerLine, filterTake, filterDateFrom, filterDateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && canEdit) {
      setSelected(null);
      setForm({ ...emptyForm, training_date: new Date().toISOString().split('T')[0] });
      setWithValidity(true);
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, canEdit, setSearchParams]);

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
      validity_option: recordToValidityOption(record),
      process_classification: record.process_classification,
      remarks: record.remarks,
      worker_line_status: record.worker_line_status || 'Floating',
      take: record.take || 1,
    });
    setWithValidity(
      record.category !== 'Orientation'
        || Number(record.validity_months) > 0
        || Number(record.validity_days) > 0,
    );
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
    const validity = form.category === 'Orientation' && !withValidity
      ? { validity_months: 0, validity_days: null }
      : validityOptionToPayload(form.validity_option);
    const payload = {
      ...form,
      ...validity,
    };
    delete payload.validity_option;
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
      // Refresh title list so newly added titles appear immediately
      trainingsApi.titles().then(r => setTrainingTitles(r.data)).catch(() => {});
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save record.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await trainingsApi.remove(id);
      toast('Training record archived.', 'success');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to archive record.', 'error');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildFilterParams({ search, filterCategory, filterStatus, filterWorkerLine, filterTake, filterDateFrom, filterDateTo });
      const res = await reportsApi.exportTrainings(params);
      if (!res.data.length) {
        toast('No records to export for the current filters.', 'warning');
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      exportToXLSX(res.data, `JAE-TCRMS-Training-Report-${today}.xlsx`);
      toast(`Exported ${res.data.length} records to Excel.`, 'success');
    } catch {
      toast('Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Checkbox helpers
  const toggleCheck = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allChecked = records.length > 0 && records.every(r => checkedIds.has(r.id));
  const someChecked = records.some(r => checkedIds.has(r.id));
  const checkedCount = [...checkedIds].filter(id => records.some(r => r.id === id)).length;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(prev => {
        const next = new Set(prev);
        records.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setCheckedIds(prev => {
        const next = new Set(prev);
        records.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const handleBulkArchive = async () => {
    if (bulkArchiving) return;
    setBulkArchiving(true);
    setBulkArchiveConfirm(false);
    const ids = [...checkedIds];
    setRecords(prev => prev.filter(r => !checkedIds.has(r.id)));
    setCheckedIds(new Set());
    try {
      const res = await trainingsApi.bulkArchive(ids);
      toast(`${res.data.count} record(s) archived.`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Bulk archive failed.', 'error');
      load();
    } finally {
      setBulkArchiving(false);
    }
  };

  const columns = [
    ...(isAdmin ? [{
      key: '__check__',
      sortable: false,
      className: 'w-10',
      label: (
        <input
          type="checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
          onChange={toggleAll}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          title={allChecked ? 'Deselect all' : 'Select all'}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={checkedIds.has(row.id)}
          onChange={() => toggleCheck(row.id)}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      ),
    }] : []),
    { key: 'employee_name', label: 'Employee', className: 'w-44 min-w-44', render: (v, row) => (
      <div>
        <p className="text-gray-900 font-medium text-sm">{v}</p>
        <p className="text-xs text-gray-500">{row.emp_code}</p>
      </div>
    )},
    { key: 'title', label: 'Training Title', render: v => (
      <span className="text-sm text-gray-600">{v}</span>
    )},
    { key: 'category', label: 'Category', render: v => (
      <span className="text-sm text-gray-700">{v || '—'}</span>
    )},
    { key: 'trainer', label: 'Trainer', render: v => (
      <span className="text-sm text-gray-600">{v || '—'}</span>
    )},
    { key: 'process_classification', label: 'Classification', render: v => v ? (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getClassificationChipClass(v)}`}>{v}</span>
    ) : (
      <span className="text-xs text-gray-400">—</span>
    )},
    { key: 'training_date', label: 'Date' },
    { key: 'validity', label: 'Validity', render: (_, row) => (
      <span className="text-sm text-gray-700">{formatValidityLabel(row)}</span>
    )},
    { key: 'expiration_date', label: 'Expiration', render: v => {
      const urgency = getExpirationUrgency(v);
      const colorClass = urgency === 'valid'
        ? 'text-green-600'
        : urgency === 'none'
          ? 'text-gray-500'
          : 'text-red-600';
      return (
        <span className={`text-sm font-medium ${colorClass}`}>
          {v || 'No expiry'}
        </span>
      );
    }},
    { key: 'worker_line_status', label: 'Line Status', className: 'w-24 max-w-24 px-2', render: v => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        v === 'Original'
          ? 'bg-blue-50 text-[#1D72B8] border border-blue-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {v || 'Floating'}
      </span>
    )},
    { key: 'take', label: 'Take', render: v => (
      <span className="text-sm text-gray-700">
        {TAKE_OPTIONS.find(o => o.value === v)?.label || `${v || 1}st Take`}
      </span>
    )},
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
              <button onClick={e => { e.stopPropagation(); setDeleteConfirm(row); }} className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                Archive
              </button>
            )}
          </>
        )}
      </div>
    )},
  ];

  return (
    <Layout
      title="Training & Certification Records"
      actions={(
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm px-3 py-2 rounded-lg hover:bg-green-50 border border-gray-200 hover:border-green-200 transition-colors disabled:opacity-40"
            title="Export filtered records to Excel"
          >
            <Sheet size={14} />
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
          {canEdit && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#1D72B8] hover:bg-[#1864a3] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Add Training Record
            </button>
          )}
        </div>
      )}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search employee or training..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
        >
          <option value="">All Expiry</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon</option>
        </select>
        <select
          value={filterWorkerLine}
          onChange={e => setFilterWorkerLine(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
        >
          <option value="">All Worker Line</option>
          {WORKER_LINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterTake}
          onChange={e => setFilterTake(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
        >
          <option value="">All Takes</option>
          {TAKE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isAdmin && checkedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-2 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckSquare size={16} className="text-blue-600 shrink-0" />
          <span className="text-sm text-blue-800 font-medium">{checkedCount} record{checkedCount !== 1 ? 's' : ''} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setBulkArchiveConfirm(true)}
              disabled={bulkArchiving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Archive size={13} />
              Archive Selected
            </button>
            <button
              onClick={() => setCheckedIds(new Set())}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        tableClassName="table-fixed"
        emptyMessage="No training records found."
        rowClassName={(row) =>
          getExpirationUrgency(row.expiration_date) === 'expired'
            ? 'bg-red-50 hover:bg-red-100'
            : ''
        }
      />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Training Record' : 'Add Training Record'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FieldLabel required>Employee</FieldLabel>
            <select
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              disabled={!!selected}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8] disabled:opacity-60"
            >
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <FieldLabel required>Training Title</FieldLabel>
            <SearchableSelect
              value={form.title}
              onChange={v => setForm(f => ({ ...f, title: v }))}
              options={trainingTitles}
              placeholder="Search or enter a training title…"
              addLabel="Add new title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel required>Training Date</FieldLabel>
            <input
              type="date"
              value={form.training_date}
              onChange={e => setForm(f => ({ ...f, training_date: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trainer / Conducted By</label>
            <input
              type="text"
              value={form.trainer}
              onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
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
                <span className="text-sm text-gray-700">With Validity</span>
              </label>
            )}
          </div>
          {!(form.category === 'Orientation' && !withValidity) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Validity</label>
                <select
                  value={form.validity_option}
                  onChange={e => setForm(f => ({ ...f, validity_option: e.target.value }))}
                  className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                >
                  {getValidityOptionsForForm(selected).map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Process Classification</label>
                <select
                  value={form.process_classification}
                  onChange={e => setForm(f => ({ ...f, process_classification: e.target.value }))}
                  className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
                >
                  <option value="">Select classification...</option>
                  {form.process_classification && !PROCESS_CLASSIFICATION_OPTIONS.includes(form.process_classification) && (
                    <option value={form.process_classification}>{form.process_classification}</option>
                  )}
                  {PROCESS_CLASSIFICATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Worker Line Status</label>
            <select
              value={form.worker_line_status}
              onChange={e => setForm(f => ({ ...f, worker_line_status: e.target.value }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              {WORKER_LINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Take</label>
            <select
              value={form.take}
              onChange={e => setForm(f => ({ ...f, take: parseInt(e.target.value) }))}
              className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
            >
              {TAKE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              rows={3}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8] resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </div>
        {form.training_date && form.validity_option && !(form.category === 'Orientation' && !withValidity) && (
          <div className="mt-4 bg-gray-100/50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              Calculated expiration: <span className="text-gray-900 font-medium">
                {calcExpirationPreview(form.training_date, form.validity_option)}
              </span> ({getValidityPreviewLabel(form.validity_option)} from training date)
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors">
            {saving ? 'Saving...' : selected ? 'Update Record' : 'Add Record'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Training Record Details" size="md">
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
              <dl className="space-y-3">
                {[
                  { label: 'Employee', value: `${selected.employee_name} (${selected.emp_code})` },
                  { label: 'Training Title', value: selected.title },
                  { label: 'Category', value: selected.category || '—' },
                  { label: 'Training Date', value: selected.training_date },
                  { label: 'Trainer', value: selected.trainer || '—' },
                  { label: 'Validity', value: formatValidityLabel(selected) },
                  { label: 'Expiration Date', value: selected.expiration_date || '—' },
                  { label: 'Status', value: <StatusBadge status={getCertStatus(selected.expiration_date)} /> },
                  { label: 'Process Classification', value: selected.process_classification || '—' },
                  { label: 'Worker Line Status', value: selected.worker_line_status || 'Floating' },
                  { label: 'Take', value: TAKE_OPTIONS.find(o => o.value === selected.take)?.label || `${selected.take || 1}st Take` },
                  { label: 'Remarks', value: selected.remarks || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2 border-b border-gray-200">
                    <dt className="text-sm text-gray-500 flex-shrink-0">{label}</dt>
                    <dd className="text-sm text-gray-900 text-right">{value}</dd>
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

      {/* Bulk Archive Confirm */}
      <Modal open={bulkArchiveConfirm} onClose={() => setBulkArchiveConfirm(false)} title="Archive Selected Records" size="sm">
        <p className="text-gray-700 text-sm">
          Archive <span className="font-semibold text-gray-900">{checkedCount} selected record{checkedCount !== 1 ? 's' : ''}</span>?
          {' '}They can be restored from the Archive page.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setBulkArchiveConfirm(false)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkArchive}
            disabled={bulkArchiving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Archive className="h-4 w-4" />
            {bulkArchiving ? 'Archiving…' : `Archive ${checkedCount}`}
          </button>
        </div>
      </Modal>

      {/* Archive Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Archive Training Record" size="sm">
        <p className="text-gray-700 text-sm">
          Are you sure you want to archive the training record "<span className="text-gray-900 font-medium">{deleteConfirm?.title}</span>" for <span className="text-gray-900 font-medium">{deleteConfirm?.employee_name}</span>?
          You can restore it from the Archive page.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => handleDelete(deleteConfirm.id)} className="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors">
            Archive
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
