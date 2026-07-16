import { useState, useEffect, useCallback } from 'react';
import { Search, ArchiveRestore, Trash2, CheckSquare } from 'lucide-react';
import { formatValidityLabel } from '../utils/validity';
import { formatDate, formatDateTime } from '../utils/date';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { trainingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const TAKE_OPTIONS = [
  { value: 1, label: '1st Take' },
  { value: 2, label: '2nd Take' },
  { value: 3, label: '3rd Take' },
];

export default function Archive() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTake, setFilterTake] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterArchivedFrom, setFilterArchivedFrom] = useState('');
  const [filterArchivedTo, setFilterArchivedTo] = useState('');

  // Single-record modal state
  const [selected, setSelected] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Multi-select state
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkRestoring, setBulkRestoring] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await trainingsApi.archived();
      setRecords(res.data);
    } catch {
      toast('Failed to load archived records.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived category list from loaded records
  const categories = [...new Set(records.map(r => r.category).filter(Boolean))].sort();

  const hasActiveFilters = search || filterCategory || filterTake ||
    filterDateFrom || filterDateTo || filterArchivedFrom || filterArchivedTo;

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterTake('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterArchivedFrom('');
    setFilterArchivedTo('');
    setCheckedIds(new Set());
  };

  const filteredRecords = records.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        r.employee_name?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.trainer?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterTake && String(r.take) !== filterTake) return false;
    if (filterDateFrom && r.training_date < filterDateFrom) return false;
    if (filterDateTo && r.training_date > filterDateTo) return false;
    if (filterArchivedFrom) {
      const archivedDay = r.archived_at?.split('T')[0] ?? '';
      if (archivedDay < filterArchivedFrom) return false;
    }
    if (filterArchivedTo) {
      const archivedDay = r.archived_at?.split('T')[0] ?? '';
      if (archivedDay > filterArchivedTo) return false;
    }
    return true;
  });

  const handleRestore = async (id) => {
    if (restoring) return;
    setRestoring(true);
    setRestoreConfirm(null);
    setSelected(null);
    setRecords(prev => prev.filter(r => r.id !== id));
    try {
      await trainingsApi.restore(id);
      toast('Record restored to Training Records.', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to restore record.', 'error');
      load();
    } finally {
      setRestoring(false);
    }
  };

  const handleDeletePermanent = async (id) => {
    if (deleting) return;
    setDeleting(true);
    setDeleteConfirm(null);
    setSelected(null);
    setRecords(prev => prev.filter(r => r.id !== id));
    try {
      await trainingsApi.deletePermanent(id);
      toast('Record permanently deleted.', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete record.', 'error');
      load();
    } finally {
      setDeleting(false);
    }
  };

  // Checkbox helpers
  const toggleCheck = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allVisibleChecked = filteredRecords.length > 0 && filteredRecords.every(r => checkedIds.has(r.id));
  const someChecked = filteredRecords.some(r => checkedIds.has(r.id));

  const toggleAll = () => {
    if (allVisibleChecked) {
      setCheckedIds(prev => {
        const next = new Set(prev);
        filteredRecords.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setCheckedIds(prev => {
        const next = new Set(prev);
        filteredRecords.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const checkedCount = [...checkedIds].filter(id => filteredRecords.some(r => r.id === id)).length;

  const handleBulkRestore = async () => {
    if (bulkRestoring) return;
    setBulkRestoring(true);
    setBulkRestoreConfirm(false);
    const ids = [...checkedIds];
    setRecords(prev => prev.filter(r => !checkedIds.has(r.id)));
    setCheckedIds(new Set());
    try {
      const res = await trainingsApi.bulkRestore(ids);
      toast(`${res.data.count} record(s) restored to Training Records.`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Bulk restore failed.', 'error');
      load();
    } finally {
      setBulkRestoring(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulkDeleting) return;
    setBulkDeleting(true);
    setBulkDeleteConfirm(false);
    const ids = [...checkedIds];
    setRecords(prev => prev.filter(r => !checkedIds.has(r.id)));
    setCheckedIds(new Set());
    try {
      const res = await trainingsApi.bulkDelete(ids);
      toast(`${res.data.count} record(s) permanently deleted.`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Bulk delete failed.', 'error');
      load();
    } finally {
      setBulkDeleting(false);
    }
  };

  const takeLabel = (v) => TAKE_OPTIONS.find(o => o.value === v)?.label || `${v || 1}st Take`;

  const columns = [
    ...(isAdmin ? [{
      key: '__check__',
      sortable: false,
      label: (
        <input
          type="checkbox"
          checked={allVisibleChecked}
          ref={el => { if (el) el.indeterminate = someChecked && !allVisibleChecked; }}
          onChange={toggleAll}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          title={allVisibleChecked ? 'Deselect all' : 'Select all'}
        />
      ),
      className: 'w-10',
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
    {
      key: 'employee_name',
      label: 'Employee',
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    { key: 'title', label: 'Training Title' },
    {
      key: 'category',
      label: 'Category',
      render: (v) => <span className="text-sm text-gray-700">{v || '—'}</span>,
    },
    { key: 'training_date', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'take',
      label: 'Take',
      render: (v) => <span className="text-sm text-gray-700">{takeLabel(v)}</span>,
    },
    {
      key: 'archived_at',
      label: 'Archived On',
      render: (v) => <span className="text-gray-500 text-xs">{formatDateTime(v)}</span>,
    },
    {
      key: '_actions',
      label: '',
      render: (_, row) => (
          <div className="flex gap-1 justify-end">
          <button
            onClick={e => { e.stopPropagation(); setSelected(row); }}
            className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            View
          </button>
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); setRestoreConfirm(row); }}
              disabled={restoring}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Restore
            </button>
          )}
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); setDeleteConfirm(row); }}
              disabled={deleting}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  const detailFields = selected ? [
    { label: 'Employee', value: selected.employee_name },
    { label: 'Training Title', value: selected.title },
    { label: 'Category', value: selected.category },
    { label: 'Training Date', value: formatDate(selected.training_date) },
    { label: 'Trainer', value: selected.trainer || '—' },
    { label: 'Take', value: takeLabel(selected.take) },
    { label: 'Validity', value: formatValidityLabel(selected) },
    { label: 'Expiration Date', value: formatDate(selected.expiration_date) },
    { label: 'Process Classification', value: selected.process_classification || '—' },
    { label: 'Remarks', value: selected.remarks || '—' },
    { label: 'Archived On', value: formatDateTime(selected.archived_at) },
  ] : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
            <p className="text-sm text-gray-500 mt-0.5">Archived training records — restore to move them back</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by employee, title, trainer..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterTake}
              onChange={e => setFilterTake(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Takes</option>
              {TAKE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Row 2 — Training date range + Archived date range + Clear */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Training date:</span>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Archived date:</span>
              <input
                type="date"
                value={filterArchivedFrom}
                onChange={e => setFilterArchivedFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={filterArchivedTo}
                onChange={e => setFilterArchivedTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-700">{filteredRecords.length}</span> of {records.length} archived records
            </p>
          )}
        </div>

        {/* Bulk Action Bar */}
        {isAdmin && checkedCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckSquare size={16} className="text-blue-600 shrink-0" />
            <span className="text-sm text-blue-800 font-medium">{checkedCount} record{checkedCount !== 1 ? 's' : ''} selected</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkRestoring || bulkDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ArchiveRestore size={13} />
                Restore Selected
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkRestoring || bulkDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} />
                Delete Selected
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

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredRecords}
          loading={loading}
          emptyMessage="No archived records found."
          onRowClick={row => setSelected(row)}
        />
      </div>

      {/* View Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Archived Record Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {detailFields.map(({ label, value }) => (
                <div key={label} className={label === 'Training Title' || label === 'Remarks' ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => { setSelected(null); setDeleteConfirm(selected); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Permanently
                </button>
                <button
                  onClick={() => { setSelected(null); setRestoreConfirm(selected); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                >
                  <ArchiveRestore className="h-4 w-4" />
                  Restore Record
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Restore Confirm */}
      <Modal open={!!restoreConfirm} onClose={() => setRestoreConfirm(null)} title="Restore Training Record" size="sm">
        <p className="text-gray-700 text-sm">
          Restore "<span className="text-gray-900 font-medium">{restoreConfirm?.title}</span>" for{' '}
          <span className="text-gray-900 font-medium">{restoreConfirm?.employee_name}</span>? It will reappear in Training Records.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setRestoreConfirm(null)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleRestore(restoreConfirm.id)}
            disabled={restoring}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArchiveRestore className="h-4 w-4" />
            {restoring ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      </Modal>

      {/* Permanent Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Permanently Delete Record" size="sm">
        <p className="text-gray-700 text-sm">
          Are you sure you want to <span className="text-red-600 font-semibold">permanently delete</span> "
          <span className="text-gray-900 font-medium">{deleteConfirm?.title}</span>" for{' '}
          <span className="text-gray-900 font-medium">{deleteConfirm?.employee_name}</span>?
          <br />
          <span className="text-red-500 text-xs mt-1 block">This cannot be undone.</span>
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeletePermanent(deleteConfirm.id)}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting…' : 'Delete Permanently'}
          </button>
        </div>
      </Modal>
      {/* Bulk Restore Confirm */}
      <Modal open={bulkRestoreConfirm} onClose={() => setBulkRestoreConfirm(false)} title="Restore Selected Records" size="sm">
        <p className="text-gray-700 text-sm">
          Restore <span className="font-semibold text-gray-900">{checkedCount} selected record{checkedCount !== 1 ? 's' : ''}</span>?
          {' '}They will reappear in Training Records.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setBulkRestoreConfirm(false)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkRestore}
            disabled={bulkRestoring}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArchiveRestore className="h-4 w-4" />
            {bulkRestoring ? 'Restoring…' : `Restore ${checkedCount}`}
          </button>
        </div>
      </Modal>

      {/* Bulk Delete Confirm */}
      <Modal open={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} title="Permanently Delete Selected Records" size="sm">
        <p className="text-gray-700 text-sm">
          Are you sure you want to <span className="text-red-600 font-semibold">permanently delete</span>{' '}
          <span className="font-semibold text-gray-900">{checkedCount} selected record{checkedCount !== 1 ? 's' : ''}</span>?
          <br />
          <span className="text-red-500 text-xs mt-1 block">This cannot be undone.</span>
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setBulkDeleteConfirm(false)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {bulkDeleting ? 'Deleting…' : `Delete ${checkedCount} Permanently`}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
