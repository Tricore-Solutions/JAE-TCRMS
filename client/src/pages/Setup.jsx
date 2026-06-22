import { useState } from 'react';
import { Server, CheckCircle, XCircle, Wifi, ArrowRight } from 'lucide-react';
import { checkServer } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Setup() {
  const { configureServer } = useAuth();
  const [serverIp, setServerIp] = useState('');
  const [port, setPort] = useState('3000');
  const [status, setStatus] = useState('idle'); // idle | testing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const testAndSave = async () => {
    const url = `http://${serverIp.trim()}:${port.trim()}`;
    setStatus('testing');
    setErrorMsg('');
    try {
      await checkServer(url);
      configureServer(url);
      setStatus('success');
      // Brief pause then reload to show login
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setStatus('error');
      setErrorMsg(
        `Cannot connect to ${url}. Make sure the server is running on that machine and the IP is correct.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Server size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">JAE TCRMS</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Training &amp; Certification Record Management System
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Wifi size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Server Setup</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Enter the IP address of the computer running the JAE TCRMS server on your company network.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Server IP Address
              </label>
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 192.168.1.10"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && testAndSave()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Port
              </label>
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3000"
                value={port}
                onChange={(e) => setPort(e.target.value)}
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
              disabled={!serverIp.trim() || status === 'testing' || status === 'success'}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg px-4 py-3 transition-colors"
            >
              {status === 'testing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  Connect to Server
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className="text-slate-500 text-xs mt-6 text-center">
            Ask your IT administrator for the server IP address.
          </p>
        </div>
      </div>
    </div>
  );
}
