import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import { useProject } from '../context/ProjectContext';

export default function DefectsPage() {
  const { currentProject } = useProject();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    const { data } = await client.get('/test-executions', { params: { projectId: currentProject.id, pageSize: 100 } });
    setDefects(data.items.filter((e) => e.status === 'Fail'));
    setLoading(false);
  }, [currentProject]);

  useEffect(() => { load(); }, [load]);

  if (!currentProject) return <p>Select a project first.</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Defects</h1>
      <p className="hint">Failed test executions for {currentProject.name}.</p>

      <table className="table">
        <thead><tr><th>Test Case</th><th>Priority</th><th>Comment</th><th>Reported By</th><th>Date</th></tr></thead>
        <tbody>
          {defects.map((d) => (
            <tr key={d.id}>
              <td>{d.testCase?.title}</td>
              <td>{d.testCase?.priority}</td>
              <td>{d.comment || '-'}</td>
              <td>{d.executedBy?.name}</td>
              <td>{new Date(d.executedAt).toLocaleString()}</td>
            </tr>
          ))}
          {defects.length === 0 && (
            <tr><td colSpan={5}>No defects — nothing has failed in this project.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
