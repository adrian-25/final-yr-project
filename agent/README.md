# ARCDIS Agent

The ARCDIS Python Agent runs on Ubuntu machines to provide continuous behavioural
monitoring and prevention against attacks such as process-creation storms (T1059),
resource hijacking (T1496), ransomware (T1486), and cron persistence (T1053.003).

---

## Authentication Flow

The agent uses a **two-phase authentication** model:

### Phase 1 — First registration

On the very first run the agent has no token yet.  It sends a `POST /api/agents/register`
request with the `X-User-Id` header set to the MongoDB user-ID provided in the
downloaded `.env`.  If the user exists the backend:

1. Creates a per-agent record in MongoDB.
2. Generates a cryptographically random 64-character token for this agent only.
3. Returns the token **once** in the response body (`agent_token`).

The agent automatically writes this token to `AGENT_TOKEN` in its `.env` file.

### Phase 2 — All subsequent requests (heartbeats, attack reports)

Every subsequent call uses `X-Agent-Id` + `X-Agent-Token` headers.  The backend
verifies the token against the bcrypt hash stored in MongoDB.  No shared global
secret is ever used.

---

## Environment Variables (`.env`)

| Variable            | Description                                               |
|---------------------|-----------------------------------------------------------|
| `BACKEND_URL`       | URL of the FastAPI backend, e.g. `http://localhost:8000`  |
| `USER_ID`           | MongoDB `_id` of the owning user (set by the dashboard)   |
| `AGENT_ID`          | Unique identifier for this machine (set by the dashboard) |
| `AGENT_TOKEN`       | Written automatically after first registration            |
| `MONITOR_INTERVAL`  | Process scan interval in seconds (default: `2`)           |
| `HEARTBEAT_INTERVAL`| Heartbeat interval in seconds (default: `30`)             |

---

## Manual Setup & Testing

1. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Download the pre-configured `.env` from the **Deploy Agent** page of the
   ARCDIS dashboard (it already contains `USER_ID` and `AGENT_ID`).

3. Run the agent (requires `sudo` for cross-user process termination):
   ```bash
   sudo ./venv/bin/python agent.py
   ```

On startup the agent registers itself, receives its per-agent token, and begins
sending heartbeats and attack events to the backend.

---

## Production Installation

To install the agent as a persistent `systemd` service, download the agent ZIP
from the dashboard's **Deploy Agent** page, then run:

```bash
sudo chmod +x install.sh
sudo ./install.sh
```

The installer sets up the Python virtual environment, installs eBPF dependencies
(`python3-bpfcc`, `linux-headers`), creates the systemd unit, and starts the
service automatically.

Check status with:
```bash
sudo systemctl status arcdis-agent
```

---

## eBPF Status

If `python3-bpfcc` or the matching `linux-headers` package is not installed, the
agent starts in **degraded mode**: process-tree, ransomware-IO, and cron detection
remain active, but kernel-level syscall tracing is unavailable.

The agent will log a warning and report `status=degraded` to the backend so the
dashboard can display the correct state.

Install eBPF support with:
```bash
sudo apt-get install -y python3-bpfcc linux-headers-$(uname -r)
```

---

## Detections

| MITRE Technique | Description                               |
|-----------------|-------------------------------------------|
| T1059           | Command interpreter process-creation storm|
| T1496           | Resource hijacking / cryptominer          |
| T1486           | Ransomware (IO burst via process or eBPF) |
| T1053.003       | Cron persistence                          |
| T1046           | Anomalous process (general ML)            |
