import { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertTriangle, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { reportsApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EncoderDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.overview(), reportsApi.expiring()])
      .then(([ovRes, exRes]) => {
        setOverview(ovRes.data);
        setExpiring(exRes.data.slice(0, 10));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

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
          <StatCard title="Expiring (30 days)" value={overview?.expiring30 ?? '—'} icon={AlertTriangle} color="amber" />
          <StatCard title="Expired Certs" value={overview?.expiredCerts ?? '—'} icon={XCircle} color="red" />
        </div>
      )}

      <div className="app-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            Certifications Requiring Attention
          </h3>
          <span className="text-xs text-gray-500">{expiring.length} records</span>
        </div>
        {expiring.length === 0 ? (
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
                  <span className="text-xs text-gray-500 mt-1">{item.expiration_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
