import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Shield, Pencil, Eye } from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch {
      toast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

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
    { key: 'username', label: 'Username', render: v => <span className="font-mono text-sm text-blue-400">{v}</span> },
    { key: 'full_name', label: 'Full Name', render: v => <span className="font-medium text-white text-sm">{v || '—'}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Created', render: v => <span className="text-xs text-slate-500">{v?.split('T')[0] || v}</span> },
    { key: 'actions', label: '', sortable: false, render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors">
          <Edit2 size={14} />
        </button>
        {row.id !== currentUser?.id && (
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
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
          <button onClick={load} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <RefreshCw size={14} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add User
          </button>
        </>
      }
    >
      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found." />

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username *</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              disabled={!!selected}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              placeholder="e.g. jdelacruz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {selected ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={selected ? 'Enter new password to change' : 'Minimum 6 characters'}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <Eye size={14} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="User's full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role *</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="encoder">Encoder</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-slate-700/40 rounded-lg p-3 mt-4 text-xs text-slate-400">
          <strong className="text-slate-300">Role permissions:</strong><br />
          Admin — full access + user management<br />
          Encoder — add/edit employees &amp; training records<br />
          Viewer — read-only access to public directory
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-colors">
            {saving ? 'Saving...' : selected ? 'Update User' : 'Create User'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate User" size="sm">
        <p className="text-slate-300 text-sm">
          Deactivate user <span className="text-white font-medium">"{deleteConfirm?.username}"</span>? They will no longer be able to log in.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">Deactivate</button>
        </div>
      </Modal>
    </Layout>
  );
}
