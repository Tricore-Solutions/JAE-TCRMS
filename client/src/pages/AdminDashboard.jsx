import { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertTriangle, XCircle, UserCog, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { reportsApi, trainingsApi } from '../api';
import { useAuth } from '../context/AuthContext';

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
            <span className="text-xs text-gray-500 mt-1">{item.expiration_date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsApi.overview(),
      reportsApi.expiring(),
    ]).then(([ovRes, exRes]) => {
      setOverview(ovRes.data);
      setExpiring(exRes.data);
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
          Here's an overview of your training and certification records.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Active Employees"
            value={overview?.totalEmployees ?? '—'}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Training Records"
            value={overview?.totalTrainings ?? '—'}
            icon={ClipboardList}
            color="green"
          />
          <StatCard
            title="Expiring (30 days)"
            value={overview?.expiring30 ?? '—'}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Expired Certifications"
            value={overview?.expiredCerts ?? '—'}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Expiring (60 days)"
            value={overview?.expiring60 ?? '—'}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="System Users"
            value={overview?.totalUsers ?? '—'}
            icon={UserCog}
            color="blue"
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
              Expiring Soon (60 days)
            </h3>
            <span className="text-xs text-gray-500">{expiring.filter(e => e.cert_status === 'expiring').length} records</span>
          </div>
          <ExpiringList items={expiring.filter(e => e.cert_status === 'expiring').slice(0, 8)} />
        </div>
      </div>
    </Layout>
  );
}
