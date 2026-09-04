import React, { useState } from 'react';
import {
  Download, Copy, Terminal, CheckCircle, Shield, Server,
  RefreshCw, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

function CodeBlock({ code, lang = 'bash' }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };
  return (
    <div className="relative rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/40">
        <span className="text-xs font-mono text-text_muted">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text_muted hover:text-white transition-colors"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
}

function StepCard({ num, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/20">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-sm font-black font-mono text-primary flex-shrink-0">
          {num}
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export const DownloadAgent = () => {
  const [agentId, setAgentId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateId = () => {
    const id = 'agt_' + Math.random().toString(36).substring(2, 12);
    setAgentId(id);
    toast.success('Agent ID generated');
  };

  const handleDownload = async () => {
    if (!agentId) return;
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${baseUrl}/agents/download?agent_id=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arcdis_agent.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Agent package downloaded');
    } catch {
      toast.error('Download unavailable — configure agent manually using the steps below');
    } finally {
      setIsDownloading(false);
    }
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Deploy Agent</h1>
        <p className="text-sm text-text_muted mt-0.5">
          Deploy the ARCDIS agent on a Linux endpoint in under 5 minutes.
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Platform', value: 'Ubuntu 20.04+', icon: Server, color: 'text-accent' },
          { label: 'Language', value: 'Python 3.9+', icon: Terminal, color: 'text-primary' },
          { label: 'Method', value: 'systemd service', icon: Shield, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-surface/60 text-center">
            <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-2`} />
            <div className="text-xs text-text_muted">{s.label}</div>
            <div className="text-sm font-mono font-semibold text-white mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Step 1 — Generate ID */}
      <StepCard num="1" title="Generate Agent Configuration">
        <p className="text-sm text-text_muted mb-4">
          Generate a unique Agent ID to link this machine to your ARCDIS console. Your User Token is your current session JWT.
        </p>
        {!agentId ? (
          <button
            onClick={generateId}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background text-sm font-bold rounded-xl hover:bg-primary_dark transition-all shadow-glow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Generate Agent ID
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-primary/30">
              <div>
                <p className="text-xs text-text_muted mb-1">AGENT_ID</p>
                <p className="font-mono text-primary font-bold">{agentId}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(agentId); toast.success('Copied!'); }}
                className="p-2 rounded-lg text-text_muted hover:text-white hover:bg-white/10 transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-primary">
              <CheckCircle className="h-4 w-4" />
              Agent ID generated — use this in your .env file below
            </div>
          </div>
        )}
      </StepCard>

      {/* Step 2 — Download */}
      <StepCard num="2" title="Download Agent Package">
        <p className="text-sm text-text_muted mb-4">
          Download the pre-configured agent package. If the download endpoint is unavailable, clone from GitHub and configure manually in Step 3.
        </p>
        <button
          onClick={handleDownload}
          disabled={!agentId || isDownloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background text-sm font-bold rounded-xl hover:bg-primary_dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm"
        >
          {isDownloading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Preparing package...</>
          ) : (
            <><Download className="h-4 w-4" /> Download ARCDIS Agent</>
          )}
        </button>
        {!agentId && (
          <p className="text-xs text-text_muted mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Generate an Agent ID first
          </p>
        )}
      </StepCard>

      {/* Step 3 — Configure .env */}
      <StepCard num="3" title="Configure Environment">
        <p className="text-sm text-text_muted mb-4">
          Create a <code className="text-primary font-mono text-xs">.env</code> file in the agent directory with your credentials:
        </p>
        <CodeBlock lang="env" code={`AGENT_ID=${agentId || 'agt_your_generated_id'}
USER_ID=your_user_id_from_account_settings
BACKEND_URL=http://your-backend-host:8000`} />
        <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text_muted">
            Keep your <code className="text-warning font-mono">USER_ID</code> secret. It links the agent to your ARCDIS account.
          </p>
        </div>
      </StepCard>

      {/* Step 4 — Install */}
      <StepCard num="4" title="Install & Start Service">
        <p className="text-sm text-text_muted mb-4">
          Transfer the package to your target Ubuntu machine and run the installer:
        </p>
        <div className="space-y-3">
          <CodeBlock code={`# Transfer and extract
scp arcdis_agent.zip user@your-server:/tmp/
ssh user@your-server
cd /tmp && unzip arcdis_agent.zip && cd arcdis_agent

# Run installer (registers systemd service)
sudo chmod +x install.sh
sudo ./install.sh`} />

          <p className="text-sm text-text_muted">Or run manually (development / testing):</p>
          <CodeBlock code={`# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with sudo (required for cross-user process control)
sudo ./venv/bin/python agent.py`} />
        </div>
      </StepCard>

      {/* Step 5 — Verify */}
      <StepCard num="5" title="Verify & Monitor">
        <p className="text-sm text-text_muted mb-4">
          Check that the agent registered successfully:
        </p>
        <CodeBlock code={`# Check systemd service status
sudo systemctl status arcdis-agent

# View live agent logs
sudo journalctl -u arcdis-agent -f

# Expected output:
# [INFO] Initializing ARCDIS Agent...
# [INFO] Registered with ARCDIS backend.
# [INFO] Heartbeat started.
# [INFO] eBPF monitor active.
# [INFO] Monitoring resumed.`} />

        <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">After successful registration</p>
            <p className="text-xs text-text_muted">Your endpoint will appear in the <strong className="text-primary">Endpoints</strong> page with status <strong className="text-primary">Protected</strong>.</p>
          </div>
        </div>
      </StepCard>

      {/* Support note */}
      <div className="p-5 rounded-xl border border-border-bright/20 bg-surface/30">
        <div className="flex items-start gap-3">
          <Terminal className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Need help?</p>
            <p className="text-xs text-text_muted">
              Full installation guide and troubleshooting in the{' '}
              <a href="/docs#agent-install" className="text-primary hover:underline">Documentation</a>.
              The agent requires Linux kernel 5.4+ for eBPF monitoring and Python 3.9+ for ML inference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
