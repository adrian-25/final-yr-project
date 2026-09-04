import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, X, Search, Filter, Clock, ChevronRight,
  Cpu, Server, GitBranch, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { attackService } from '../services/attackService';
import { useApi } from '../hooks/useApi';
import { mockAttacks } from '../utils/mockData';

const SEV = {
  CRITICAL: { color: 'text-red-400', dot: 'bg-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25', ring: 'ring-red-500/30' },
  HIGH:     { color: 'text-orange-400', dot: 'bg-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', ring: 'ring-orange-500/30' },
  SUSPICIOUS:{ color: 'text-purple-400', dot: 'bg-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25', ring: 'ring-purple-500/30' },
  MEDIUM:   { color: 'text-warning', dot: 'bg-warning', bg: 'bg-warning/10', border: 'border-warning/25', ring: 'ring-warning/30' },
  LOW:      { color: 'text-accent', dot: 'bg-accent', bg: 'bg-accent/10', border: 'border-accent/25', ring: 'ring-accent/30' },
  RESOLVED: { color: 'text-primary', dot: 'bg-primary', bg: 'bg-primary/10', border: 'border-primary/25', ring: 'ring-primary/30' },
};

function SevBadge({ severity }) {
  const s = SEV[severity?.toUpperCase()] || SEV.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${s.color} ${s.bg} border ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity?.toUpperCase()}
    </span>
  );
}

function DetailPanel({ attack, onClose }) {
  if (!attack) return null;
  const s = SEV[attack.severity?.toUpperCase()] || SEV.LOW;
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      className="w-full lg:w-[420px] flex-shrink-0 rounded-xl border border-border bg-surface/80 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`h-4 w-4 ${s.color}`} />
          <span className="text-sm font-semibold text-white">Attack Details</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-text_muted hover:text-white hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Severity + title */}
        <div>
          <SevBadge severity={attack.severity} />
          <h3 className="text-lg font-bold text-white mt-3 leading-snug">{attack.title || attack.technique}</h3>
          <p className="text-xs font-mono text-text_muted mt-1">{attack.technique}</p>
        </div>

        {/* Description */}
        <div className="p-4 rounded-lg bg-background/60 border border-border text-sm text-text_muted leading-relaxed">
          {attack.description || 'No description available.'}
        </div>

        {/* Key fields */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Agent', value: attack.hostname || attack.agent_id, icon: <Server className="h-3.5 w-3.5" /> },
            { label: 'Process', value: attack.process_name || '—', icon: <Cpu className="h-3.5 w-3.5" /> },
            { label: 'Parent', value: attack.parent_process || '—', icon: <GitBranch className="h-3.5 w-3.5" /> },
            { label: 'Action', value: attack.action_taken, icon: <ShieldAlert className="h-3.5 w-3.5" /> },
          ].map(f => (
            <div key={f.label} className="p-3 rounded-lg bg-background/40 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-text_muted mb-1.5">
                {f.icon}{f.label}
              </div>
              <div className="text-xs font-mono text-white break-all">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Risk score */}
        {attack.risk_score != null && (
          <div className="p-4 rounded-lg bg-background/40 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text_muted">Risk Score</span>
              <span className={`text-lg font-black font-mono ${attack.risk_score >= 0.8 ? 'text-danger' : attack.risk_score >= 0.5 ? 'text-warning' : 'text-primary'}`}>
                {attack.risk_score.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${attack.risk_score >= 0.8 ? 'bg-danger' : attack.risk_score >= 0.5 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${attack.risk_score * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Detection methods */}
        {attack.detection_methods?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text_muted uppercase tracking-wider mb-3">Detection Methods</p>
            <div className="space-y-2">
              {attack.detection_methods.map(m => (
                <div key={m} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-text_muted">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {attack.features && Object.keys(attack.features).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text_muted uppercase tracking-wider mb-3">Extracted Features</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {Object.entries(attack.features).map(([k, v]) => (
                    <tr key={k}>
                      <td className="px-3 py-2 font-mono text-text_muted w-2/5">{k}</td>
                      <td className="px-3 py-2 font-mono text-white break-all">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-text_muted pt-2 border-t border-border">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(attack.timestamp), 'PPpp')}
        </div>
      </div>
    </motion.div>
  );
}

export const Attacks = () => {
  const { data: attacksRaw, execute: fetchAttacks, loading } = useApi(attackService.getAttacks);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchAttacks().catch(() => {}); }, []);

  const attacks = attacksRaw ?? mockAttacks;

  const filtered = useMemo(() => {
    return attacks.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q || (
        (a.title || '').toLowerCase().includes(q) ||
        (a.technique || '').toLowerCase().includes(q) ||
        (a.agent_id || '').toLowerCase().includes(q) ||
        (a.hostname || '').toLowerCase().includes(q)
      );
      const matchSev = !filterSev || a.severity?.toUpperCase() === filterSev;
      const matchStatus = !filterStatus || a.status === filterStatus;
      return matchSearch && matchSev && matchStatus;
    });
  }, [attacks, search, filterSev, filterStatus]);

  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Attack Telemetry</h1>
          <p className="text-sm text-text_muted mt-0.5">
            {sorted.length} event{sorted.length !== 1 ? 's' : ''} {filterSev || filterStatus || search ? '(filtered)' : ''}
          </p>
        </div>
        <button
          onClick={() => fetchAttacks().catch(()=>{})}
          className="flex items-center gap-2 px-3 py-2 text-xs text-text_muted hover:text-white border border-border hover:border-border-bright rounded-lg transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text_muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search attacks, agents..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface/60 border border-border rounded-xl text-white placeholder:text-text_muted focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        {/* Severity filter */}
        <select
          value={filterSev}
          onChange={e => setFilterSev(e.target.value)}
          className="px-3 py-2.5 text-sm bg-surface/60 border border-border rounded-xl text-text_muted focus:outline-none focus:border-primary/40 transition-colors"
        >
          <option value="">All Severities</option>
          {['CRITICAL','HIGH','SUSPICIOUS','MEDIUM','LOW','RESOLVED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm bg-surface/60 border border-border rounded-xl text-text_muted focus:outline-none focus:border-primary/40 transition-colors"
        >
          <option value="">All Statuses</option>
          {['MITIGATED','MONITORING','ACTIVE'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(search || filterSev || filterStatus) && (
          <button
            onClick={() => { setSearch(''); setFilterSev(''); setFilterStatus(''); }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-danger hover:text-danger/80 border border-danger/20 hover:border-danger/40 rounded-xl transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-4 items-start">
        {/* Table */}
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-surface/60 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border bg-background/30">
            <div className="col-span-2 text-xs font-semibold text-text_muted uppercase tracking-wider">Severity</div>
            <div className="col-span-3 text-xs font-semibold text-text_muted uppercase tracking-wider">Attack Type</div>
            <div className="col-span-2 text-xs font-semibold text-text_muted uppercase tracking-wider">Agent</div>
            <div className="col-span-2 text-xs font-semibold text-text_muted uppercase tracking-wider hidden lg:block">Response</div>
            <div className="col-span-2 text-xs font-semibold text-text_muted uppercase tracking-wider hidden lg:block">Status</div>
            <div className="col-span-1 text-xs font-semibold text-text_muted uppercase tracking-wider">Time</div>
          </div>

          {sorted.length === 0 ? (
            <div className="py-20 text-center">
              <ShieldAlert className="h-10 w-10 text-text_muted mx-auto mb-3 opacity-40" />
              <p className="text-text_muted text-sm">No attack events match the current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map(a => {
                const s = SEV[a.severity?.toUpperCase()] || SEV.LOW;
                const isSelected = selected?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(isSelected ? null : a)}
                    className={`grid grid-cols-12 gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/3 ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                  >
                    <div className="col-span-2"><SevBadge severity={a.severity} /></div>
                    <div className="col-span-3">
                      <div className="text-sm font-medium text-white truncate">{a.title || a.technique}</div>
                      <div className="text-xs font-mono text-text_muted">{a.technique}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-mono text-accent truncate">{a.hostname || a.agent_id}</div>
                    </div>
                    <div className="col-span-2 hidden lg:block">
                      <span className="text-xs font-mono text-primary">{a.action_taken}</span>
                    </div>
                    <div className="col-span-2 hidden lg:block">
                      <span className={`text-xs font-mono ${a.status === 'MITIGATED' ? 'text-primary' : a.status === 'ACTIVE' ? 'text-danger' : 'text-warning'}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-xs text-text_muted font-mono whitespace-nowrap">
                      {format(new Date(a.timestamp), 'MMM d')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <DetailPanel attack={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
