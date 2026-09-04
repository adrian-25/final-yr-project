import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Server, Database, Globe, ChevronRight, Cpu, Radio,
  Lock, Zap, Activity, GitBranch, FileWarning, ArrowDown, ArrowRight
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

const components = {
  frontend: {
    id: 'frontend',
    label: 'ARCDIS Web UI',
    sublabel: 'React + Vite',
    icon: <Globe className="h-6 w-6" />,
    color: 'text-accent',
    border: 'border-accent/30',
    bg: 'bg-accent/10',
    desc: 'The React-based security console. Authenticated via JWT. Communicates with the backend over REST to display real-time agent status, attack telemetry, and system metrics. Built with Vite, Tailwind CSS, Recharts, and React Router.',
    tech: ['React 18', 'Vite', 'Tailwind CSS', 'Recharts', 'React Router v7', 'Axios', 'Framer Motion'],
  },
  backend: {
    id: 'backend',
    label: 'ARCDIS Backend',
    sublabel: 'FastAPI + JWT',
    icon: <Server className="h-6 w-6" />,
    color: 'text-primary',
    border: 'border-primary/30',
    bg: 'bg-primary/10',
    desc: 'The central FastAPI server. Handles user authentication, agent registration, heartbeat tracking, and attack event storage. Issues and verifies JWTs. All agent-to-backend communication is authenticated.',
    tech: ['FastAPI', 'Python 3.11+', 'JWT (python-jose)', 'bcrypt', 'Motor (async)', 'Pydantic v2', 'Uvicorn'],
  },
  db: {
    id: 'db',
    label: 'MongoDB',
    sublabel: 'Persistent Storage',
    icon: <Database className="h-6 w-6" />,
    color: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10',
    desc: 'MongoDB stores all user accounts, registered agents, heartbeat history, and attack event telemetry. Motor provides async MongoDB access from the FastAPI backend. Schema validated via Pydantic models.',
    tech: ['MongoDB', 'Motor (async driver)', 'Pydantic schemas', 'Document store'],
  },
  agent: {
    id: 'agent',
    label: 'ARCDIS Agent',
    sublabel: 'Python — Ubuntu/Linux',
    icon: <Cpu className="h-6 w-6" />,
    color: 'text-warning',
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    desc: 'The local detection and response engine. Runs as a systemd service on Ubuntu machines. Performs all monitoring, ML inference, risk evaluation, and policy execution locally. Reports structured AttackEvent telemetry to the backend.',
    tech: ['Python 3', 'psutil', 'scikit-learn', 'joblib', 'eBPF', 'systemd', 'requests'],
  },
};

const agentModules = [
  { icon: <Activity className="h-4 w-4" />, label: 'Process Monitor', color: 'text-accent', desc: 'Tracks all processes, builds parent-child trees, monitors CPU/memory' },
  { icon: <FileWarning className="h-4 w-4" />, label: 'Filesystem Monitor', color: 'text-danger', desc: 'Watches protected dirs for suspicious write activity' },
  { icon: <Lock className="h-4 w-4" />, label: 'Cron Scanner', color: 'text-warning', desc: 'Scans crontabs for malicious persistence entries' },
  { icon: <Radio className="h-4 w-4" />, label: 'eBPF Monitor', color: 'text-purple-400', desc: 'Kernel-level syscall and network event tracing' },
  { icon: <Cpu className="h-4 w-4" />, label: 'ML Engine', color: 'text-primary', desc: '6 IsolationForest models for anomaly scoring' },
  { icon: <GitBranch className="h-4 w-4" />, label: 'Risk Engine', color: 'text-orange-400', desc: 'Evaluates ML output into risk tiers' },
  { icon: <Lock className="h-4 w-4" />, label: 'Policy Engine', color: 'text-white', desc: 'Maps risk+behavior to response action' },
  { icon: <Zap className="h-4 w-4" />, label: 'Prevention Engine', color: 'text-danger', desc: 'Executes termination, quarantine, cron removal' },
];

export const Architecture = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0 hero-bg" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary mb-6">
              <GitBranch className="h-3.5 w-3.5" /> TECHNICAL ARCHITECTURE
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
              How ARCDIS <span className="text-gradient">is built.</span>
            </h1>
            <p className="text-lg text-text_muted max-w-2xl mx-auto">
              A three-tier system: a local Python agent on each endpoint, a centralized FastAPI backend, and a React security console. All communication is authenticated and structured.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Interactive Architecture Diagram */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.p variants={fadeUp} className="text-center text-xs font-mono text-text_muted mb-8 tracking-widest">
              CLICK ANY COMPONENT TO SEE DETAILS
            </motion.p>

            {/* Diagram */}
            <div className="space-y-6">
              {/* Frontend */}
              <div className="flex justify-center">
                <motion.div
                  variants={fadeUp}
                  onClick={() => setSelected(selected === 'frontend' ? null : 'frontend')}
                  className={`cursor-pointer w-80 p-5 rounded-2xl border transition-all ${
                    selected === 'frontend'
                      ? 'border-accent/60 bg-accent/10 shadow-glow-accent'
                      : 'border-border-bright/30 bg-surface/60 hover:border-accent/40 hover:bg-accent/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-accent/10 text-accent">{components.frontend.icon}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{components.frontend.label}</div>
                      <div className="text-xs text-text_muted">{components.frontend.sublabel}</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center items-center gap-3">
                <ArrowDown className="h-5 w-5 text-border-bright" />
                <span className="text-xs font-mono text-text_muted">REST API · JWT</span>
              </div>

              {/* Backend */}
              <div className="flex justify-center">
                <motion.div
                  variants={fadeUp}
                  onClick={() => setSelected(selected === 'backend' ? null : 'backend')}
                  className={`cursor-pointer w-80 p-5 rounded-2xl border transition-all ${
                    selected === 'backend'
                      ? 'border-primary/60 bg-primary/10 shadow-glow'
                      : 'border-border-bright/30 bg-surface/60 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">{components.backend.icon}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{components.backend.label}</div>
                      <div className="text-xs text-text_muted">{components.backend.sublabel}</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Fork arrows */}
              <div className="flex justify-center gap-24 items-start">
                <div className="flex flex-col items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-border-bright" />
                  {/* MongoDB */}
                  <motion.div
                    variants={fadeUp}
                    onClick={() => setSelected(selected === 'db' ? null : 'db')}
                    className={`cursor-pointer w-52 p-4 rounded-2xl border transition-all ${
                      selected === 'db'
                        ? 'border-green-500/60 bg-green-500/10'
                        : 'border-border-bright/30 bg-surface/60 hover:border-green-500/40 hover:bg-green-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-green-500/10 text-green-400">{components.db.icon}</div>
                      <div>
                        <div className="font-bold text-white text-sm">{components.db.label}</div>
                        <div className="text-xs text-text_muted">{components.db.sublabel}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-border-bright" />
                    <span className="text-xs font-mono text-text_muted">Attack Events</span>
                  </div>
                  {/* Agent */}
                  <motion.div
                    variants={fadeUp}
                    onClick={() => setSelected(selected === 'agent' ? null : 'agent')}
                    className={`cursor-pointer w-64 p-4 rounded-2xl border transition-all ${
                      selected === 'agent'
                        ? 'border-warning/60 bg-warning/10'
                        : 'border-border-bright/30 bg-surface/60 hover:border-warning/40 hover:bg-warning/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-warning/10 text-warning">{components.agent.icon}</div>
                      <div>
                        <div className="font-bold text-white text-sm">{components.agent.label}</div>
                        <div className="text-xs text-text_muted">{components.agent.sublabel}</div>
                      </div>
                    </div>
                  </motion.div>
                  <ArrowDown className="h-5 w-5 text-border-bright" />
                  <div className="px-4 py-2 rounded-lg border border-border-bright/20 bg-surface/40">
                    <span className="text-xs font-mono text-text_muted">Ubuntu / Linux</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail panel */}
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-8 p-6 rounded-2xl border ${components[selected].border} ${components[selected].bg}`}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`p-3 rounded-xl ${components[selected].bg} ${components[selected].color}`}>
                    {components[selected].icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{components[selected].label}</h3>
                    <p className={`text-sm font-mono ${components[selected].color}`}>{components[selected].sublabel}</p>
                  </div>
                </div>
                <p className="text-sm text-text_muted leading-relaxed mb-5">{components[selected].desc}</p>
                <div className="flex flex-wrap gap-2">
                  {components[selected].tech.map(t => (
                    <span key={t} className="px-2.5 py-1 text-xs font-mono bg-background rounded-md border border-border-bright/30 text-text_muted">{t}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatedSection>
        </div>
      </section>

      {/* Agent modules breakdown */}
      <section className="py-16 bg-surface/20 border-y border-border-bright/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-white mb-4">
                Agent Module Breakdown
              </motion.h2>
              <motion.p variants={fadeUp} className="text-text_muted max-w-xl mx-auto">
                The ARCDIS agent is composed of 8 cooperating modules, each responsible for a specific detection or response domain.
              </motion.p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {agentModules.map((m) => (
                <motion.div
                  key={m.label}
                  variants={fadeUp}
                  className="p-5 rounded-xl border border-border-bright/20 bg-surface/40 hover:border-primary/20 transition-colors"
                >
                  <div className={`inline-flex p-2.5 rounded-lg bg-background mb-4 ${m.color}`}>{m.icon}</div>
                  <div className="font-semibold text-white text-sm mb-2">{m.label}</div>
                  <p className="text-xs text-text_muted leading-relaxed">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Data flow */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-4">Attack Event Flow</motion.h2>
              <motion.p variants={fadeUp} className="text-text_muted">From kernel event to dashboard entry.</motion.p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                'Kernel Event', 'psutil / eBPF', 'Feature Extraction', 'ML Inference',
                'Risk Evaluation', 'Policy Engine', 'Prevention', 'AttackEvent', 'Backend API', 'Dashboard'
              ].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <motion.div
                    variants={fadeUp}
                    className="px-4 py-2.5 rounded-lg border border-border-bright/30 bg-surface/40 text-xs font-mono text-text_muted"
                  >
                    {step}
                  </motion.div>
                  {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-border-bright flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-bright/20 py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <AnimatedSection>
            <motion.h2 variants={fadeUp} className="text-3xl font-black text-white mb-4">Deploy the agent</motion.h2>
            <motion.p variants={fadeUp} className="text-text_muted mb-8">Get an endpoint protected in under 5 minutes.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-background font-bold rounded-xl hover:bg-primary_dark shadow-glow transition-all text-sm">
                Launch Console <ChevronRight className="h-4 w-4" />
              </Link>
              <Link to="/docs" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border-bright text-sm font-medium text-text rounded-xl hover:border-primary/40 transition-colors">
                Installation Guide
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};
