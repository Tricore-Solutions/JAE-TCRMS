import { Shield, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleConfig = {
  admin: { icon: Shield, label: 'Administrator', color: 'text-red-600' },
  encoder: { icon: Pencil, label: 'Encoder', color: 'text-[#1D72B8]' },
};

export default function Navbar() {
  const { user } = useAuth();
  const config = roleConfig[user?.role] || roleConfig.encoder;
  const RoleIcon = config.icon;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-4 min-w-0">
        <img
          src="/jae-logo.png"
          alt="JAE"
          className="h-10 w-auto object-contain flex-shrink-0"
        />
        <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
          Training &amp; Certifications Management
        </h1>
      </div>
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex-shrink-0 ml-4">
        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
          <RoleIcon size={14} className={config.color} />
        </div>
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || user?.username}</p>
          <p className={`text-xs ${config.color}`}>{config.label}</p>
        </div>
      </div>
    </header>
  );
}
