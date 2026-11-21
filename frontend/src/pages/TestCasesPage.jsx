import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TYPES = ['Functional', 'Integration', 'Regression', 'Smoke', 'UI', 'API'];

export default function TestCasesPage() {
  const { permissions } = useAuth();
  const { currentProject } = useProject();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const pageSize = 10;

  const fetchTestCases = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await client.get('/test-cases', {
      params: { projectId: currentProject.id, page, pageSize, search: search || undefined, priority: priority || undefined, type: type || undefined },
    });
    setItems(data.items);
    setTotal(data.total);
  }, [currentProject, page, search, priority, type]);

  useEffect(() => { fetchTestCases(); }, [fetchTestCases]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this test case?')) return;
    await client.delete(`/test-cases/${id}`);
    fetchTestCases();
  }

  if (!currentProject) return <p>Select a project first.</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Test Cases</h1>
        {permissions.manageTestCases && <Link className="btn" to="/test-cases/new">+ New Test Case</Link>}
      </div>

      <div className="filters">
        <input placeholder="Search..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <select value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Title</th><th>Priority</th><th>Type</th><th>Tags</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((tc) => (
            <tr key={tc.id}>
              <td><Link to={`/test-cases/${tc.id}`}>{tc.title}</Link></td>
              <td>{tc.priority}</td>
              <td>{tc.type}</td>
              <td>{(tc.tags || []).join(', ')}</td>
              <td>
                {permissions.manageTestCases && (
                  <button type="button" onClick={() => handleDelete(tc.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
