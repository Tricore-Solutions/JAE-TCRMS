import { useState, useEffect, useCallback } from 'react';
import { Search, ArchiveRestore, Trash2 } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const filteredRecords = records.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.employee_name?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.trainer?.toLowerCase().includes(q)
    );
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

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const formatDateTime = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const takeLabel = (v) => TAKE_OPTIONS.find(o => o.value === v)?.label || `${v || 1}st Take`;

  const columns = [
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
      key: 'worker_line_status',
      label: 'Line Status',
      render: (v) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${v === 'Floating' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
          {v || '—'}
        </span>
      ),
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
    { label: 'Worker Line Status', value: selected.worker_line_status || '—' },
    { label: 'Validity (months)', value: selected.validity_months || '—' },
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

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search archived records..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

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
    </Layout>
  );
}
