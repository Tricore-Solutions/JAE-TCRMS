import { useState } from 'react';
import { Database, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { dbConfigApi, DEFAULT_DB_CONFIG } from '../api';
import PageEnter from '../components/PageEnter';

export default function Setup() {
  const [form, setForm] = useState({
    ...DEFAULT_DB_CONFIG,
    host: import.meta.env.DEV ? 'localhost' : '',
  });
  const [status, setStatus] = useState('idle'); // idle | testing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const testAndSave = async () => {
    setStatus('testing');
    setErrorMsg('');
    const cfg = {
      host: form.host.trim(),
      port: form.port.trim() || '3306',
      database: form.database.trim(),
      user: form.user.trim(),
      password: form.password,
    };
    try {
      await dbConfigApi.test(cfg);
      await dbConfigApi.set(cfg);
      setStatus('success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Could not connect to the database. Check the details and try again.');
    }
  };

  const busy = status === 'testing' || status === 'success';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <PageEnter className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">JAE TRMS</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Training Records Management System
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Database size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Database Setup</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Enter the address of the shared MySQL server on your company network. Ask your IT
            administrator for the server IP if you are unsure — the other fields can usually stay as-is.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Server IP / Host</label>
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 192.168.1.10"
                value={form.host}
                onChange={setField('host')}
                onKeyDown={(e) => e.key === 'Enter' && testAndSave()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Port</label>
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3306"
                  value={form.port}
                  onChange={setField('port')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Database</label>
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tcrms"
                  value={form.database}
                  onChange={setField('database')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tcrms_user"
                value={form.user}
                onChange={setField('user')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                value={form.password}
                onChange={setField('password')}
                onKeyDown={(e) => e.key === 'Enter' && testAndSave()}
              />
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 bg-red-900/40 border border-red-700 rounded-lg p-3">
                <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{errorMsg}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 rounded-lg p-3">
                <CheckCircle size={16} className="text-green-400" />
                <p className="text-green-300 text-sm">Connected! Launching app...</p>
              </div>
            )}

            <button
              onClick={testAndSave}
              disabled={!form.host.trim() || !form.database.trim() || !form.user.trim() || busy}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg px-4 py-3 transition-colors"
            >
              {status === 'testing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  Connect to Database
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className="text-slate-500 text-xs mt-6 text-center">
            The first time you connect, the required tables and a default admin account
            (admin / admin123) are created automatically if they don&apos;t exist yet.
          </p>
        </div>
      </PageEnter>
    </div>
  );
}
