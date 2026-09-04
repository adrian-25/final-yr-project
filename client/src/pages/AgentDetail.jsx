import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Server, ChevronLeft, Wifi, WifiOff, AlertTriangle, Shield,
  Clock, Activity, Cpu, RefreshCw, ShieldAlert, CheckCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { agentService } from '../services/agentService';
import { attackService } from '../services/attackService';
import { useApi } from '../hooks/useApi';
import { mockAgents, mockAttacks } from '../utils/mockData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { subHours, startOfHour } from 'date-fns';

const SEV = {
  CRITICAL: { color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25' },
  HIGH:     { color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  SUSPICIOUS:{ color: 'text-purple-400', dot: 'bg-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
  MEDIUM:   { color: 'text-warning', dot: 'bg-warning', bg: 'bg-warning/10', border: 'border-warning/25' },
  LOW:      { color: 'text-accent', dot: 'bg-accent', bg: 'bg-accent/10', border: 'border-accent/25' },
  RESOLVED: { color: 'text-primary', dot: 'bg-primary', bg: 'bg-primary/10', border: 'border-primary/25' },
};

function MetricCard({ label, value, unit, icon: Icon, color = 'text-white' }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface/60">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text_muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-text_muted" />}
      </div>
      <div className={`text-2xl font-black font-mono ${color}`}>
        {value}<span className="text-sm font-normal text-text_muted ml-1">{unit}</span>
      </div>
    </div>
  );
}

export const AgentDetail = () => {
  const { agentId } = useParams();
  const { data: agentsRaw, execute: fetchAgents } = useApi(agentService.getAgents);
  const { data: attacksRaw, execute: fetchAttacks } = useApi(attackService.getAttacks);

  useEffect(() => {
    fetchAgents().catch(() => {});
    fetchAttacks().catch(() => {});
  }, [agentId]);

  const allAgents = agentsRaw ?? mockAgents;
  const allAttacks = attacksRaw ?? mockAttacks;

  const agent = allAgents.find(a => a.agent_id === agentId);
  const agentAttacks = allAttacks.filter(a => a.agent_id === agentId || a.hostname === (agent?.hostname));

  // Activity over last 12 hours
  const activityData = useMemo(() => {
    const hours = Array.from({ length: 12 }).map((_, i) => {
      const h = startOfHour(subHours(new Date(), 11 - i));
      return { hour: format(h, 'HH:00'), count: 0 };
    });
    agentAttacks.forEach(a => {
      const h = format(startOfHour(new Date(a.timestamp)), 'HH:00');
      const slot = hours.find(x => x.hour === h);
      if (slot) slot.count++;
    });
    return hours;
  }, [agentAttacks]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Server className="h-12 w-12 text-text_muted mb-4 opacity-30" />
        <p className="text-white font-bold text-lg mb-2">Agent not found</p>
        <p className="text-text_muted mb-6 text-sm">Agent ID <span className="font-mono text-accent">{agentId}</span> is not registered.</p>
        <Link to="/dashboard/agents" className="flex items-center gap-2 text-sm text-primary hover:text-primary_dark transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Endpoints
        </Link>
      </div>
    );
  }

  const isOnline = agent.status === 'online';
  const StatusIcon = isOnline ? Wifi : agent.status === 'degraded' ? AlertTriangle : WifiOff;
  const statusColor = isOnline ? 'text-primary' : agent.status === 'degraded' ? 'text-warning' : 'text-text_muted';
  const statusLabel = isOnline ? 'Protected' : agent.status === 'degraded' ? 'Degraded' : 'Offline';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back + header */}
      <div>
        <Link to="/dashboard/agents" className="inline-flex items-center gap-1.5 text-sm text-text_muted hover:text-white transition-colors mb-4">
          <ChevronLeft className="h-4 w-4" /> All Endpoints
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border border-border ${isOnline ? 'bg-primary/10' : 'bg-surface'}`}>
              <Server className={`h-6 w-6 ${statusColor}`} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-mono">{agent.hostname || agent.agent_id}</h1>
              <p className="text-sm text-text_muted">{agent.ip_address} · {agent.os || 'Ubuntu Linux'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${statusColor} ${isOnline ? 'bg-primary/10 border-primary/25' : 'bg-surface border-border'}`}>
              <StatusIcon className="h-4 w-4" />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Agent ID" value={agent.agent_id} icon={Activity} color="text-accent" />
        <MetricCard label="Agent Version" value={`v${agent.version || '1.0.0'}`} icon={Shield} color="text-primary" />
        <MetricCard label="Threats Detected" value={agent.threat_count ?? agentAttacks.length} icon={ShieldAlert} color={agentAttacks.length > 0 ? 'text-orange-400' : 'text-primary'} />
        <MetricCard
          label="Last Heartbeat"
          value={(agent.last_seen || agent.last_heartbeat) ? formatDistanceToNow(new Date(agent.last_seen || agent.last_heartbeat)) : 'Unknown'}
          icon={Clock}
          color="text-text-dim"
        />
      </div>

      {/* Activity chart + info */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-surface/60">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Attack Activity — Last 12 Hours</h2>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent info card */}
        <div className="p-5 rounded-xl border border-border bg-surface/60 space-y-4">
          <h2 className="text-sm font-semibold text-white">System Info</h2>
          {[
            ['Hostname', agent.hostname || '—'],
            ['IP Address', agent.ip_address || '—'],
            ['OS', agent.os || 'Ubuntu Linux'],
            ['Agent Version', `v${agent.version || '1.0.0'}`],
            ['Risk Level', agent.risk_level || 'LOW'],
            ['Status', statusLabel],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-xs text-text_muted">{k}</span>
              <span className="text-xs font-mono text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security events */}
      <div className="rounded-xl border border-border bg-surface/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-white">
            Security Events
            <span className="ml-2 text-xs text-text_muted font-normal">({agentAttacks.length})</span>
          </h2>
        </div>
        {agentAttacks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3 opacity-60" />
            <p className="text-sm text-text_muted">No security events for this endpoint.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...agentAttacks].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(a => {
              const s = SEV[a.severity?.toUpperCase()] || SEV.LOW;
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${s.color}`}>{a.severity}</span>
                      <span className="text-sm font-medium text-white truncate">{a.title || a.technique}</span>
                    </div>
                    <div className="text-xs text-text_muted mt-0.5">{a.action_taken}</div>
                  </div>
                  <div className="text-xs text-text_muted flex-shrink-0">
                    {format(new Date(a.timestamp), 'MMM d, HH:mm')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
