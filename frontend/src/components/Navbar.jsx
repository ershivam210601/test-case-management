import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';

const ROLE_LABELS = { admin: 'Admin', test_lead: 'Test Lead', tester: 'Tester', read_only: 'Read Only' };

export default function Navbar() {
  const { user, logout, permissions } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { projects, currentProject, selectProject } = useProject();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/test-cases">Test Cases</Link>
        <Link to="/test-suites">Test Suites</Link>
        {permissions.manageProjects && <Link to="/projects">Projects</Link>}
        {permissions.manageUsers && <Link to="/users">Users</Link>}
      </div>
      <div className="navbar-right">
        <select
          value={currentProject?.id || ''}
          onChange={(e) => selectProject(projects.find((p) => p.id === e.target.value))}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button type="button" onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'} mode</button>
        <span>{user.name} ({ROLE_LABELS[user.role]})</span>
        <button type="button" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
      </div>
    </nav>
  );
}
