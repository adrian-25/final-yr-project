# ARCDIS — Setup & Installation Guide

Step-by-step instructions to get the entire ARCDIS stack running from a fresh clone. Follow this guide in order.

---

## Table of Contents

- [Requirements](#requirements)
- [Step 1 — Clone the Repository](#step-1--clone-the-repository)
- [Step 2 — Backend Setup](#step-2--backend-setup)
- [Step 3 — Backend Environment Configuration](#step-3--backend-environment-configuration)
- [Step 4 — Start MongoDB](#step-4--start-mongodb)
- [Step 5 — Start the Backend](#step-5--start-the-backend)
- [Step 6 — Frontend Setup](#step-6--frontend-setup)
- [Step 7 — Frontend Environment Configuration](#step-7--frontend-environment-configuration)
- [Step 8 — Start the Frontend](#step-8--start-the-frontend)
- [Step 9 — Deploy the Agent](#step-9--deploy-the-agent)
- [Step 10 — Agent Registration](#step-10--agent-registration)
- [Step 11 — Dashboard Login](#step-11--dashboard-login)
- [Step 12 — Verify the System](#step-12--verify-the-system)
- [Optional — Systemd Service Setup](#optional--systemd-service-setup)
- [Environment Variable Reference](#environment-variable-reference)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### For the Backend and Frontend (any OS)

| Requirement | Minimum Version | Notes |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| pip | 22+ | comes with Python |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| MongoDB | 6+ | must be running on localhost:27017 |

### For the Agent (Linux only)

| Requirement | Notes |
|---|---|
| Linux (Ubuntu 20.04+ recommended) | Agent uses Linux-specific APIs |
| Python 3.11+ | same as above |
| Root / sudo access | required for process termination and cron modification |
| `python3-bpfcc` (optional) | enables eBPF kernel monitoring |
| `linux-headers-$(uname -r)` (optional) | required by BCC for eBPF compilation |

> The agent will operate in **degraded mode** (userspace monitoring only) if `python3-bpfcc` is not installed. All process, filesystem, and cron monitoring remains active.

---

## Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd ARCDIS
```

You should see the following top-level structure:

```
ARCDIS/
├── README.md
├── .gitignore
├── backend/
├── agent/
├── client/
└── docs/
```

---

## Step 2 — Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux / macOS
# On Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

The `requirements.txt` installs:
- `fastapi`, `uvicorn[standard]`, `motor`, `pydantic[email]`
- `pydantic-settings`, `python-jose[cryptography]`
- `passlib[bcrypt]`, `bcrypt<4.0.0`, `python-multipart`

---

## Step 3 — Backend Environment Configuration

```bash
# Copy the example file
cp .env.example .env
```

Open `backend/.env` in a text editor and set the required values:

```env
# JWT signing secret — REQUIRED
# Generate a strong key with the command below:
# python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=YOUR_SECRET_KEY_HERE

# JWT token lifetime in minutes (default 24 hours)
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# MongoDB connection string
MONGODB_URL=mongodb://localhost:27017

# MongoDB database name
DATABASE_NAME=arcdis_db
```

> **Important:** The backend will refuse to start if `SECRET_KEY` is left as `change_me_in_production`. This is enforced in `config.py` at startup.

Generate a secure key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 4 — Start MongoDB

ARCDIS requires MongoDB 6+ running on `localhost:27017`.

**Ubuntu / Debian:**
```bash
# Install MongoDB if not already installed
sudo apt-get install -y mongodb

# Start and enable the service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify it is running
sudo systemctl status mongod
```

**Check connection manually:**
```bash
mongosh --eval "db.runCommand({ping: 1})"
# Should return: { ok: 1 }
```

> The database `arcdis_db` and all three collections (`users`, `agents`, `attacks`) are created automatically by the backend on first startup. You do not need to create them manually.

---

## Step 5 — Start the Backend

From the `backend/` directory with the virtual environment activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output on successful start:
```
INFO:     Started server process [...]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

If you see `[FATAL] SECRET_KEY is still set to the insecure default value` — update `backend/.env` with a real secret key.

**Verify the backend:**
```bash
curl http://localhost:8000/
# Returns: {"message": "Welcome to ARCDIS API"}
```

**Interactive API documentation:**
Open `http://localhost:8000/docs` in your browser to access the Swagger UI.

---

## Step 6 — Frontend Setup

Open a **new terminal** (leave the backend running).

```bash
cd client
npm install
```

This installs all frontend dependencies listed in `package.json`, including React 18, Vite 5, Tailwind CSS 3, Recharts, Axios, Framer Motion, and Lucide React.

---

## Step 7 — Frontend Environment Configuration

```bash
cp .env.example .env
```

Open `client/.env` and confirm the backend URL:

```env
# Backend API base URL (no trailing slash)
VITE_API_URL=http://localhost:8000/api
```

This is the only variable required. If your backend runs on a different host or port, update this value accordingly.

---

## Step 8 — Start the Frontend

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in ...ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open `http://localhost:5173` in your browser. You should see the ARCDIS landing page.

---

## Step 9 — Deploy the Agent

The agent must be deployed on a **Linux endpoint** where you want monitoring to occur.

### Option A — Via the Dashboard (Recommended)

1. Open `http://localhost:5173` and register an account.
2. Log in to the dashboard.
3. Navigate to **Deploy Agent** in the sidebar.
4. Enter a unique **Agent ID** (e.g. `agt_webserver_01`).
5. Click **Download Agent**.
6. Transfer the downloaded `arcdis_agent.zip` to the Linux endpoint.

On the Linux endpoint:
```bash
unzip arcdis_agent.zip
cd arcdis_agent
```

### Option B — Direct Copy

Copy the entire `agent/` directory to the Linux endpoint and manually create `agent/.env` using `agent/.env.example` as the template, filling in `USER_ID` and `AGENT_ID`.

### Install Agent Dependencies

On the Linux endpoint:
```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Optional: Install eBPF support (Ubuntu/Debian)
sudo apt-get install -y python3-bpfcc linux-headers-$(uname -r)
```

---

## Step 10 — Agent Registration

Run the agent on the Linux endpoint (requires root for full prevention capabilities):

```bash
sudo python3 agent.py
```

On **first run**, the agent:
1. Validates that `AGENT_ID` and `USER_ID` are set in `.env`
2. Sends `POST /api/agents/register` with `X-User-Id` header
3. Receives a 64-character cryptographic token (`agent_token`) from the backend
4. Writes `AGENT_TOKEN=<token>` to `.env`
5. Starts the eBPF monitor (or marks itself degraded if BCC is unavailable)
6. Starts the heartbeat thread
7. Begins the monitoring loop

Expected agent startup output:
```
INFO - Initializing ARCDIS Agent...
INFO - Registering agent agt_webserver_01 with ARCDIS backend...
INFO - Agent registered. Per-agent token stored.
INFO - AGENT_TOKEN written to .env.
INFO - eBPF Monitor started successfully.      (or: Agent running in degraded mode)
INFO - Heartbeat thread started (30s interval).
INFO - Attack event sender thread started.
INFO - Monitor started. Window: 10s, Max Spawns: 15, Max Mem: 500.0MB
```

On **subsequent runs**, the token is already in `.env` and the registration endpoint returns `400 Already registered` — this is treated as success.

---

## Step 11 — Dashboard Login

1. Open `http://localhost:5173` in your browser.
2. Click **Get Started** or navigate to `/register`.
3. Create a user account with your email, password, and full name.
4. Log in with those credentials.
5. Navigate to **Agents** — your registered agent should appear with status `online` (or `degraded`).
6. Navigate to **Dashboard** — the overview will update as events are detected.

---

## Step 12 — Verify the System

Use this checklist to confirm all components are running correctly:

| Check | How to Verify | Expected Result |
|---|---|---|
| Backend is running | `curl http://localhost:8000/` | `{"message": "Welcome to ARCDIS API"}` |
| MongoDB is connected | Backend startup logs | No connection errors |
| JWT auth works | POST `/api/auth/login` with valid credentials | `access_token` returned |
| JWT protection works | GET `/api/agents` without token | 401 Unauthorized |
| Agent is registered | Check `/api/agents` or Dashboard → Agents | Agent appears in list |
| Heartbeat working | Wait 30s, check agent `last_seen` in dashboard | Timestamp updates |
| Agent status correct | Dashboard → Agents | `online` or `degraded` |
| eBPF status | Agent startup logs | Either "started successfully" or "degraded mode" |
| Offline detection | Stop the agent, wait 120s | Status changes to `offline` |
| Attack reporting | Trigger a test detection | Event appears in Dashboard → Attacks |

---

## Optional — Systemd Service Setup

The agent download ZIP includes an `install.sh` script that sets up the agent as a `systemd` service:

```bash
# On the Linux endpoint, as root:
sudo bash install.sh
```

`install.sh` does the following:
1. Installs `python3-bpfcc` and `linux-headers-$(uname -r)` via `apt-get`
2. Creates a Python virtual environment with `--system-site-packages` (to inherit bcc)
3. Installs `requirements.txt` into the venv
4. Creates `/etc/systemd/system/arcdis-agent.service`
5. Enables and starts the service

The generated service unit file:
```ini
[Unit]
Description=ARCDIS IPS Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/arcdis_agent
ExecStart=/path/to/arcdis_agent/venv/bin/python /path/to/arcdis_agent/agent.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

**Check service status:**
```bash
sudo systemctl status arcdis-agent
```

**View logs:**
```bash
sudo journalctl -u arcdis-agent -f
# Or read the rotating log file:
sudo tail -f /var/log/arcdis/agent.log
```

**Stop/restart:**
```bash
sudo systemctl stop arcdis-agent
sudo systemctl restart arcdis-agent
```

---

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | `change_me_in_production` | JWT signing secret. Must be changed — backend exits on insecure default. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | JWT expiry in minutes (24 hours). |
| `MONGODB_URL` | No | `mongodb://localhost:27017` | MongoDB connection string. |
| `DATABASE_NAME` | No | `arcdis_db` | MongoDB database name. |

### Frontend (`client/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000/api` | Backend API base URL. |

### Agent (`agent/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `AGENT_ID` | **Yes** | — | Unique identifier for this agent. Set by dashboard download. |
| `USER_ID` | **Yes** | — | MongoDB `_id` of the owning user. Set by dashboard download. |
| `AGENT_TOKEN` | Auto | — | Per-agent auth token. Written automatically after first registration. **Do not set manually.** |
| `BACKEND_URL` | No | `http://localhost:8000` | Backend server URL. No trailing slash. |
| `MONITOR_INTERVAL` | No | `2` | Monitoring loop interval in seconds. |
| `HEARTBEAT_INTERVAL` | No | `30` | Heartbeat send interval in seconds. |
| `MAX_CHILDREN_PER_WINDOW` | No | `15` | Spawn detection threshold. |
| `MAX_CHILD_MEMORY_MB` | No | `500` | Memory threshold for child processes (MB). |
| `SPAWN_WINDOW_SECONDS` | No | `10` | Sliding window for spawn counting (seconds). |
| `EBPF_FILE_CREATION_THRESHOLD` | No | `100` | File creations per window before eBPF triggers. |
| `EBPF_WINDOW_SECONDS` | No | `10` | eBPF sliding time window (seconds). |

---

## Troubleshooting

### Backend fails to start with `[FATAL] SECRET_KEY`
Set a proper `SECRET_KEY` in `backend/.env`:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy output into backend/.env
```

### `Connection refused` on MongoDB
```bash
sudo systemctl start mongod
# Check port:
ss -tlnp | grep 27017
```

### Agent registration fails with `User not found`
Ensure `USER_ID` in `agent/.env` matches the MongoDB `_id` of a registered user. The dashboard-generated ZIP pre-fills this correctly.

### eBPF fails to load / agent in degraded mode
Install the required system packages:
```bash
sudo apt-get install -y python3-bpfcc linux-headers-$(uname -r)
```
If kernel headers for the current kernel are not available, the agent will continue in degraded mode with userspace monitoring active.

### Frontend shows 401 on all requests
JWT has expired or `localStorage` token is stale. Log out and log back in. The Axios response interceptor handles this automatically by dispatching `auth:unauthorized`.

### Agent not appearing as `online` in dashboard
Check that the agent is running and can reach the backend. Verify `BACKEND_URL` in `agent/.env` and that port 8000 is reachable from the Linux endpoint. The agent marks itself `online` via heartbeat; the status will update within 30 seconds of a successful heartbeat.

### `npm install` fails
Ensure Node.js 18+ is installed: `node --version`. If using an older version, update Node.js using `nvm` or your system's package manager.
