import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

const ROLE_LABELS = { admin: 'Admin', test_lead: 'Test Lead', tester: 'Tester', read_only: 'Read Only' };

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projects, currentProject, selectProject } = useProject();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  if (!user) return null;

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input
          placeholder="Search test cases, runs, or defects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        <select
          className="project-select"
          value={currentProject?.id || ''}
          onChange={(e) => selectProject(projects.find((p) => p.id === e.target.value))}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button type="button" className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button type="button" className="icon-btn" title="Notifications">
          <Bell size={18} />
        </button>

        <div className="profile-menu">
          <button type="button" className="profile-trigger" onClick={toggleMenu}>
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="profile-info">
              <strong>{user.name}</strong>
              <small>{ROLE_LABELS[user.role]}</small>
            </span>
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              {user.role === 'admin' && (
                <button type="button" onClick={() => { setMenuOpen(false); navigate('/user-management'); }}>User Management</button>
              )}
              <button type="button" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
