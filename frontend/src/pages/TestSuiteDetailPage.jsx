import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

export default function TestSuiteDetailPage() {
  const { id } = useParams();
  const { permissions } = useAuth();
  const { currentProject } = useProject();
  const [suite, setSuite] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');

  const load = useCallback(async () => {
    const { data } = await client.get(`/test-suites/${id}`);
    setSuite(data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!currentProject) return;
    client.get('/test-cases', { params: { projectId: currentProject.id, pageSize: 100 } })
      .then(({ data }) => setAllCases(data.items));
  }, [currentProject]);

  const availableCases = useMemo(() => {
    if (!suite) return [];
    const existingIds = new Set(suite.cases.map((c) => c.testCaseId));
    return allCases.filter((tc) => !existingIds.has(tc.id));
  }, [allCases, suite]);

  async function handleAddCase() {
    if (!selectedCaseId) return;
    await client.post(`/test-suites/${id}/cases`, { testCaseId: selectedCaseId });
    setSelectedCaseId('');
    load();
  }

  async function handleRemoveCase(testCaseId) {
    await client.delete(`/test-suites/${id}/cases/${testCaseId}`);
    load();
  }

  async function handleQuickExecute(testCaseId, status) {
    await client.post('/test-executions', { testCaseId, suiteId: id, status });
    load();
  }

  if (!suite) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>{suite.name}</h1>
      <p>{suite.description}</p>

      {permissions.manageTestCases && (
        <div className="form-inline">
          <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            <option value="">Add a test case...</option>
            {availableCases.map((tc) => <option key={tc.id} value={tc.id}>{tc.title}</option>)}
          </select>
          <button type="button" className="btn" onClick={handleAddCase}>Add to Suite</button>
        </div>
      )}

      <table className="table">
        <thead><tr><th>Test Case</th><th>Priority</th><th>Actions</th></tr></thead>
        <tbody>
          {suite.cases.map(({ testCase }) => (
            <tr key={testCase.id}>
              <td>{testCase.title}</td>
              <td>{testCase.priority}</td>
              <td>
                {permissions.execute && (
                  <>
                    <button type="button" onClick={() => handleQuickExecute(testCase.id, 'Pass')}>Pass</button>
                    <button type="button" onClick={() => handleQuickExecute(testCase.id, 'Fail')}>Fail</button>
                  </>
                )}
                {permissions.manageTestCases && (
                  <button type="button" onClick={() => handleRemoveCase(testCase.id)}>Remove</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
