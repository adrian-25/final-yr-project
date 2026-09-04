import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, ChevronRight, Copy, CheckCircle, Book, Terminal,
  Server, Cpu, Radio, Lock, Zap, Activity, GitBranch,
  Settings, Code, FileText, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const sections = [
  { id: 'getting-started', label: 'Getting Started', icon: <Book className="h-4 w-4" /> },
  { id: 'architecture', label: 'Architecture', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'agent-install', label: 'Agent Installation', icon: <Server className="h-4 w-4" /> },
  { id: 'agent-config', label: 'Agent Configuration', icon: <Settings className="h-4 w-4" /> },
  { id: 'detection-engine', label: 'Detection Engine', icon: <Activity className="h-4 w-4" /> },
  { id: 'ml-models', label: 'ML Models', icon: <Cpu className="h-4 w-4" /> },
  { id: 'ebpf', label: 'eBPF Monitoring', icon: <Radio className="h-4 w-4" /> },
  { id: 'policy-engine', label: 'Policy Engine', icon: <Lock className="h-4 w-4" /> },
  { id: 'api-reference', label: 'API Reference', icon: <Code className="h-4 w-4" /> },
  { id: 'attack-events', label: 'Attack Events', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 'deployment', label: 'Deployment', icon: <Zap className="h-4 w-4" /> },
];

function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl border border-border-bright/20 bg-background/60 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-bright/20 bg-surface/30">
        <span className="text-xs font-mono text-text_muted">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text_muted hover:text-white transition-colors"
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="text-2xl font-black text-white mb-6 pb-3 border-b border-border-bright/20">{title}</h2>
      <div className="space-y-4 text-text_muted leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export const Docs = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="border-b border-border-bright/20 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Book className="h-5 w-5" /></div>
            <div>
              <h1 className="text-2xl font-black text-white">Documentation</h1>
              <p className="text-sm text-text_muted">ARCDIS Platform Guide</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-text_muted uppercase tracking-wider mb-4">Contents</p>
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === s.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text_muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="opacity-70">{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">

            <Section id="getting-started" title="Getting Started">
              <p>ARCDIS is a three-component system: a Python agent that runs on each Linux endpoint, a FastAPI backend that centralizes data, and a React console for monitoring and management.</p>
              <p className="font-medium text-white mt-4">Prerequisites</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Ubuntu 20.04 LTS or Ubuntu 22.04 LTS on each protected endpoint</li>
                <li>Python 3.9+ with pip</li>
                <li>MongoDB instance (local or remote)</li>
                <li>Node.js 18+ for the frontend (development only)</li>
              </ul>
              <p className="font-medium text-white mt-6">Quick Start (5 minutes)</p>
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>Create an account at the ARCDIS console</li>
                <li>Navigate to Deploy Agent and generate an Agent ID</li>
                <li>Copy your User Token from Settings</li>
                <li>Run the installer on your Linux machine</li>
                <li>Verify the agent appears in your Endpoints view</li>
              </ol>
            </Section>

            <Section id="architecture" title="Architecture">
              <p>ARCDIS uses a hub-and-spoke architecture. Each agent operates independently on its host, performing all detection and response locally. The backend acts purely as a collection and query layer.</p>
              <CodeBlock lang="text" code={`ARCDIS Web UI (React)
        │
        │  REST API (JWT-authenticated)
        ▼
ARCDIS Backend (FastAPI + MongoDB)
        │
        │  Attack Events (HTTP POST)
        ▼
ARCDIS Agent (Python)
        │
        ▼
   Ubuntu / Linux Host`} />
              <p>The agent registers itself with the backend on startup using its <code className="text-primary font-mono text-sm">AGENT_ID</code> and <code className="text-primary font-mono text-sm">USER_ID</code>. After the first registration the backend issues a per-agent token that is stored in the agent's <code className="text-primary font-mono text-sm">.env</code>. All subsequent requests (heartbeats, attack reports) are authenticated with <code className="text-primary font-mono text-sm">X-Agent-Id</code> + <code className="text-primary font-mono text-sm">X-Agent-Token</code> headers.</p>
            </Section>

            <Section id="agent-install" title="Agent Installation">
              <p>The recommended installation method is the included installer script, which sets up a systemd service for persistent background operation.</p>
              <p className="font-medium text-white">Option A — Automated Installation</p>
              <CodeBlock code={`# Download and prepare installer
chmod +x install.sh

# Run with sudo (required for systemd registration)
sudo ./install.sh

# The script will:
#   - Install python3-bpfcc and linux-headers
#   - Create the Python virtual environment
#   - Register the arcdis-agent systemd service and start it`} />
              <p className="font-medium text-white">Option B — Manual / Development</p>
              <CodeBlock code={`# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (pre-populated .env is included in the downloaded ZIP)
# Edit .env: verify AGENT_ID, USER_ID, BACKEND_URL are correct

# Run with sudo (required for cross-user process termination)
sudo ./venv/bin/python agent.py`} />
              <p>The agent requires <code className="text-primary font-mono text-sm">sudo</code> to terminate processes owned by other users and to modify crontabs for all system users.</p>
            </Section>

            <Section id="agent-config" title="Agent Configuration">
              <p>Configuration is managed through a <code className="text-primary font-mono text-sm">.env</code> file in the agent directory.</p>
              <CodeBlock lang="env" code={`# Required — pre-populated when you download the agent from the dashboard
AGENT_ID=agt_your_unique_id
USER_ID=<your MongoDB user _id>
AGENT_TOKEN=                   # written automatically after first registration
BACKEND_URL=http://localhost:8000

# Optional tuning
HEARTBEAT_INTERVAL=30          # seconds
MONITOR_INTERVAL=2             # process scan interval in seconds`} />
            </Section>

            <Section id="detection-engine" title="Detection Engine">
              <p>The detection engine is composed of four monitors that run concurrently: process, filesystem, cron, and eBPF. Each monitor produces structured events that pass through the ML engine and risk evaluator.</p>
              <CodeBlock lang="python" code={`# Event structure passed to ML engine
{
  "event_type": "process",      # process | fs | cron | ebpf
  "features": {
    "child_count": 23,
    "spawn_rate": 2.3,
    "cpu_percent": 94.2,
    "memory_mb": 342,
    "parent_pid": 4821,
  },
  "context": {
    "process_name": "bash",
    "parent_name": "sshd",
    "pid": 4821
  }
}`} />
            </Section>

            <Section id="ml-models" title="ML Models">
              <p>ARCDIS ships with pre-trained scikit-learn IsolationForest models. Each model was trained on normal Linux system behavior and scores new observations as anomalous (score closer to 1.0) or normal (closer to 0.0).</p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border-bright/20">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-text_muted uppercase">Model File</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-text_muted uppercase">Domain</th>
                      <th className="text-left py-2 text-xs font-semibold text-text_muted uppercase">Key Features</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-bright/10">
                    {[
                      ['local_tree_model.pkl', 'Process trees', 'child_count, spawn_rate, depth'],
                      ['local_process_model.pkl', 'Individual processes', 'cpu_percent, memory_mb, uptime'],
                      ['local_fs_model.pkl', 'Filesystem', 'write_rate, file_count, entropy'],
                      ['local_ebpf_model.pkl', 'eBPF events', 'syscall_freq, net_events, exec_count'],
                      ['local_cron_model.pkl', 'Cron jobs', 'line_length, entropy, keyword_score'],
                    ].map(([file, domain, features]) => (
                      <tr key={file}>
                        <td className="py-2.5 pr-4 font-mono text-primary text-xs">{file}</td>
                        <td className="py-2.5 pr-4 text-xs text-white">{domain}</td>
                        <td className="py-2.5 text-xs text-text_muted">{features}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">If a model file is missing or corrupt, ARCDIS automatically trains a fresh baseline model from the first 100 observations collected on the endpoint.</p>
            </Section>

            <Section id="ebpf" title="eBPF Monitoring">
              <p>The eBPF monitor attaches probes to Linux kernel hooks to observe system activity at the lowest level, complementing the userspace process and filesystem monitors.</p>
              <CodeBlock code={`# eBPF monitor startup log
[INFO] Attaching eBPF probes...
[INFO] Probe: sys_execve  → attached (process execution)
[INFO] Probe: sys_connect → attached (outbound network)
[INFO] Probe: sys_open    → attached (file access)
[INFO] eBPF monitor active — reporting to ML engine`} />
              <p><strong className="text-white">Note:</strong> eBPF monitoring requires Linux kernel 5.4+ and root privileges. The agent will start without eBPF if probes cannot be attached, falling back to userspace-only monitoring.</p>
            </Section>

            <Section id="policy-engine" title="Policy Engine">
              <p>The policy engine maps each combination of risk tier and behavior type to a response action. Policies are defined in <code className="text-primary font-mono text-sm">policies.json</code>.</p>
              <CodeBlock lang="json" code={`{
  "policies": [
    {
      "id": "pol_ransomware",
      "trigger": {
        "risk_tier": "HIGH",
        "behavior_type": "ransomware"
      },
      "action": "QUARANTINE_AND_TERMINATE",
      "reason": "Mass file encryption detected."
    },
    {
      "id": "pol_suspicious_monitoring",
      "trigger": {
        "risk_tier": "SUSPICIOUS",
        "behavior_type": "any"
      },
      "action": "MONITOR_ONLY",
      "reason": "Anomalous but below prevention threshold."
    }
  ]
}`} />
            </Section>

            <Section id="api-reference" title="API Reference">
              <p>The ARCDIS backend exposes a REST API. Interactive documentation is available at <code className="text-primary font-mono text-sm">http://your-backend:8000/docs</code>.</p>
              <div className="space-y-3 mt-4">
                {[
                  { method: 'POST', path: '/api/auth/register', desc: 'Register a new user account' },
                  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate and receive JWT' },
                  { method: 'GET', path: '/api/users/me', desc: 'Get current authenticated user' },
                  { method: 'POST', path: '/api/agents/register', desc: 'Register an agent (agent → backend)' },
                  { method: 'GET', path: '/api/agents', desc: 'List all agents for current user' },
                  { method: 'POST', path: '/api/agents/heartbeat', desc: 'Send agent heartbeat' },
                  { method: 'POST', path: '/api/attacks', desc: 'Submit attack event (agent → backend)' },
                  { method: 'GET', path: '/api/attacks', desc: 'List attack events for current user' },
                ].map(e => (
                  <div key={e.path} className="flex items-center gap-3 p-3 rounded-lg border border-border-bright/20 bg-surface/30">
                    <span className={`text-xs font-mono font-bold w-10 ${e.method === 'GET' ? 'text-accent' : 'text-primary'}`}>{e.method}</span>
                    <code className="text-xs font-mono text-white">{e.path}</code>
                    <span className="text-xs text-text_muted ml-auto">{e.desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="attack-events" title="Attack Events">
              <p>The agent submits structured AttackEvent objects to the backend when a threat is detected. These are stored in MongoDB and surfaced in the console.</p>
              <CodeBlock lang="json" code={`{
  "agent_id": "agt_a1b2c3",
  "technique": "T1059",
  "title": "Suspicious Process Tree",
  "description": "Anomalous child spawn rate detected.",
  "severity": "HIGH",
  "status": "MITIGATED",
  "action_taken": "TERMINATE_PROCESS_TREE",
  "risk_score": 0.94,
  "features": {
    "parent_pid": 4821,
    "child_count": 23,
    "spawn_rate": "2.3/s",
    "cpu_percent": 94.2
  },
  "detection_methods": [
    "Behavioral anomaly",
    "ML process tree model"
  ],
  "timestamp": "2026-09-04T13:22:10Z"
}`} />
            </Section>

            <Section id="deployment" title="Deployment">
              <p>For production deployments, ARCDIS components should be separated across hosts.</p>
              <CodeBlock code={`# Start backend with uvicorn (production)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Enable and start agent service
sudo systemctl enable arcdis-agent
sudo systemctl start arcdis-agent

# Check agent status
sudo systemctl status arcdis-agent

# View agent logs
sudo journalctl -u arcdis-agent -f`} />
              <p>For the frontend, build a static bundle and serve via nginx:</p>
              <CodeBlock code={`cd client
npm run build
# Serve dist/ via nginx or any static host`} />
            </Section>

          </main>
        </div>
      </div>
    </div>
  );
};
