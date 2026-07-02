import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Shield, Pencil, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FieldLabel from '../components/FieldLabel';
import StatusBadge from '../components/StatusBadge';
import { usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const emptyForm = { username: '', password: '', full_name: '', role: 'encoder', status: 'active' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const { show: toast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const isInitialLoad = useRef(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    const isRefresh = !isInitialLoad.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await usersApi.list();
      setUsers(res.data);
      if (isRefresh) setContentKey(k => k + 1);
    } catch {
      toast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false;
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setShowPass(false);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setSelected(u);
    setForm({ username: u.username, password: '', full_name: u.full_name, role: u.role, status: u.status });
    setShowPass(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || (!selected && !form.password)) {
      toast('Username and password are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (selected) {
        await usersApi.update(selected.id, payload);
        toast('User updated.', 'success');
      } else {
        await usersApi.create(payload);
        toast('User created.', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    try {
      await usersApi.remove(u.id);
      toast(`User "${u.username}" deactivated.`, 'success');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to deactivate user.', 'error');
    }
  };

  const roleIcons = { admin: <Shield size={12} />, encoder: <Pencil size={12} />, viewer: <Eye size={12} /> };

  const columns = [
    { key: 'username', label: 'Username', render: v => <span className="font-mono text-sm text-[#1D72B8]">{v}</span> },
    { key: 'full_name', label: 'Full Name', render: v => <span className="font-medium text-gray-900 text-sm">{v || '—'}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Created', render: v => <span className="text-xs text-gray-500">{v?.split('T')[0] || v}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
          <Edit2 size={14} />
        </button>
        {row.id !== currentUser?.id && (
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <Layout
      title="User Management"
      actions={
        <>
          <button onClick={load} disabled={loading || refreshing} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={loading || refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#1D72B8] hover:bg-[#1864a3] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add User
          </button>
        </>
      }
    >
      <div key={contentKey} className={contentKey > 0 ? 'page-enter' : undefined}>
        <DataTable columns={columns} data={users} loading={loading && !refreshing} emptyMessage="No users found." />
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <div>
            <FieldLabel required>Username</FieldLabel>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              disabled={!!selected}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8] disabled:opacity-60"
              placeholder="e.g. jdelacruz"
            />
          </div>
          <div>
            <FieldLabel required={!selected}>
              {selected ? 'New Password (leave blank to keep current)' : 'Password'}
            </FieldLabel>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full app-input px-3 py-2.5 pr-10"
                placeholder={selected ? 'Enter new password to change' : 'Minimum 6 characters'}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPass ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full app-input px-3 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              placeholder="User's full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Role</FieldLabel>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              >
                <option value="admin">Admin</option>
                <option value="encoder">Encoder</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full app-input px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1D72B8]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 mt-4 text-xs text-gray-600 border border-blue-100">
          <strong className="text-gray-700">Role permissions:</strong><br />
          Admin — full access + user management<br />
          Encoder — add/edit employees &amp; training records<br />
          Viewer — read-only access to public directory
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors">
            {saving ? 'Saving...' : selected ? 'Update User' : 'Create User'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate User" size="sm">
        <p className="text-gray-700 text-sm">
          Deactivate user <span className="text-gray-900 font-medium">"{deleteConfirm?.username}"</span>? They will no longer be able to log in.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-gray-900 bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Deactivate</button>
        </div>
      </Modal>
    </Layout>
  );
}
