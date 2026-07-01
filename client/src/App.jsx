import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { checkServer, DEFAULT_SERVER } from './api';

import Setup from './pages/Setup';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EncoderDashboard from './pages/EncoderDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import Employees from './pages/Employees';
import Training from './pages/Training';
import Users from './pages/Users';
import Reports from './pages/Reports';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'encoder') return <Navigate to="/encoder/dashboard" replace />;
  return <Navigate to="/viewer" replace />;
}

function AppRoutes() {
  const { configureServer } = useAuth();
  const [bootState, setBootState] = useState('checking'); // checking | setup | ready

  useEffect(() => {
    if (localStorage.getItem('serverUrl')) {
      setBootState('ready');
      return;
    }

    // In production with a known backend URL, use it directly
    if (import.meta.env.VITE_API_URL) {
      configureServer(import.meta.env.VITE_API_URL);
      setBootState('ready');
      return;
    }

    if (!import.meta.env.DEV) {
      setBootState('setup');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await checkServer(DEFAULT_SERVER);
        if (!cancelled) {
          configureServer(DEFAULT_SERVER);
          setBootState('ready');
        }
      } catch {
        if (!cancelled) setBootState('setup');
      }
    })();

    return () => { cancelled = true; };
  }, [configureServer]);

  if (bootState === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-400 text-sm">
        Connecting to local server...
      </div>
    );
  }

  if (bootState === 'setup') return <Setup />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/viewer" element={<ViewerDashboard />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>
      } />
      <Route path="/admin/users" element={
        <RequireAuth roles={['admin']}><Users /></RequireAuth>
      } />
      <Route path="/admin/training" element={
        <RequireAuth roles={['admin']}><Training /></RequireAuth>
      } />
      <Route path="/admin/reports" element={
        <RequireAuth roles={['admin']}><Reports /></RequireAuth>
      } />

      {/* Encoder routes */}
      <Route path="/encoder/dashboard" element={
        <RequireAuth roles={['encoder']}><EncoderDashboard /></RequireAuth>
      } />
      <Route path="/encoder/employees" element={
        <RequireAuth roles={['encoder', 'admin']}><Employees /></RequireAuth>
      } />
      <Route path="/encoder/training" element={
        <RequireAuth roles={['encoder', 'admin']}><Training /></RequireAuth>
      } />

      {/* Shared */}
      <Route path="/employees" element={
        <RequireAuth roles={['admin', 'encoder']}><Employees /></RequireAuth>
      } />
      <Route path="/training" element={
        <RequireAuth roles={['admin', 'encoder']}><Training /></RequireAuth>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
