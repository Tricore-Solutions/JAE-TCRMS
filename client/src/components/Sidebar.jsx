import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  UserCog, LogOut, Settings, Eye, Shield, Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/training', icon: ClipboardList, label: 'Training Records' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/admin/users', icon: UserCog, label: 'User Management' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
];

const encoderNav = [
  { to: '/encoder/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/encoder/training', icon: ClipboardList, label: 'Training Records' },
  { to: '/encoder/employees', icon: Users, label: 'Employees' },
];

const roleConfig = {
  admin: { nav: adminNav, icon: Shield, label: 'Administrator', color: 'text-red-400' },
  encoder: { nav: encoderNav, icon: Pencil, label: 'Encoder', color: 'text-blue-400' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const config = roleConfig[user?.role] || roleConfig.encoder;
  const RoleIcon = config.icon;

  return (
    <aside className="flex flex-col w-64 bg-slate-900 border-r border-slate-700/50 min-h-screen">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">JAE TCRMS</p>
            <p className="text-xs text-slate-500">JAE Philippines, Inc.</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <RoleIcon size={14} className={config.color} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
            <p className={`text-xs ${config.color} capitalize`}>{config.label}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {config.nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t border-slate-700/50">
          <NavLink
            to="/viewer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Eye size={16} />
            Public Viewer
          </NavLink>
          <button
            onClick={() => {
              localStorage.removeItem('serverUrl');
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings size={16} />
            Server Settings
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
