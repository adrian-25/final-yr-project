import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  ChevronRight, Shield, Activity, Cpu, Eye, Zap, Server,
  FileWarning, RefreshCw, Radio, GitBranch, Lock, AlertTriangle,
  CheckCircle, ArrowRight, Terminal, BarChart2, Globe
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { mockChartData, mockDonutData } from '../utils/mockData';

/* ─── Animation helpers ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Live Security Console Visual ──────────────────────────── */
const LiveConsole = () => {
  const [tick, setTick] = useState(0);
  const events = [
    { time: '13:22:01', type: 'INFO', msg: 'Heartbeat received — ubuntu-server-01' },
    { time: '13:22:08', type: 'WARN', msg: 'Anomalous child spawn rate detected — bash (PID 4821)' },
    { time: '13:22:09', type: 'DETECT', msg: 'ML anomaly score: 0.94 — process tree' },
    { time: '13:22:09', type: 'RISK', msg: 'Risk tier: HIGH — behavior_type: process_storm' },
    { time: '13:22:10', type: 'ACTION', msg: 'Policy triggered: TERMINATE_PROCESS_TREE' },
    { time: '13:22:10', type: 'OK', msg: 'Threat mitigated — event reported to backend' },
  ];
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % (events.length + 1)), 800);
    return () => clearInterval(id);
  }, []);
  const typeStyle = { INFO: 'text-text_muted', WARN: 'text-warning', DETECT: 'text-accent', RISK: 'text-orange-400', ACTION: 'text-primary', OK: 'text-primary' };
  return (
    <div className="font-mono text-xs leading-relaxed space-y-1.5 overflow-hidden">
      {events.slice(0, tick + 1).map((e, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
          <span className="text-text_muted flex-shrink-0">{e.time}</span>
          <span className={`flex-shrink-0 w-14 ${typeStyle[e.type] || 'text-white'}`}>[{e.type}]</span>
          <span className="text-slate-300">{e.msg}</span>
        </motion.div>
      ))}
      {tick >= events.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mt-2">
          <span className="text-text_muted flex-shrink-0">13:22:11</span>
          <span className="text-primary flex-shrink-0 w-14">[INFO]</span>
          <span className="text-slate-300 cursor-blink">Monitoring resumed</span>
        </motion.div>
      )}
    </div>
  );
};

/* ─── Hero Section ───────────────────────────────────────────── */
const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
    {/* Background effects */}
    <div className="absolute inset-0 grid-bg opacity-100" />
    <div className="absolute inset-0 hero-bg" />
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Status pill */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            ARCDIS SYSTEM OPERATIONAL
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
            <span className="text-white">Intelligent</span>
            <br />
            <span className="text-gradient">Endpoint Defense</span>
            <br />
            <span className="text-white">for Linux.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg text-text_muted leading-relaxed max-w-lg">
            ARCDIS detects abnormal behavior, identifies suspicious activity, and automatically responds to threats across Linux endpoints — using behavioral analysis, machine learning and low-level system telemetry.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-background text-sm font-bold rounded-xl hover:bg-primary_dark transition-all shadow-glow hover:shadow-glow-lg active:scale-95"
            >
              Launch Security Console <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/architecture"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-border-bright text-sm font-medium text-text rounded-xl hover:border-primary/40 hover:text-primary transition-colors"
            >
              Explore Architecture <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Trust metrics */}
          <motion.div variants={fadeUp} className="flex items-center gap-6 pt-2">
            {[
              { val: '6', label: 'ML Models' },
              { val: 'eBPF', label: 'Kernel Visibility' },
              { val: 'RT', label: 'Real-time Response' },
            ].map(m => (
              <div key={m.val} className="text-center">
                <div className="text-xl font-bold font-mono text-primary">{m.val}</div>
                <div className="text-xs text-text_muted mt-0.5">{m.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Console visualization */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="relative">
          {/* Outer glow */}
          <div className="absolute -inset-4 bg-primary/5 rounded-2xl blur-2xl" />

          <div className="relative rounded-2xl border border-border-bright/30 bg-surface/80 backdrop-blur-sm overflow-hidden shadow-panel">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-bright/20 bg-background/40">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-danger/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs font-mono text-text_muted ml-2">arcdis-agent — monitor</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                ACTIVE
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-border-bright/20 border-b border-border-bright/20">
              {[
                { label: 'ENDPOINTS', val: '12', color: 'text-accent' },
                { label: 'THREATS', val: '03', color: 'text-danger' },
                { label: 'RISK', val: 'LOW', color: 'text-primary' },
              ].map(s => (
                <div key={s.label} className="p-4 text-center">
                  <div className="text-xs font-mono text-text_muted mb-1">{s.label}</div>
                  <div className={`text-2xl font-black font-mono ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Threat detection log */}
            <div className="p-4 bg-background/20">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono text-text_muted">Detection Log</span>
              </div>
              <LiveConsole />
            </div>

            {/* Activity bar */}
            <div className="px-4 pb-4">
              <div className="h-px bg-border-bright/20 mb-4" />
              <div className="flex items-end gap-1 h-12">
                {[2, 5, 3, 8, 4, 6, 10, 3, 7, 4, 9, 5, 3, 6, 4, 8].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    style={{ height: `${h * 5}%`, originY: 1 }}
                    className={`flex-1 rounded-t-sm ${i === 7 ? 'bg-danger/80' : 'bg-primary/30'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs font-mono text-text_muted">CPU ACTIVITY</span>
                <span className="text-xs font-mono text-primary">MONITORING</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── Tech Strip ─────────────────────────────────────────────── */
const TechStrip = () => {
  const techs = [
    { icon: <Globe className="h-5 w-5" />, label: 'Linux' },
    { icon: <Radio className="h-5 w-5" />, label: 'eBPF' },
    { icon: <Cpu className="h-5 w-5" />, label: 'Machine Learning' },
    { icon: <Zap className="h-5 w-5" />, label: 'FastAPI' },
    { icon: <Activity className="h-5 w-5" />, label: 'MongoDB' },
    { icon: <BarChart2 className="h-5 w-5" />, label: 'React' },
    { icon: <GitBranch className="h-5 w-5" />, label: 'scikit-learn' },
    { icon: <Server className="h-5 w-5" />, label: 'systemd' },
  ];
  return (
    <section className="border-y border-border-bright/20 bg-surface/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-mono text-text_muted text-center mb-6 tracking-widest uppercase">Built for modern Linux environments</p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {techs.map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-text_muted hover:text-white transition-colors group">
              <span className="text-text_muted group-hover:text-primary transition-colors">{t.icon}</span>
              <span className="text-sm font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Problem Section ───────────────────────────────────────── */
const ProblemSection = () => {
  const problems = [
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: 'Process Abuse',
      desc: 'Abnormal process spawning, unexpected parent–child relationships, and suspicious execution chains that signatures miss.',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: 'Persistence',
      desc: 'Malicious cron jobs and startup mechanisms designed to survive reboots and re-establish attacker access.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      icon: <Cpu className="h-6 w-6" />,
      title: 'Resource Abuse',
      desc: 'Cryptominers and processes consuming abnormal CPU and memory, draining infrastructure without obvious indicators.',
      color: 'text-danger',
      bg: 'bg-danger/10',
      border: 'border-danger/20',
    },
  ];
  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-warning/30 bg-warning/5 text-xs font-mono text-warning mb-6">
              <AlertTriangle className="h-3.5 w-3.5" /> THE PROBLEM
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
              Threats don't always look malicious.
              <br />
              <span className="text-gradient">Behavior does.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-text_muted max-w-2xl mx-auto">
              Signature-based detection fails against novel threats, living-off-the-land attacks, and behaviorally anomalous processes. You need a system that understands what normal looks like — and flags what isn't.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`p-6 rounded-2xl border ${p.border} ${p.bg} backdrop-blur-sm`}
              >
                <div className={`inline-flex p-3 rounded-xl ${p.bg} ${p.color} mb-5`}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
                <p className="text-text_muted text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

/* ─── How It Works ───────────────────────────────────────────── */
const HowItWorks = () => {
  const steps = [
    { icon: <Eye className="h-6 w-6" />, label: 'Monitor', desc: 'Collect process, filesystem, cron and kernel-level events continuously.', color: 'text-accent' },
    { icon: <Activity className="h-6 w-6" />, label: 'Analyze', desc: 'Apply behavioral rules and ML anomaly detection across event streams.', color: 'text-blue-400' },
    { icon: <AlertTriangle className="h-6 w-6" />, label: 'Detect', desc: 'Identify suspicious or statistically anomalous activity in real time.', color: 'text-warning' },
    { icon: <BarChart2 className="h-6 w-6" />, label: 'Assess', desc: 'Calculate risk tier and classify the event by behavior type.', color: 'text-orange-400' },
    { icon: <Shield className="h-6 w-6" />, label: 'Respond', desc: 'Terminate, quarantine, or monitor according to configured policy.', color: 'text-danger' },
    { icon: <Radio className="h-6 w-6" />, label: 'Report', desc: 'Send structured attack telemetry to the centralized ARCDIS backend.', color: 'text-primary' },
  ];
  return (
    <section className="py-28 bg-surface/20 border-y border-border-bright/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-xs font-mono text-accent mb-6">
              <Activity className="h-3.5 w-3.5" /> HOW ARCDIS WORKS
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-white mb-4">
              From raw signal to <span className="text-gradient">blocked threat</span>.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text_muted max-w-xl mx-auto">
              Six-stage pipeline. Runs locally on every endpoint, continuously, in milliseconds.
            </motion.p>
          </div>

          {/* Steps flow */}
          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[calc(8.33%+2rem)] right-[calc(8.33%+2rem)] h-px bg-gradient-to-r from-transparent via-border-bright/40 to-transparent" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.label}
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Step number */}
                  <div className="text-xs font-mono text-text_muted mb-3 z-10">{String(i + 1).padStart(2, '0')}</div>
                  {/* Icon circle */}
                  <div className={`relative z-10 w-16 h-16 rounded-2xl border border-border-bright/30 bg-surface flex items-center justify-center ${step.color} mb-4 group-hover:border-current/50 group-hover:bg-current/5 transition-all shadow-card`}>
                    {step.icon}
                  </div>
                  <div className="font-bold text-white mb-2 text-sm tracking-wide">{step.label}</div>
                  <p className="text-xs text-text_muted leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

/* ─── Features Grid ──────────────────────────────────────────── */
const FeaturesSection = () => {
  const features = [
    {
      icon: <GitBranch className="h-7 w-7" />,
      title: 'Behavioral Process Monitoring',
      desc: 'Monitor process trees and detect storms, suspicious chains, abnormal CPU/memory usage, and anomalous child spawning patterns.',
      tags: ['Process Trees', 'CPU Monitoring', 'Memory Analysis'],
      color: 'text-accent',
      border: 'border-accent/20',
      bg: 'bg-accent/5',
      span: 'lg:col-span-2',
    },
    {
      icon: <Cpu className="h-7 w-7" />,
      title: 'Machine Learning Detection',
      desc: 'Six trained Isolation Forest models identify anomalous process trees, individual processes, filesystem events, eBPF events, and cron jobs.',
      tags: ['Isolation Forest', '6 Models', 'Local Inference'],
      color: 'text-primary',
      border: 'border-primary/20',
      bg: 'bg-primary/5',
      span: '',
    },
    {
      icon: <Radio className="h-7 w-7" />,
      title: 'eBPF Kernel Visibility',
      desc: 'Use Linux eBPF technology to observe low-level system activity and detect stealthier behavior that userspace monitoring misses.',
      tags: ['Kernel-Level', 'Syscall Monitor', 'Low Overhead'],
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/5',
      span: '',
    },
    {
      icon: <FileWarning className="h-7 w-7" />,
      title: 'Ransomware Detection',
      desc: 'Monitor protected directories — /home, /tmp, Desktop, Documents — for mass file activity consistent with ransomware encryption.',
      tags: ['File Monitoring', 'Protected Dirs', 'Write Rate'],
      color: 'text-danger',
      border: 'border-danger/20',
      bg: 'bg-danger/5',
      span: '',
    },
    {
      icon: <Lock className="h-7 w-7" />,
      title: 'Persistence Detection',
      desc: 'Scan all user crontabs for malicious scheduled tasks using ML scoring, entropy analysis, suspicious keyword matching, and network pattern detection.',
      tags: ['Cron Analysis', 'Entropy Score', 'Keyword Detection'],
      color: 'text-warning',
      border: 'border-warning/20',
      bg: 'bg-warning/5',
      span: '',
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: 'Automated Response',
      desc: 'Policy engine executes the right action for each risk tier: monitor, terminate process, terminate entire tree, or quarantine and terminate.',
      tags: ['Policy Engine', 'Auto-Kill', 'Quarantine'],
      color: 'text-orange-400',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/5',
      span: 'lg:col-span-2',
    },
  ];
  return (
    <section id="features" className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
              <Shield className="h-3.5 w-3.5" /> CAPABILITIES
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-white mb-4">
              Every attack surface, <span className="text-gradient">covered</span>.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text_muted max-w-xl mx-auto">
              Layered detection across process behavior, filesystem activity, kernel events, and scheduled persistence mechanisms.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${f.span} p-6 rounded-2xl border ${f.border} bg-surface/40 backdrop-blur-sm hover:${f.bg} transition-all shadow-card`}
              >
                <div className={`inline-flex p-3 rounded-xl border ${f.border} ${f.bg} ${f.color} mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-text_muted leading-relaxed mb-5">{f.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {f.tags.map(t => (
                    <span key={t} className="px-2.5 py-1 text-xs font-mono bg-background rounded-md border border-border-bright/30 text-text_muted">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

/* ─── Security Intelligence ─────────────────────────────────── */
const SecurityIntelligence = () => {
  const pipeline = [
    { label: 'Linux Endpoint', icon: <Server className="h-5 w-5" />, color: 'text-accent' },
    { label: 'Telemetry', icon: <Radio className="h-5 w-5" />, color: 'text-blue-400' },
    { label: 'Feature Extraction', icon: <Activity className="h-5 w-5" />, color: 'text-purple-400' },
    { label: 'ML Detection', icon: <Cpu className="h-5 w-5" />, color: 'text-warning' },
    { label: 'Risk Evaluation', icon: <BarChart2 className="h-5 w-5" />, color: 'text-orange-400' },
    { label: 'Policy Engine', icon: <Lock className="h-5 w-5" />, color: 'text-danger' },
    { label: 'Automated Response', icon: <Zap className="h-5 w-5" />, color: 'text-primary' },
  ];
  return (
    <section className="py-28 bg-surface/10 border-y border-border-bright/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
                <Cpu className="h-3.5 w-3.5" /> INTELLIGENCE PIPELINE
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
                From raw events to{' '}
                <span className="text-gradient">actionable intelligence</span>.
              </motion.h2>
              <motion.p variants={fadeUp} className="text-text_muted leading-relaxed mb-8">
                ARCDIS doesn't just alert — it thinks. Every system event passes through a multi-stage intelligence pipeline that extracts features, scores anomalies, evaluates risk, and applies automated countermeasures in milliseconds.
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-3">
                {[
                  '6 trained ML models running locally — zero cloud dependency',
                  'Sub-second detection from event to policy execution',
                  'Risk-tiered responses: MONITOR → TERMINATE → QUARANTINE',
                  'Full telemetry reported to centralized security dashboard',
                ].map(pt => (
                  <div key={pt} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text_muted">{pt}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Pipeline visual */}
            <motion.div variants={fadeUp} className="relative">
              <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-accent/0 via-primary/30 to-primary/0" />
              <div className="space-y-3">
                {pipeline.map((step, i) => (
                  <motion.div
                    key={step.label}
                    variants={fadeUp}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex items-center gap-4 p-4 rounded-xl border border-border-bright/20 bg-surface/40 backdrop-blur-sm hover:border-primary/20 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-background/60 ${step.color} flex-shrink-0`}>
                      {step.icon}
                    </div>
                    <span className="text-sm font-medium text-white">{step.label}</span>
                    <div className="ml-auto">
                      <span className="text-xs font-mono text-text_muted">stage {String(i + 1).padStart(2, '0')}</span>
                    </div>
                    {i < pipeline.length - 1 && (
                      <div className="absolute -bottom-3 left-8 z-10 w-px h-3 bg-border-bright/30" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

/* ─── Dashboard Preview ─────────────────────────────────────── */
const DashboardPreview = () => {
  const recentAttacks = [
    { severity: 'HIGH', title: 'Suspicious Process Tree', agent: 'ubuntu-server-01', time: '2 min ago', color: 'text-orange-400', dot: 'bg-orange-400' },
    { severity: 'CRITICAL', title: 'Mass File Modification', agent: 'workstation-03', time: '8 min ago', color: 'text-danger', dot: 'bg-danger' },
    { severity: 'SUSPICIOUS', title: 'Cron Persistence', agent: 'server-02', time: '15 min ago', color: 'text-purple-400', dot: 'bg-purple-400' },
    { severity: 'HIGH', title: 'Resource Hijacking', agent: 'ubuntu-server-01', time: '1h ago', color: 'text-orange-400', dot: 'bg-orange-400' },
  ];
  const endpoints = [
    { name: 'ubuntu-server-01', status: 'Protected', color: 'text-primary', dot: 'bg-primary' },
    { name: 'production-node', status: 'Protected', color: 'text-primary', dot: 'bg-primary' },
    { name: 'dev-machine', status: 'Monitoring', color: 'text-accent', dot: 'bg-accent' },
    { name: 'workstation-03', status: 'Offline', color: 'text-text_muted', dot: 'bg-text_muted' },
    { name: 'server-02', status: 'Protected', color: 'text-primary', dot: 'bg-primary' },
  ];

  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-xs font-mono text-accent mb-6">
              <BarChart2 className="h-3.5 w-3.5" /> SECURITY CONSOLE
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-black text-white mb-4">
              One console. <span className="text-gradient">Every endpoint.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text_muted max-w-xl mx-auto">
              A centralized SOC-style dashboard giving you real-time visibility across all protected Linux machines.
            </motion.p>
          </div>

          {/* Dashboard mockup */}
          <motion.div variants={fadeUp} className="relative rounded-2xl border border-border-bright/30 bg-surface/60 backdrop-blur-sm overflow-hidden shadow-panel">
            {/* Dashboard header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-bright/20 bg-background/30">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-mono font-bold text-sm text-white tracking-wider">ARCDIS</span>
                <span className="text-border-bright/40 mx-2">|</span>
                <span className="text-sm text-text_muted">Security Console</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  LIVE
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Endpoints', val: '12', sub: '+2 this week', color: 'text-accent', icon: <Server className="h-5 w-5" /> },
                  { label: 'Active Endpoints', val: '10', sub: '83% coverage', color: 'text-primary', icon: <Activity className="h-5 w-5" /> },
                  { label: 'Threats Detected', val: '8', sub: 'Last 24 hours', color: 'text-warning', icon: <AlertTriangle className="h-5 w-5" /> },
                  { label: 'High Risk', val: '2', sub: 'Requires attention', color: 'text-danger', icon: <Shield className="h-5 w-5" /> },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl border border-border-bright/20 bg-background/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-text_muted">{s.label}</span>
                      <span className={s.color}>{s.icon}</span>
                    </div>
                    <div className={`text-3xl font-black font-mono ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-text_muted mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Chart + Events + Endpoints */}
              <div className="grid lg:grid-cols-5 gap-4">
                {/* Chart */}
                <div className="lg:col-span-2 p-4 rounded-xl border border-border-bright/20 bg-background/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-white">Threat Activity</span>
                    <span className="text-xs text-text_muted font-mono">7 DAYS</span>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="critical" stackId="a" fill="#dc2626" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="high" stackId="a" fill="#f97316" />
                        <Bar dataKey="suspicious" stackId="a" fill="#a78bfa" />
                        <Bar dataKey="resolved" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent attacks */}
                <div className="lg:col-span-2 p-4 rounded-xl border border-border-bright/20 bg-background/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-white">Recent Threats</span>
                    <span className="text-xs text-primary font-mono">LIVE</span>
                  </div>
                  <div className="space-y-3">
                    {recentAttacks.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`inline-flex mt-1 h-2 w-2 rounded-full ${a.dot} flex-shrink-0`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono font-bold ${a.color}`}>{a.severity}</span>
                          </div>
                          <div className="text-xs text-white truncate">{a.title}</div>
                          <div className="text-xs text-text_muted">{a.agent} · {a.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Endpoints */}
                <div className="p-4 rounded-xl border border-border-bright/20 bg-background/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-white">Endpoints</span>
                    <span className="text-xs text-text_muted">5</span>
                  </div>
                  <div className="space-y-3">
                    {endpoints.map((ep, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-text_muted font-mono truncate">{ep.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`h-1.5 w-1.5 rounded-full ${ep.dot}`} />
                          <span className={`text-xs font-medium ${ep.color}`}>{ep.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
};

/* ─── CTA ─────────────────────────────────────────────────────── */
const CTASection = () => (
  <section className="py-28">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimatedSection>
        <motion.div
          variants={fadeUp}
          className="relative text-center py-20 px-8 rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              READY TO DEPLOY
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white max-w-3xl mx-auto leading-tight">
              Protect your Linux endpoints{' '}
              <span className="text-gradient">with ARCDIS.</span>
            </h2>

            <p className="text-lg text-text_muted max-w-xl mx-auto">
              Deploy the agent on any Ubuntu machine in minutes. See threats, understand behavior, take action.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-background text-base font-bold rounded-xl hover:bg-primary_dark transition-all shadow-glow hover:shadow-glow-lg active:scale-95"
              >
                Launch Console <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border-bright text-base font-medium text-text rounded-xl hover:border-primary/40 hover:text-primary transition-colors"
              >
                View Documentation
              </Link>
            </div>

            {/* Terminal hint */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-border-bright/20 bg-background/40 text-sm font-mono text-text_muted">
              <Terminal className="h-4 w-4 text-primary" />
              <span>sudo bash install.sh</span>
              <span className="text-text_muted/40">·</span>
              <span className="text-primary">5 min setup</span>
            </div>
          </div>
        </motion.div>
      </AnimatedSection>
    </div>
  </section>
);

/* ─── Landing Page ────────────────────────────────────────────── */
export const Landing = () => (
  <div className="overflow-x-hidden">
    <HeroSection />
    <TechStrip />
    <ProblemSection />
    <HowItWorks />
    <FeaturesSection />
    <SecurityIntelligence />
    <DashboardPreview />
    <CTASection />
  </div>
);
