import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  UserCog, LogOut, Settings, Eye
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
  admin: { nav: adminNav },
  encoder: { nav: encoderNav },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const config = roleConfig[user?.role] || roleConfig.encoder;

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {config.nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1D72B8] text-white'
                  : 'text-gray-600 hover:text-[#1D72B8] hover:bg-blue-50'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t border-gray-200">
          <NavLink
            to="/viewer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1D72B8] hover:bg-blue-50 transition-colors"
          >
            <Eye size={16} />
            Public Viewer
          </NavLink>
          <button
            onClick={() => {
              localStorage.removeItem('serverUrl');
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1D72B8] hover:bg-blue-50 transition-colors"
          >
            <Settings size={16} />
            Server Settings
          </button>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
