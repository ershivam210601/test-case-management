import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

export default function TestSuitesPage() {
  const { permissions } = useAuth();
  const { currentProject } = useProject();
  const [suites, setSuites] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await client.get('/test-suites', { params: { projectId: currentProject.id } });
    setSuites(data);
  }, [currentProject]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    await client.post('/test-suites', { projectId: currentProject.id, name, description, testCaseIds: [] });
    setName('');
    setDescription('');
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this suite?')) return;
    await client.delete(`/test-suites/${id}`);
    load();
  }

  if (!currentProject) return <p>Select a project first.</p>;

  return (
    <div className="page">
      <h1>Test Suites</h1>

      {permissions.manageTestCases && (
        <form className="form-inline" onSubmit={handleCreate}>
          <input placeholder="Suite name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" className="btn">Create Suite</button>
        </form>
      )}

      <table className="table">
        <thead><tr><th>Name</th><th>Description</th><th># Cases</th><th>Actions</th></tr></thead>
        <tbody>
          {suites.map((s) => (
            <tr key={s.id}>
              <td><Link to={`/test-suites/${s.id}`}>{s.name}</Link></td>
              <td>{s.description}</td>
              <td>{s.cases.length}</td>
              <td>
                {permissions.manageTestCases && (
                  <button type="button" onClick={() => handleDelete(s.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
