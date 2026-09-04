export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const SEVERITY_LEVELS = {
  CRITICAL: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-400' },
  HIGH: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  SUSPICIOUS: { label: 'Suspicious', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-400' },
  MEDIUM: { label: 'Medium', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', dot: 'bg-warning' },
  LOW: { label: 'Low', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', dot: 'bg-accent' },
  RESOLVED: { label: 'Resolved', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', dot: 'bg-primary' },
};

export const AGENT_STATUS = {
  online: { label: 'Protected', color: 'text-primary', dot: 'bg-primary' },
  degraded: { label: 'Degraded', color: 'text-warning', dot: 'bg-warning' },
  offline: { label: 'Offline', color: 'text-danger', dot: 'bg-danger' },
};

/**
 * SEVERITY_COLORS — Tailwind class strings consumed by Badge.jsx.
 * Keys are lowercase (Badge.jsx calls value.toLowerCase() before lookup).
 */
export const SEVERITY_COLORS = {
  critical:   'bg-red-500/10 border-red-500/30 text-red-400',
  high:       'bg-orange-500/10 border-orange-500/30 text-orange-400',
  suspicious: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  medium:     'bg-warning/10 border-warning/30 text-warning',
  low:        'bg-accent/10 border-accent/30 text-accent',
  resolved:   'bg-primary/10 border-primary/30 text-primary',
};

/**
 * STATUS_COLORS — Tailwind class strings consumed by Badge.jsx.
 * Keys are lowercase.
 */
export const STATUS_COLORS = {
  online:   'bg-primary/10 border-primary/30 text-primary',
  degraded: 'bg-warning/10 border-warning/30 text-warning',
  offline:  'bg-danger/10 border-danger/30 text-danger',
  active:   'bg-red-500/10 border-red-500/30 text-red-400',
  mitigated:'bg-primary/10 border-primary/30 text-primary',
  monitoring:'bg-accent/10 border-accent/30 text-accent',
};

export const NAV_LINKS = [
  { label: 'Platform', href: '/#features' },
  { label: 'Features', href: '/features' },
  { label: 'Architecture', href: '/architecture' },
  { label: 'Security', href: '/security' },
  { label: 'Documentation', href: '/docs' },
];
