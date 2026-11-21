import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Pass', 'Fail', 'Blocked', 'Skipped'];

export default function TestCaseDetailPage() {
  const { id } = useParams();
  const { permissions } = useAuth();
  const [testCase, setTestCase] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [status, setStatus] = useState('Pass');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const { data } = await client.get(`/test-cases/${id}`);
    setTestCase(data);
    const { data: execData } = await client.get('/test-executions', { params: { testCaseId: id } });
    setExecutions(execData.items);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleExecute(e) {
    e.preventDefault();
    await client.post('/test-executions', { testCaseId: id, status, comment });
    setComment('');
    setMessage('Result recorded.');
    load();
  }

  if (!testCase) return <p>Loading...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{testCase.title}</h1>
        {permissions.manageTestCases && <Link className="btn" to={`/test-cases/${id}/edit`}>Edit</Link>}
      </div>

      <p><strong>Priority:</strong> {testCase.priority} · <strong>Type:</strong> {testCase.type}</p>
      <p>{testCase.description}</p>
      <p><strong>Pre-conditions:</strong> {testCase.preconditions}</p>
      <p><strong>Post-conditions:</strong> {testCase.postconditions}</p>
      <p><strong>Tags:</strong> {(testCase.tags || []).join(', ')}</p>

      <h3>Steps</h3>
      <ol>
        {testCase.steps.map((s) => (
          <li key={s.id}>{s.action} <em>&rarr; {s.expectedResult}</em></li>
        ))}
      </ol>

      {permissions.execute && (
        <>
          <h3>Execute Test</h3>
          <form className="form" onSubmit={handleExecute}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button type="submit" className="btn">Record Result</button>
          </form>
          {message && <p>{message}</p>}
        </>
      )}

      <h3>Execution History</h3>
      <table className="table">
        <thead><tr><th>Status</th><th>Comment</th><th>Executed By</th><th>Date</th></tr></thead>
        <tbody>
          {executions.map((e) => (
            <tr key={e.id}>
              <td>{e.status}</td>
              <td>{e.comment}</td>
              <td>{e.executedBy?.name}</td>
              <td>{new Date(e.executedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
