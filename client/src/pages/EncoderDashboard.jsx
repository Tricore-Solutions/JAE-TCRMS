import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, AlertTriangle, XCircle, Plus, CalendarDays } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import { reportsApi, trainingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function getCertStatus(expirationDate) {
  if (!expirationDate) return null;
  const today = todayISO();
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
  if (expirationDate < today) return 'expired';
  if (expirationDate <= in60) return 'expiring';
  return 'valid';
}

export default function EncoderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [expiring30, setExpiring30] = useState([]);
  const [expiredCerts, setExpiredCerts] = useState([]);
  const [todaysRecords, setTodaysRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiringModalOpen, setExpiringModalOpen] = useState(false);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);

  useEffect(() => {
    const today = todayISO();
    Promise.all([
      reportsApi.overview(),
      reportsApi.expiring(),
      reportsApi.expiring({ days: 30 }),
      reportsApi.expiring({ expired: true }),
      trainingsApi.list({ training_date: today }),
    ])
      .then(([ovRes, exRes, ex30Res, expiredRes, todayRes]) => {
        setOverview(ovRes.data);
        setExpiring(exRes.data.slice(0, 10));
        setExpiring30(ex30Res.data);
        setExpiredCerts(expiredRes.data);
        setTodaysRecords(todayRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const certColumns = [
    { key: 'full_name', label: 'Employee', render: (v, row) => (
      <div>
        <p className="text-gray-900 font-medium text-sm">{v}</p>
        <p className="text-xs text-gray-500">{row.emp_code}</p>
      </div>
    )},
    { key: 'title', label: 'Training Title' },
    { key: 'factory', label: 'Factory', render: v => v || '—' },
    { key: 'expiration_date', label: 'Expiration Date', render: v => formatDate(v) },
    { key: 'cert_status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{greeting}, {user?.full_name}</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage employee training and certification records.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Active Employees" value={overview?.totalEmployees ?? '—'} icon={Users} color="blue" />
          <StatCard title="Training Records" value={overview?.totalTrainings ?? '—'} icon={ClipboardList} color="green" />
          <StatCard
            title="Expiring (30 days)"
            value={overview?.expiring30 ?? '—'}
            icon={AlertTriangle}
            color="amber"
            onClick={() => setExpiringModalOpen(true)}
          />
          <StatCard
            title="Expired Certs"
            value={overview?.expiredCerts ?? '—'}
            icon={XCircle}
            color="red"
            onClick={() => setExpiredModalOpen(true)}
          />
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/encoder/employees?action=create')}
            className="flex items-center gap-2 bg-[#1D72B8] hover:bg-[#1864a3] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Employee
          </button>
          <button
            onClick={() => navigate('/encoder/training?action=create')}
            className="flex items-center gap-2 bg-[#1D72B8] hover:bg-[#1864a3] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Record
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="app-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#1D72B8]" />
              Today&apos;s Records
            </h3>
            <span className="text-xs text-gray-500">{todaysRecords.length} records</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : todaysRecords.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No training records dated today.</p>
          ) : (
            <div className="space-y-0 divide-y divide-gray-200">
              {todaysRecords.map(item => {
                const certStatus = getCertStatus(item.expiration_date);
                return (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.employee_name}</p>
                    <p className="text-xs text-gray-500">{item.title} · {item.category || 'Uncategorized'}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    {certStatus && <StatusBadge status={certStatus} />}
                    <span className="text-xs text-gray-500">{formatDate(item.training_date)}</span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="app-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              Certifications Requiring Attention
            </h3>
            <span className="text-xs text-gray-500">{expiring.length} records</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : expiring.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">All certifications are up to date.</p>
          ) : (
            <div className="space-y-0 divide-y divide-gray-200">
              {expiring.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.full_name}</p>
                    <p className="text-xs text-gray-500">{item.title} · {item.factory}</p>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <StatusBadge status={item.cert_status} />
                    <span className="text-xs text-gray-500 mt-1">{formatDate(item.expiration_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={expiringModalOpen}
        onClose={() => setExpiringModalOpen(false)}
        title="Expiring in 30 Days"
        description="Training certifications expiring within the next 30 days."
        size="xl"
      >
        <DataTable
          columns={certColumns}
          data={expiring30}
          loading={loading}
          emptyMessage="No certifications expiring in the next 30 days."
        />
      </Modal>

      <Modal
        open={expiredModalOpen}
        onClose={() => setExpiredModalOpen(false)}
        title="Expired Certifications"
        description="Training certifications that have already expired."
        size="xl"
      >
        <DataTable
          columns={certColumns}
          data={expiredCerts}
          loading={loading}
          emptyMessage="No expired certifications found."
          rowClassName={(row) =>
            row.cert_status === 'expired' ? 'bg-red-50 hover:bg-red-100' : ''
          }
        />
      </Modal>
    </Layout>
  );
}
