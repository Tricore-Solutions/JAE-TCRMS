import { useState, useEffect } from 'react';
import { Users, AlertTriangle, BadgeCheck } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

const expiringColumns = [
  {
    key: 'full_name',
    label: 'Employee',
    render: (v, row) => (
      <div>
        <p className="text-gray-900 font-medium text-sm">{v}</p>
        <p className="text-xs text-gray-500">{row.emp_code}</p>
      </div>
    ),
  },
  { key: 'title', label: 'Training Title' },
  { key: 'factory', label: 'Factory', render: (v) => v || '—' },
  { key: 'line', label: 'Line', render: (v) => v || '—' },
  { key: 'team', label: 'Team', render: (v) => v || '—' },
  {
    key: 'expiration_date',
    label: 'Expiration',
    render: (v) => <span className="whitespace-nowrap text-amber-700 font-medium">{formatDate(v)}</span>,
  },
  {
    key: 'cert_status',
    label: 'Status',
    render: (v) => <StatusBadge status={v} />,
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.overview(),
      reportsApi.expiring({ days: 10 }),
    ]).then(([ovRes, exRes]) => {
      setOverview(ovRes.data);
      setExpiringSoon((exRes.data || []).filter((e) => e.cert_status === 'expiring'));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{greeting}, {user?.full_name}</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Here&apos;s an overview of your training and certification records.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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
        </div>
      )}

      <div className="app-panel p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            Expiring Soon (10 days)
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {loading ? '…' : `${expiringSoon.length} record${expiringSoon.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <DataTable
          columns={expiringColumns}
          data={expiringSoon}
          loading={loading}
          emptyMessage="No expiring certifications."
          pageSize={12}
          pageSizeOptions={[12, 25, 50]}
          defaultSort={{ key: 'expiration_date', dir: 'asc' }}
          rowClassName={() => 'bg-amber-50/40 hover:bg-amber-50'}
        />
      </div>
    </Layout>
  );
}
