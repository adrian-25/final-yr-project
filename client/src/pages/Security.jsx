import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, ChevronRight, AlertTriangle, GitBranch, Cpu, FileWarning,
  Lock, Zap, Activity, Radio, Eye, ArrowRight, CheckCircle
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

const threats = [
  {
    icon: <GitBranch className="h-7 w-7" />,
    title: 'Process Abuse',
    mitre: 'T1059',
    severity: 'HIGH',
    sevColor: 'text-orange-400',
    sevBg: 'bg-orange-500/10',
    sevBorder: 'border-orange-500/20',
    threat: 'Malicious process spawns an abnormal number of child processes in a short window, indicating scripted execution, fork bombs, or staged malware deployment.',
    detection: 'Process tree anomaly model scores the spawn rate and child count. Behavioral threshold of >15 children/10s triggers elevated scoring.',
    response: 'Risk evaluation → HIGH tier → policy: TERMINATE_PROCESS_TREE',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
  },
  {
    icon: <Cpu className="h-7 w-7" />,
    title: 'Cryptomining',
    mitre: 'T1496',
    severity: 'HIGH',
    sevColor: 'text-orange-400',
    sevBg: 'bg-orange-500/10',
    sevBorder: 'border-orange-500/20',
    threat: 'Unauthorized process consumes sustained high CPU resources, typically >90% for extended periods, characteristic of Monero or other PoW mining activity.',
    detection: 'Individual process ML model scores anomalous resource consumption. CPU/memory feature vectors compared against trained baseline.',
    response: 'Risk evaluation → HIGH tier (resource_hijacker) → policy: TERMINATE_PROCESS_TREE',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
  },
  {
    icon: <FileWarning className="h-7 w-7" />,
    title: 'Ransomware',
    mitre: 'T1486',
    severity: 'CRITICAL',
    sevColor: 'text-danger',
    sevBg: 'bg-danger/10',
    sevBorder: 'border-danger/20',
    threat: 'Mass file modification in protected directories (/home, /tmp, Desktop, Documents) with high-entropy output — indicating active file encryption consistent with ransomware.',
    detection: 'Filesystem monitor tracks per-second write rates and output entropy. Threshold crossing triggers immediate ML scoring and risk escalation.',
    response: 'Risk evaluation → HIGH tier (ransomware) → policy: QUARANTINE_AND_TERMINATE — files isolated, process tree killed.',
    color: 'text-danger',
    border: 'border-danger/20',
    bg: 'bg-danger/5',
  },
  {
    icon: <Lock className="h-7 w-7" />,
    title: 'Cron Persistence',
    mitre: 'T1053',
    severity: 'SUSPICIOUS',
    sevColor: 'text-purple-400',
    sevBg: 'bg-purple-500/10',
    sevBorder: 'border-purple-500/20',
    threat: 'Attacker installs a malicious cron job to maintain persistence across reboots, typically a download-and-execute pattern targeting /tmp or /dev/shm.',
    detection: 'Cron scanner evaluates each entry against ML model, keyword scoring (curl, wget, bash, nc), Shannon entropy, and network indicator patterns.',
    response: 'If ML score >0.8 → remove cron entry + alert. If 0.5-0.8 → MONITOR_ONLY + report to backend.',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
  },
  {
    icon: <Cpu className="h-7 w-7" />,
    title: 'Resource Exhaustion',
    mitre: 'T1499',
    severity: 'HIGH',
    sevColor: 'text-orange-400',
    sevBg: 'bg-orange-500/10',
    sevBorder: 'border-orange-500/20',
    threat: 'Process deliberately consumes excessive memory or CPU to degrade system performance — denial of service against the host or preparation for further exploitation.',
    detection: 'Process model flags sustained deviation from per-process resource baseline. Combined CPU + memory anomaly scoring detects coordinated exhaustion.',
    response: 'Risk evaluation → HIGH tier (anomalous_process) → policy: TERMINATE_SINGLE_PROCESS',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
  },
  {
    icon: <GitBranch className="h-7 w-7" />,
    title: 'Abnormal Process Trees',
    mitre: 'T1059',
    severity: 'HIGH',
    sevColor: 'text-orange-400',
    sevBg: 'bg-orange-500/10',
    sevBorder: 'border-orange-500/20',
    threat: 'Unexpected parent-child process relationships — web servers spawning shells, office apps launching scripting engines, or unusual execution chains that indicate command injection or lateral movement.',
    detection: 'ML process tree model evaluates the semantic structure of parent-child pairs against baseline expected relationships.',
    response: 'Risk evaluation → HIGH tier → policy: TERMINATE_PROCESS_TREE',
    color: 'text-orange-400',
    border: 'border-orange-500/20',
    bg: 'bg-orange-500/5',
  },
  {
    icon: <FileWarning className="h-7 w-7" />,
    title: 'Suspicious Filesystem Activity',
    mitre: 'T1083',
    severity: 'SUSPICIOUS',
    sevColor: 'text-purple-400',
    sevBg: 'bg-purple-500/10',
    sevBorder: 'border-purple-500/20',
    threat: 'Abnormal directory traversal, bulk file reads across user home directories, or write activity in unexpected locations inconsistent with the process profile.',
    detection: 'Filesystem ML model scores write count, rate, directory distribution, and entropy deviations from learned normal behavior.',
    response: 'Below threshold → MONITOR_ONLY. Above threshold → risk escalation + backend alert.',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
  },
  {
    icon: <Radio className="h-7 w-7" />,
    title: 'Low-Level System Activity',
    mitre: 'T1014',
    severity: 'SUSPICIOUS',
    sevColor: 'text-purple-400',
    sevBg: 'bg-purple-500/10',
    sevBorder: 'border-purple-500/20',
    threat: 'Rootkit-level activity, unusual syscall patterns, unexpected kernel interactions, or process attempting to hide its presence through low-level API manipulation.',
    detection: 'eBPF monitor tracks syscall frequency, ordering, and combinations. ML eBPF model scores deviations from baseline kernel interaction patterns.',
    response: 'Detection event sent to backend for cloud Risk Fusion. Local monitoring continues with heightened sensitivity.',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
  },
];

const mitigations = [
  { label: 'MONITOR_ONLY', desc: 'Log and report. No process action.', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  { label: 'TERMINATE_SINGLE_PROCESS', desc: 'Kill the anomalous process.', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  { label: 'TERMINATE_PROCESS_TREE', desc: 'Kill parent and all descendants.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { label: 'QUARANTINE_AND_TERMINATE', desc: 'Suspend process, isolate files, then kill.', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
];

export const Security = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 hero-bg" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-danger/30 bg-danger/5 text-xs font-mono text-danger mb-6">
            <AlertTriangle className="h-3.5 w-3.5" /> THREAT COVERAGE
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
            What ARCDIS <span className="text-gradient">detects.</span>
          </h1>
          <p className="text-lg text-text_muted max-w-2xl mx-auto">
            Eight threat categories, each with a specific detection methodology and automated response policy. From ransomware to rootkits — behavioral coverage across the attack surface.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Response actions strip */}
    <section className="border-y border-border-bright/20 bg-surface/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {mitigations.map(m => (
            <div key={m.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${m.border} ${m.bg}`}>
              <span className={`text-xs font-mono font-bold ${m.color}`}>{m.label}</span>
              <span className="text-xs text-text_muted">— {m.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Threat cards */}
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {threats.map((t) => (
            <AnimatedSection key={t.title}>
              <motion.div
                variants={fadeUp}
                className={`p-6 rounded-2xl border ${t.border} bg-surface/40 hover:${t.bg} transition-all shadow-card`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${t.bg} ${t.color}`}>{t.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t.title}</h3>
                      <span className="text-xs font-mono text-text_muted">{t.mitre}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md ${t.sevBg} ${t.sevBorder} border ${t.sevColor}`}>
                    {t.severity}
                  </span>
                </div>

                {/* Three-part layout */}
                <div className="space-y-4">
                  {[
                    { label: 'THREAT', val: t.threat, color: 'text-danger' },
                    { label: 'DETECTION', val: t.detection, color: 'text-accent' },
                    { label: 'RESPONSE', val: t.response, color: 'text-primary' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className={`text-xs font-mono font-semibold ${row.color} mb-1.5 flex items-center gap-1.5`}>
                        <span className={`inline-flex h-1.5 w-1.5 rounded-full bg-current`} />
                        {row.label}
                      </div>
                      <p className="text-xs text-text_muted leading-relaxed pl-3">{row.val}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>

    {/* MITRE mapping */}
    <section className="py-16 bg-surface/20 border-y border-border-bright/10">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <AnimatedSection>
          <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-4">MITRE ATT&CK Coverage</motion.h2>
          <motion.p variants={fadeUp} className="text-text_muted mb-8">
            ARCDIS focuses on techniques common in Linux endpoint attacks.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { id: 'T1059', name: 'Command and Script Interpreter' },
              { id: 'T1053', name: 'Scheduled Task / Job' },
              { id: 'T1486', name: 'Data Encrypted for Impact' },
              { id: 'T1496', name: 'Resource Hijacking' },
              { id: 'T1499', name: 'Endpoint DoS' },
              { id: 'T1083', name: 'File and Directory Discovery' },
              { id: 'T1014', name: 'Rootkit' },
              { id: 'T1055', name: 'Process Injection' },
            ].map(m => (
              <motion.div
                key={m.id}
                variants={fadeUp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-bright/30 bg-surface/40"
              >
                <span className="text-xs font-mono text-primary font-bold">{m.id}</span>
                <span className="text-xs text-text_muted">{m.name}</span>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>

    {/* CTA */}
    <section className="border-t border-border-bright/20 py-20 text-center">
      <div className="max-w-2xl mx-auto px-4">
        <AnimatedSection>
          <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-4">
            Protect your endpoints.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-text_muted mb-8">
            Deploy ARCDIS and start detecting threats in minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark shadow-glow transition-all text-sm">
              Launch Console <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/features" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border-bright text-sm font-medium text-text rounded-xl hover:border-primary/40 transition-colors">
              View All Features
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  </div>
);
