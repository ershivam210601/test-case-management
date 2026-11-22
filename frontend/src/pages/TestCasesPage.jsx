import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  FlaskConical, CheckCircle2, XCircle, Clock, X, Play, Pencil, ChevronRight, List, LayoutGrid,
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const TYPES = ['Functional', 'Integration', 'Regression', 'Smoke', 'UI', 'API'];
const EXEC_STATUSES = ['Pass', 'Fail', 'Blocked', 'Skipped'];
const STATUS_COLORS = { Pass: '#22c55e', Fail: '#ef4444', Blocked: '#f59e0b', Skipped: '#94a3b8' };
const PRIORITY_COLORS = { Low: '#60a5fa', Medium: '#34d399', High: '#fb923c', Critical: '#f87171' };
const PAGE_SIZE = 5;

function StatusBadge({ status }) {
  const label = status || 'Not Run';
  return <span className={`badge badge-${(status || 'none').toLowerCase()}`}>{label}</span>;
}

export default function TestCasesPage() {
  const { permissions, user } = useAuth();
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');
  const [tab, setTab] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [analytics, setAnalytics] = useState(null);
  const [latestStatusByCase, setLatestStatusByCase] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [executeStatus, setExecuteStatus] = useState('Pass');
  const [executeComment, setExecuteComment] = useState('');
  const [showExecuteForm, setShowExecuteForm] = useState(false);

  const fetchTestCases = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await client.get('/test-cases', {
      params: {
        projectId: currentProject.id,
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        priority: priority || undefined,
        type: type || undefined,
        assignedToId: tab === 'mine' ? user.id : undefined,
      },
    });
    setItems(data.items);
    setTotal(data.total);
  }, [currentProject, page, search, priority, type, tab, user.id]);

  const fetchAnalytics = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await client.get(`/analytics/${currentProject.id}`);
    setAnalytics(data);
  }, [currentProject]);

  const fetchLatestStatuses = useCallback(async () => {
    if (!currentProject) return;
    const { data } = await client.get('/test-executions', { params: { projectId: currentProject.id, pageSize: 200 } });
    const map = {};
    data.items.forEach((e) => {
      if (!map[e.testCaseId] || new Date(e.executedAt) > new Date(map[e.testCaseId].executedAt)) {
        map[e.testCaseId] = e;
      }
    });
    setLatestStatusByCase(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.status])));
  }, [currentProject]);

  useEffect(() => { fetchTestCases(); }, [fetchTestCases]);
  useEffect(() => { fetchAnalytics(); fetchLatestStatuses(); }, [fetchAnalytics, fetchLatestStatuses]);

  const loadDetail = useCallback(async (id) => {
    setSelectedId(id);
    setShowExecuteForm(false);
    const { data } = await client.get(`/test-cases/${id}`);
    setSelectedCase(data);
    const { data: execData } = await client.get('/test-executions', { params: { testCaseId: id } });
    setExecutions(execData.items);
  }, []);

  async function handleExecute(e) {
    e.preventDefault();
    await client.post('/test-executions', { testCaseId: selectedId, status: executeStatus, comment: executeComment });
    setExecuteComment('');
    setShowExecuteForm(false);
    loadDetail(selectedId);
    fetchLatestStatuses();
    fetchAnalytics();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this test case?')) return;
    await client.delete(`/test-cases/${id}`);
    if (selectedId === id) setSelectedId(null);
    fetchTestCases();
  }

  const totalPages = useMemo(() => Math.max(Math.ceil(total / PAGE_SIZE), 1), [total]);

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return analytics.statusCounts.map((s) => ({ name: s.status, value: s._count._all }));
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics) return [];
    return analytics.priorityCounts.map((p) => ({ name: p.priority, value: p._count._all }));
  }, [analytics]);

  const trendData = useMemo(() => {
    if (!analytics) return [];
    const byDay = {};
    analytics.executions.forEach((e) => {
      const day = e.executedAt.slice(5, 10);
      byDay[day] = byDay[day] || { day, Executed: 0 };
      byDay[day].Executed += 1;
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(-7);
  }, [analytics]);

  const passCount = useMemo(() => analytics?.statusCounts.find((s) => s.status === 'Pass')?._count._all || 0, [analytics]);
  const failCount = useMemo(() => analytics?.statusCounts.find((s) => s.status === 'Fail')?._count._all || 0, [analytics]);
  const blockedCount = useMemo(() => analytics?.statusCounts.find((s) => s.status === 'Blocked')?._count._all || 0, [analytics]);

  if (!currentProject) return <p>Select a project first.</p>;

  return (
    <div className="page tc-page">
      <div className="page-header">
        <div>
          <h1>Test Case Management</h1>
          <p className="hint">Manage and track your test cases, executions and quality</p>
        </div>
        {permissions.manageTestCases && (
          <button type="button" className="btn" onClick={() => navigate('/test-cases/new')}>+ Add Test Case</button>
        )}
      </div>

      <div className="stat-tiles">
        <div className="stat-tile stat-icon-indigo"><FlaskConical size={20} /><span>{analytics?.totalTestCases ?? '-'}</span><label>Total Test Cases</label></div>
        <div className="stat-tile stat-icon-green"><CheckCircle2 size={20} /><span>{passCount}</span><label>Passed</label></div>
        <div className="stat-tile stat-icon-red"><XCircle size={20} /><span>{failCount}</span><label>Failed</label></div>
        <div className="stat-tile stat-icon-blue"><Clock size={20} /><span>{blockedCount}</span><label>Blocked</label></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Execution Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
                {statusData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8884d8'} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Execution Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Executed" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>By Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
                {priorityData.map((entry) => <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#8884d8'} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="tabs-row">
        <button type="button" className={`tab-btn${tab === 'all' ? ' active' : ''}`} onClick={() => { setTab('all'); setPage(1); }}>All ({total})</button>
        <button type="button" className={`tab-btn${tab === 'mine' ? ' active' : ''}`} onClick={() => { setTab('mine'); setPage(1); }}>Assigned to me</button>

        <select value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Search test cases..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />

        <div className="view-toggle">
          <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={16} /></button>
          <button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div className={selectedId ? 'tc-body with-panel' : 'tc-body'}>
        <div className="tc-main">
          {viewMode === 'list' ? (
            <table className="table">
              <thead>
                <tr><th>#</th><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Updated</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map((tc, i) => (
                  <tr key={tc.id} className={selectedId === tc.id ? 'row-selected' : ''}>
                    <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td><button type="button" className="link-btn" onClick={() => loadDetail(tc.id)}>{tc.title}</button></td>
                    <td>{tc.type}</td>
                    <td><span className={`badge badge-priority-${tc.priority.toLowerCase()}`}>{tc.priority}</span></td>
                    <td><StatusBadge status={latestStatusByCase[tc.id]} /></td>
                    <td>{tc.assignedTo?.name || '—'}</td>
                    <td>{new Date(tc.updatedAt || tc.createdAt).toLocaleDateString()}</td>
                    <td className="row-actions">
                      {permissions.execute && <button type="button" title="Run" onClick={() => loadDetail(tc.id)}><Play size={14} /></button>}
                      {permissions.manageTestCases && <button type="button" title="Edit" onClick={() => navigate(`/test-cases/${tc.id}/edit`)}><Pencil size={14} /></button>}
                      <button type="button" title="Details" onClick={() => loadDetail(tc.id)}><ChevronRight size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="tc-grid">
              {items.map((tc) => (
                <button type="button" key={tc.id} className="tc-card" onClick={() => loadDetail(tc.id)}>
                  <span className={`badge badge-priority-${tc.priority.toLowerCase()}`}>{tc.priority}</span>
                  <h4>{tc.title}</h4>
                  <p>{tc.type}</p>
                  <StatusBadge status={latestStatusByCase[tc.id]} />
                </button>
              ))}
            </div>
          )}

          <div className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}-{Math.min(page * PAGE_SIZE, total)} of {total}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>

        {selectedId && selectedCase && (
          <aside className="tc-panel">
            <div className="tc-panel-header">
              <h3>Test Case Details</h3>
              <button type="button" className="icon-btn" onClick={() => setSelectedId(null)}><X size={18} /></button>
            </div>

            <span className="badge">{selectedCase.id.slice(0, 8)}</span>
            <h2>{selectedCase.title}</h2>
            <p>{selectedCase.description}</p>

            <div className="tc-panel-row">
              <label>Type</label>
              <span className="badge">{selectedCase.type}</span>
            </div>
            <div className="tc-panel-row">
              <label>Priority</label>
              <span className={`badge badge-priority-${selectedCase.priority.toLowerCase()}`}>{selectedCase.priority}</span>
            </div>

            <h4>Preconditions</h4>
            <p>{selectedCase.preconditions || '—'}</p>

            <h4>Test Steps</h4>
            <ol>
              {selectedCase.steps.map((s) => <li key={s.id}>{s.action} <em>&rarr; {s.expectedResult}</em></li>)}
            </ol>

            <h4>Assigned To</h4>
            <p>{selectedCase.assignedTo?.name || 'Unassigned'}</p>

            <h4>Last Updated</h4>
            <p>{new Date(selectedCase.updatedAt).toLocaleString()}</p>

            {permissions.execute && (
              <div className="tc-panel-actions">
                {!showExecuteForm ? (
                  <button type="button" className="btn" onClick={() => setShowExecuteForm(true)}><Play size={14} /> Run Test</button>
                ) : (
                  <form className="form" onSubmit={handleExecute}>
                    <select value={executeStatus} onChange={(e) => setExecuteStatus(e.target.value)}>
                      {EXEC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea placeholder="Comment" value={executeComment} onChange={(e) => setExecuteComment(e.target.value)} />
                    <button type="submit" className="btn">Record Result</button>
                  </form>
                )}
                {permissions.manageTestCases && (
                  <button type="button" onClick={() => navigate(`/test-cases/${selectedId}/edit`)}><Pencil size={14} /> Edit</button>
                )}
              </div>
            )}

            <h4>Execution History</h4>
            <table className="table">
              <tbody>
                {executions.map((e) => (
                  <tr key={e.id}>
                    <td><StatusBadge status={e.status} /></td>
                    <td>{e.executedBy?.name}</td>
                    <td>{new Date(e.executedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>
        )}
      </div>
    </div>
  );
}
