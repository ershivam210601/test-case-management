import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ROLES = ['admin', 'test_lead', 'tester', 'read_only'];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    if (user.role !== 'admin') return;
    const { data } = await client.get('/users');
    setUsers(data);
  }, [user.role]);

  useEffect(() => { load(); }, [load]);

  async function handleRoleChange(id, role) {
    await client.patch(`/users/${id}`, { role });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    await client.delete(`/users/${id}`);
    load();
  }

  return (
    <div className="page">
      <h1>Settings</h1>

      <div className="chart-card" style={{ maxWidth: 420 }}>
        <h3>Profile</h3>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <button type="button" onClick={toggleTheme}>Switch to {theme === 'light' ? 'dark' : 'light'} mode</button>
      </div>

      {user.role === 'admin' && (
        <>
          <h3>User Management</h3>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><button type="button" onClick={() => handleDelete(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
