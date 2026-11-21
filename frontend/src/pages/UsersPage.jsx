import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';

const ROLES = ['admin', 'test_lead', 'tester', 'read_only'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    const { data } = await client.get('/users');
    setUsers(data);
  }, []);

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
      <h1>Users</h1>
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
    </div>
  );
}
