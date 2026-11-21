import { useEffect, useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import client from '../api/client';
import { useProject } from '../context/ProjectContext';

const STATUS_COLORS = { Pass: '#22c55e', Fail: '#ef4444', Blocked: '#f59e0b', Skipped: '#94a3b8' };
const PRIORITY_COLORS = { Low: '#60a5fa', Medium: '#34d399', High: '#fb923c', Critical: '#f87171' };

export default function DashboardPage() {
  const { currentProject } = useProject();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    client.get(`/analytics/${currentProject.id}`)
      .then(({ data }) => setAnalytics(data))
      .finally(() => setLoading(false));
  }, [currentProject]);

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return analytics.statusCounts.map((s) => ({ name: s.status, value: s._count._all }));
  }, [analytics]);

  const priorityData = useMemo(() => {
    if (!analytics) return [];
    return analytics.priorityCounts.map((p) => ({ name: p.priority, count: p._count._all }));
  }, [analytics]);

  const trendData = useMemo(() => {
    if (!analytics) return [];
    const byDay = {};
    analytics.executions.forEach((e) => {
      const day = e.executedAt.slice(0, 10);
      byDay[day] = byDay[day] || { day, Pass: 0, Fail: 0, Blocked: 0, Skipped: 0 };
      byDay[day][e.status] += 1;
    });
    return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
  }, [analytics]);

  const passRate = useMemo(() => {
    if (!analytics) return 0;
    const total = analytics.statusCounts.reduce((sum, s) => sum + s._count._all, 0);
    const passed = analytics.statusCounts.find((s) => s.status === 'Pass')?._count._all || 0;
    return total ? Math.round((passed / total) * 100) : 0;
  }, [analytics]);

  if (!currentProject) return <p>Select a project to view its dashboard.</p>;
  if (loading) return <p>Loading analytics...</p>;
  if (!analytics) return null;

  return (
    <div className="dashboard">
      <h1>Dashboard - {currentProject.name}</h1>
      <div className="stat-tiles">
        <div className="stat-tile"><span>{analytics.totalTestCases}</span><label>Total Test Cases</label></div>
        <div className="stat-tile"><span>{passRate}%</span><label>Pass Rate</label></div>
        <div className="stat-tile"><span>{analytics.executions.length}</span><label>Total Executions</label></div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Test Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Execution Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Pass" stroke={STATUS_COLORS.Pass} />
              <Line type="monotone" dataKey="Fail" stroke={STATUS_COLORS.Fail} />
              <Line type="monotone" dataKey="Blocked" stroke={STATUS_COLORS.Blocked} />
              <Line type="monotone" dataKey="Skipped" stroke={STATUS_COLORS.Skipped} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Test Case Distribution by Priority</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count">
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
