import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, PlayCircle, Bug, BarChart3, Settings, CheckCircle2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/test-cases', label: 'Test Cases', icon: FlaskConical },
  { to: '/test-suites', label: 'Test Runs', icon: PlayCircle },
  { to: '/defects', label: 'Defects', icon: Bug },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon"><CheckCircle2 size={20} /></span>
        <span>TestDesk</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
