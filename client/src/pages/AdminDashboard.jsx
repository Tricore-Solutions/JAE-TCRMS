import { useState, useEffect } from 'react';
import { Users, AlertTriangle, BadgeCheck, TrendingUp, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

function ExpiringList({ items }) {
  if (!items.length) return (
    <p className="text-gray-500 text-sm text-center py-6">No expiring certifications</p>
  );
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-start justify-between gap-4 py-3 border-b border-gray-200 last:border-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.full_name}</p>
            <p className="text-xs text-gray-500">{item.title}</p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <StatusBadge status={item.cert_status} />
            <span className="text-xs text-gray-500 mt-1">{formatDate(item.expiration_date)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [expiring30, setExpiring30] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expiring30ModalOpen, setExpiring30ModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      reportsApi.overview(),
      reportsApi.expiring(),
      reportsApi.expiring({ days: 10 }),
      reportsApi.expiring({ expired: true }),
    ]).then(([ovRes, exRes, ex10Res, expiredRes]) => {
      setOverview(ovRes.data);
      setExpiring(exRes.data);
      setExpiring30([...expiredRes.data, ...ex10Res.data]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{greeting}, {user?.full_name}</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Here&apos;s an overview of your training and certification records.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Total Employees"
            value={overview?.employeeTotal ?? '—'}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Certifications"
            value={overview?.activeCertifications ?? '—'}
            icon={BadgeCheck}
            color="green"
          />
          <StatCard
            title="Training Completion Rate"
            value={overview?.trainingCompletionRate != null ? `${overview.trainingCompletionRate}%` : '—'}
            subtitle="Active employees with training"
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Expired & Expiring"
            value={overview?.expiredAndExpiring ?? '—'}
            subtitle="Expired or within 10 days"
            icon={AlertTriangle}
            color="amber"
            onClick={() => setExpiring30ModalOpen(true)}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="app-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <XCircle size={16} className="text-red-600" />
              Expired Certifications
            </h3>
            <span className="text-xs text-gray-500">{expiring.filter(e => e.cert_status === 'expired').length} records</span>
          </div>
          <ExpiringList items={expiring.filter(e => e.cert_status === 'expired').slice(0, 8)} />
        </div>

        <div className="app-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              Expiring Soon (10 days)
            </h3>
            <span className="text-xs text-gray-500">{expiring.filter(e => e.cert_status === 'expiring').length} records</span>
          </div>
          <ExpiringList items={expiring.filter(e => e.cert_status === 'expiring').slice(0, 8)} />
        </div>
      </div>

      <Modal
        open={expiring30ModalOpen}
        onClose={() => setExpiring30ModalOpen(false)}
        title="Expired & Expiring Within 10 Days"
        description="Training certifications that have expired or are expiring within the next 10 days."
        size="xl"
      >
        <DataTable
          columns={certColumns}
          data={expiring30}
          loading={loading}
          emptyMessage="No expired or soon-to-expire certifications found."
          rowClassName={(row) =>
            row.cert_status === 'expired' ? 'bg-red-50 hover:bg-red-100' : ''
          }
        />
      </Modal>
    </Layout>
  );
}
