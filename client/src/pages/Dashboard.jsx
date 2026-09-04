import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, ShieldAlert, Activity, Shield, AlertTriangle,
  ChevronRight, Clock, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { agentService } from '../services/agentService';
import { attackService } from '../services/attackService';
import { useApi } from '../hooks/useApi';
import { mockAgents, mockAttacks, mockChartData, mockDonutData } from '../utils/mockData';

/* ── severity helpers ─────────────────────────────────────── */
const SEV = {
  CRITICAL: { color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25' },
  HIGH:     { color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  SUSPICIOUS:{ color: 'text-purple-400', dot: 'bg-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
  MEDIUM:   { color: 'text-warning', dot: 'bg-warning', bg: 'bg-warning/10', border: 'border-warning/25' },
  LOW:      { color: 'text-accent', dot: 'bg-accent', bg: 'bg-accent/10', border: 'border-accent/25' },
  RESOLVED: { color: 'text-primary', dot: 'bg-primary', bg: 'bg-primary/10', border: 'border-primary/25' },
};

function SevBadge({ severity }) {
  const s = SEV[severity?.toUpperCase()] || SEV.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold ${s.color} ${s.bg} border ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, bg }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface/60">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-text_muted uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className={`text-3xl font-black font-mono ${color} mb-1`}>{value}</div>
      {sub && <p className="text-xs text-text_muted">{sub}</p>}
    </div>
  );
}

const CHART_COLORS = { critical: '#dc2626', high: '#f97316', suspicious: '#a78bfa', resolved: '#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border-bright/30 rounded-xl p-3 text-xs shadow-panel">
      <p className="font-mono text-text_muted mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white capitalize">{p.name}</span>
          <span className="ml-auto font-mono text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const { data: agentsRaw, execute: fetchAgents, loading: loadingAgents } = useApi(agentService.getAgents);
  const { data: attacksRaw, execute: fetchAttacks, loading: loadingAttacks } = useApi(attackService.getAttacks);

  useEffect(() => {
    fetchAgents().catch(() => {});
    fetchAttacks().catch(() => {});
  }, []);

  // Fall back to mock data when backend is unavailable
  const agents = agentsRaw ?? mockAgents;
  const attacks = attacksRaw ?? mockAttacks;

  const stats = useMemo(() => {
    const online = agents.filter(a => a.status === 'online').length;
    const yesterday = subDays(new Date(), 1);
    const today = attacks.filter(a => isAfter(new Date(a.timestamp), yesterday));
    const high = attacks.filter(a => ['HIGH','CRITICAL'].includes(a.severity?.toUpperCase()));
    return { total: agents.length, online, todayCount: today.length, highRisk: high.length };
  }, [agents, attacks]);

  // Chart: last 7 days grouped by severity
  const chartData = useMemo(() => {
    if (attacksRaw) {
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = startOfDay(subDays(new Date(), 6 - i));
        return { date: format(d, 'EEE'), rawDate: d, critical: 0, high: 0, suspicious: 0, resolved: 0 };
      });
      attacks.forEach(a => {
        const d = format(startOfDay(new Date(a.timestamp)), 'EEE');
        const day = days.find(x => x.date === d);
        if (!day) return;
        const sev = (a.severity || '').toLowerCase();
        if (sev === 'critical') day.critical++;
        else if (sev === 'high') day.high++;
        else if (sev === 'suspicious') day.suspicious++;
        else day.resolved++;
      });
      return days;
    }
    return mockChartData;
  }, [attacks, attacksRaw]);

  // Donut data
  const donutData = useMemo(() => {
    if (attacksRaw) {
      const counts = { Critical: 0, High: 0, Suspicious: 0, Resolved: 0 };
      attacks.forEach(a => {
        const s = a.severity?.toLowerCase();
        if (s === 'critical') counts.Critical++;
        else if (s === 'high') counts.High++;
        else if (s === 'suspicious' || s === 'medium') counts.Suspicious++;
        else counts.Resolved++;
      });
      return [
        { name: 'Critical', value: counts.Critical, color: '#dc2626' },
        { name: 'High', value: counts.High, color: '#f97316' },
        { name: 'Suspicious', value: counts.Suspicious, color: '#a78bfa' },
        { name: 'Resolved', value: counts.Resolved, color: '#10b981' },
      ].filter(d => d.value > 0);
    }
    return mockDonutData;
  }, [attacks, attacksRaw]);

  const recentAttacks = [...attacks]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);

  const loading = loadingAgents || loadingAttacks;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Security Overview</h1>
          <p className="text-sm text-text_muted mt-0.5">Real-time endpoint monitoring and threat intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          {!agentsRaw && (
            <span className="text-xs font-mono text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-lg">
              Demo data — connect backend
            </span>
          )}
          <button
            onClick={() => { fetchAgents().catch(()=>{}); fetchAttacks().catch(()=>{}); }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text_muted hover:text-white border border-border hover:border-border-bright rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Endpoints" value={stats.total} sub={`${stats.online} online`} icon={Server} color="text-accent" bg="bg-accent/10" />
        <StatCard title="Active Endpoints" value={stats.online} sub={`${stats.total > 0 ? Math.round(stats.online/stats.total*100) : 0}% coverage`} icon={Activity} color="text-primary" bg="bg-primary/10" />
        <StatCard title="Attacks Today" value={stats.todayCount} sub="Last 24 hours" icon={ShieldAlert} color="text-warning" bg="bg-warning/10" />
        <StatCard title="High Risk" value={stats.highRisk} sub="Requires attention" icon={AlertTriangle} color="text-danger" bg="bg-danger/10" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-surface/60">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Attack Activity — 7 Days</h2>
            <div className="flex items-center gap-3">
              {Object.entries(CHART_COLORS).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                  <span className="text-xs text-text_muted capitalize">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barSize={8} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="critical" stackId="a" fill="#dc2626" />
                <Bar dataKey="high" stackId="a" fill="#f97316" />
                <Bar dataKey="suspicious" stackId="a" fill="#a78bfa" />
                <Bar dataKey="resolved" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="p-5 rounded-xl border border-border bg-surface/60">
          <h2 className="text-sm font-semibold text-white mb-5">Threat Distribution</h2>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-text_muted">{d.name}</span>
                </div>
                <span className="text-xs font-mono text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent attacks + Endpoint status */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent attacks table */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-surface/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Recent Attacks</h2>
            <Link to="/dashboard/attacks" className="text-xs text-primary hover:text-primary_dark flex items-center gap-1 transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentAttacks.length === 0 ? (
              <div className="p-8 text-center text-text_muted text-sm">No attack events yet.</div>
            ) : recentAttacks.map((a) => {
              const s = SEV[a.severity?.toUpperCase()] || SEV.LOW;
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold ${s.color}`}>{a.severity}</span>
                      <span className="text-xs text-white truncate">{a.title || a.technique}</span>
                    </div>
                    <div className="text-xs text-text_muted">
                      {a.hostname || a.agent_id}
                    </div>
                  </div>
                  <div className="text-xs text-text_muted flex-shrink-0 text-right">
                    <div className="font-mono">{a.action_taken}</div>
                    <div className="mt-0.5 flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {format(new Date(a.timestamp), 'MMM d, HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Endpoint health */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-white">Endpoint Health</h2>
            <Link to="/dashboard/agents" className="text-xs text-primary hover:text-primary_dark flex items-center gap-1 transition-colors">
              Manage <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {agents.slice(0, 8).map((a) => {
              const isOnline = a.status === 'online';
              const isDegraded = a.status === 'degraded';
              const statusColor = isOnline ? 'text-primary' : isDegraded ? 'text-warning' : 'text-text_muted';
              const dotColor = isOnline ? 'bg-primary' : isDegraded ? 'bg-warning' : 'bg-text_muted';
              const statusLabel = isOnline ? 'Protected' : isDegraded ? 'Degraded' : 'Offline';
              return (
                <div key={a.id || a.agent_id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-text_muted flex-shrink-0" />
                    )}
                    <span className="text-xs font-mono text-white truncate">{a.hostname || a.agent_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${isOnline ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {agents.length === 0 && (
            <div className="p-8 text-center">
              <Shield className="h-8 w-8 text-text_muted mx-auto mb-2" />
              <p className="text-xs text-text_muted">No agents deployed yet.</p>
              <Link to="/dashboard/download-agent" className="text-xs text-primary mt-2 inline-block hover:underline">
                Deploy your first agent →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
