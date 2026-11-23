import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, PlayCircle, Bug, Users, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/test-cases', label: 'Test Cases', icon: FlaskConical },
  { to: '/test-suites', label: 'Test Runs', icon: PlayCircle },
  { to: '/defects', label: 'Defects', icon: Bug },
];

export default function Sidebar() {
  const { user } = useAuth();
  const items = user?.role === 'admin'
    ? [...NAV_ITEMS, { to: '/user-management', label: 'User Management', icon: Users }]
    : NAV_ITEMS;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon"><CheckCircle2 size={20} /></span>
        <span>TestDesk</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
