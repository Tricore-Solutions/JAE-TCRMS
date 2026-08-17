import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbConfigApi } from '../api';
import PageEnter from '../components/PageEnter';
import FieldLabel from '../components/FieldLabel';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbHost, setDbHost] = useState('');

  useEffect(() => {
    let cancelled = false;
    dbConfigApi.get()
      .then((cfg) => { if (!cancelled) setDbHost(cfg ? `${cfg.host}:${cfg.port}` : 'Not configured'); })
      .catch(() => { if (!cancelled) setDbHost('Not configured'); });
    return () => { cancelled = true; };
  }, []);

  const changeDatabase = async () => {
    try { await dbConfigApi.clear(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#B8D4F0] via-[#E8F2FC] to-white flex items-center justify-center p-6">
      <PageEnter className="w-full max-w-[480px]">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-10 py-10 text-center">
          <img
            src={`${import.meta.env.BASE_URL}jae-logo.png`}
            alt="JAE"
            className="h-[4.5rem] w-auto object-contain mb-8 mx-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm mb-8">
            Sign in to the Training Records Management System
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <FieldLabel required>Username</FieldLabel>
              <input
                type="text"
                autoFocus
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <FieldLabel required>Password</FieldLabel>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D72B8] hover:bg-[#1864a3] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-full px-4 py-3 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/viewer')}
              className="text-gray-500 hover:text-[#1D72B8] text-sm transition-colors"
            >
              Continue as Outside Viewer →
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span className="truncate max-w-[280px]">Database: {dbHost}</span>
          <button
            onClick={changeDatabase}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 flex-shrink-0"
          >
            <Settings size={12} /> Change
          </button>
        </div>
      </PageEnter>
    </div>
  );
}
