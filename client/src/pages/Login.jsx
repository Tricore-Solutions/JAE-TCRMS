import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, ClipboardList, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const serverUrl = localStorage.getItem('serverUrl') || 'Not configured';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(form.username, form.password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'encoder') navigate('/encoder/dashboard');
      else navigate('/viewer');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <ClipboardList size={20} className="text-blue-400" />
            </div>
            <span className="text-white font-semibold text-lg">JAE TCRMS</span>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Training &amp; Certification<br />Record Management
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            Manage employee training records, track certifications, and stay compliant — all on your company network.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Employee Tracking', desc: 'Monitor workforce training status' },
              { label: 'Cert Alerts', desc: 'Automatic expiration notifications' },
              { label: 'Role-Based Access', desc: 'Admin, Encoder, Viewer roles' },
              { label: 'Offline-Ready', desc: 'Works on your local network' },
            ].map(f => (
              <div key={f.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white text-sm font-medium">{f.label}</p>
                <p className="text-slate-400 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-sm">JAE Philippines, Inc. — Internal Use Only</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3">
              <ClipboardList size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">JAE TCRMS</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-lg p-3 mb-6">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                autoFocus
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg px-4 py-3 transition-colors mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/viewer')}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Continue as Outside Viewer →
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600 truncate">Server: {serverUrl}</span>
            <button
              onClick={() => { localStorage.removeItem('serverUrl'); window.location.reload(); }}
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs ml-2"
            >
              <Settings size={12} /> Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
