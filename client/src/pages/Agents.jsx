import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, Wifi, WifiOff, AlertTriangle, Shield, Clock,
  RefreshCw, Search, ChevronRight, Activity, Download, Cpu
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { agentService } from '../services/agentService';
import { useApi } from '../hooks/useApi';
import { mockAgents } from '../utils/mockData';

const statusConfig = {
  online:   { label: 'Protected', color: 'text-primary', dot: 'bg-primary', bg: 'bg-primary/10', border: 'border-primary/25', icon: Wifi },
  degraded: { label: 'Degraded',  color: 'text-warning',  dot: 'bg-warning',  bg: 'bg-warning/10',  border: 'border-warning/25',  icon: AlertTriangle },
  offline:  { label: 'Offline',   color: 'text-text_muted',dot: 'bg-text_muted',bg: 'bg-surface', border: 'border-border',       icon: WifiOff },
};

const riskConfig = {
  HIGH:       { color: 'text-danger',   bg: 'bg-danger/10',   border: 'border-danger/25' },
  SUSPICIOUS: { color: 'text-warning',  bg: 'bg-warning/10',  border: 'border-warning/25' },
  LOW:        { color: 'text-primary',  bg: 'bg-primary/10',  border: 'border-primary/25' },
};

function AgentCard({ agent }) {
  const status = statusConfig[agent.status] || statusConfig.offline;
  const risk = riskConfig[agent.risk_level?.toUpperCase()] || riskConfig.LOW;
  const StatusIcon = status.icon;

  return (
    <div className="group rounded-xl border border-border bg-surface/60 hover:border-primary/25 hover:bg-surface/80 transition-all overflow-hidden shadow-card">
      {/* Card header */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${status.bg} ${status.border} border`}>
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">{agent.hostname || agent.agent_id}</h3>
            <p className="text-xs text-text_muted mt-0.5">{agent.ip_address || 'No IP'}</p>
          </div>
        </div>
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color} ${status.bg} border ${status.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-5" />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 p-5 pb-4">
        <div>
          <p className="text-xs text-text_muted mb-0.5">OS</p>
          <p className="text-xs font-medium text-white truncate">{agent.os || 'Ubuntu Linux'}</p>
        </div>
        <div>
          <p className="text-xs text-text_muted mb-0.5">Agent Version</p>
          <p className="text-xs font-mono text-white">v{agent.version || '1.0.0'}</p>
        </div>
        <div>
          <p className="text-xs text-text_muted mb-0.5">Agent ID</p>
          <p className="text-xs font-mono text-accent truncate">{agent.agent_id}</p>
        </div>
        <div>
          <p className="text-xs text-text_muted mb-0.5">Threats Detected</p>
          <p className={`text-xs font-bold font-mono ${agent.threat_count > 0 ? 'text-orange-400' : 'text-primary'}`}>
            {agent.threat_count ?? 0}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background/20">
        <div className="flex items-center gap-1.5 text-xs text-text_muted">
          <Clock className="h-3.5 w-3.5" />
          {(agent.last_seen || agent.last_heartbeat)
            ? formatDistanceToNow(new Date(agent.last_seen || agent.last_heartbeat), { addSuffix: true })
            : 'Unknown'}
        </div>
        <div className="flex items-center gap-2">
          {/* Risk pill */}
          {agent.risk_level && (
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${risk.color} ${risk.bg} border ${risk.border}`}>
              {agent.risk_level}
            </span>
          )}
          <Link
            to={`/dashboard/agent/${agent.agent_id}`}
            className="flex items-center gap-1 text-xs text-text_muted hover:text-primary transition-colors"
          >
            Details <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Agents = () => {
  const { data: agentsRaw, execute: fetchAgents, loading } = useApi(agentService.getAgents);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchAgents().catch(() => {}); }, []);

  const agents = agentsRaw ?? mockAgents;

  const filtered = agents.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      (a.hostname || '').toLowerCase().includes(q) ||
      (a.agent_id || '').toLowerCase().includes(q) ||
      (a.ip_address || '').toLowerCase().includes(q)
    );
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const online = agents.filter(a => a.status === 'online').length;
  const offline = agents.filter(a => a.status === 'offline').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Endpoints</h1>
          <p className="text-sm text-text_muted mt-0.5">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} · {online} online · {offline} offline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAgents().catch(()=>{})}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text_muted hover:text-white border border-border hover:border-border-bright rounded-lg transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/dashboard/download-agent"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background text-xs font-bold rounded-lg hover:bg-primary_dark transition-colors shadow-glow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Deploy Agent
          </Link>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: agents.length, color: 'text-white', bg: 'bg-surface/60' },
          { label: 'Protected', value: online, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
          { label: 'Offline', value: offline, color: 'text-text_muted', bg: 'bg-surface/60' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border border-border ${s.bg} text-center`}>
            <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-text_muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text_muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hostname, IP, agent ID..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface/60 border border-border rounded-xl text-white placeholder:text-text_muted focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm bg-surface/60 border border-border rounded-xl text-text_muted focus:outline-none focus:border-primary/40 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="online">Online</option>
          <option value="degraded">Degraded</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Server className="h-12 w-12 text-text_muted mx-auto mb-4 opacity-30" />
          <p className="text-text_muted mb-4">
            {agents.length === 0 ? 'No agents deployed yet.' : 'No agents match your filters.'}
          </p>
          {agents.length === 0 && (
            <Link
              to="/dashboard/download-agent"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-background text-sm font-bold rounded-xl hover:bg-primary_dark transition-colors shadow-glow"
            >
              <Download className="h-4 w-4" /> Deploy your first agent
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => <AgentCard key={a.id || a.agent_id} agent={a} />)}
        </div>
      )}
    </div>
  );
};
