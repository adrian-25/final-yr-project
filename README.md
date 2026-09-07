<div align="center">

# ARCDIS

### AI-Powered Linux Endpoint Detection, Response & Security Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)]()

</div>

---

## Overview

**ARCDIS** (Autonomous Runtime Cyber Defence & Intrusion System) is a full-stack endpoint detection and response (EDR) platform built for Linux environments. A lightweight Python agent deploys onto Linux machines and continuously monitors process behaviour, filesystem activity, cron persistence, and — where available — kernel-level syscall events via eBPF. Suspicious activity is evaluated by a local machine learning pipeline, classified by risk tier, and responded to autonomously before being reported to a central FastAPI backend and visualised on a React dashboard.

The system is designed to be self-contained: each agent registers independently, authenticates using a per-agent cryptographic token, and operates without manual intervention once deployed.

**Who it is for:** Security researchers, engineering students, and teams seeking to understand or prototype autonomous endpoint defence on Linux systems.

**What makes it technically interesting:**
- ML inference runs entirely on the endpoint — no cloud round-trip required for a detection decision.
- eBPF tracepoints capture file-creation syscalls at the kernel boundary.
- A policy engine drives automated prevention (process termination, file quarantine, cron removal) before human review.
- Zero-trust per-agent authentication: every agent receives a unique bcrypt-hashed token at registration; no shared global secret is used.

---

## Problem Statement

Traditional endpoint security tools are resource-heavy, require cloud connectivity for every decision, and are typically designed for Windows enterprise environments. Linux servers, development machines, and embedded endpoints are frequently under-protected — particularly against behavioural threats such as process storms, resource hijackers, ransomware-style filesystem writes, and cron-based persistence.

ARCDIS addresses this gap by running a local ML-based detection pipeline on the endpoint itself, enabling autonomous response in milliseconds — independent of cloud connectivity — while reporting enriched telemetry to a central platform for visibility and triage.

---

## Why ARCDIS

- **Local-first detection** — ML inference runs on the endpoint. No cloud round-trip is required to make a decision.
- **Autonomous response** — The policy engine terminates processes, removes cron entries, and quarantines files without waiting for human approval.
- **Per-agent zero-trust authentication** — Every agent is issued a unique cryptographic token at registration. No shared secrets.
- **eBPF kernel visibility** — Where `python3-bpfcc` is available, syscall-level file-creation events are captured at the kernel boundary using BCC tracepoints on `open`, `openat`, `creat`, and `openat2`.
- **Graceful degradation** — If eBPF is unavailable, the agent continues operating in degraded mode with full userspace monitoring active and reports its status via heartbeat.
- **Multi-tenant dashboard** — Users see only their own agents and events, enforced at the database query layer.

---

## Key Capabilities

| Capability | Implementation | Status |
|---|---|---|
| Process Tree Monitoring | `psutil` parent-child tree analysis + IsolationForest | ✅ Implemented |
| Filesystem Monitoring | IO rate tracking + directory delta detection + IsolationForest | ✅ Implemented |
| Cron Persistence Detection | Per-user crontab scan + `/etc/crontab` + `/etc/cron.d/` + ML + entropy | ✅ Implemented |
| eBPF Kernel Monitoring | BCC tracepoints on `open`, `openat`, `creat`, `openat2` syscalls | ✅ Implemented |
| ML-Based Anomaly Detection | scikit-learn IsolationForest (5 specialised models) | ✅ Implemented |
| Risk Tier Evaluation | Score-to-tier mapping (LOW / SUSPICIOUS / HIGH) | ✅ Implemented |
| Policy Engine | JSON-driven policy selection by risk tier and behaviour type | ✅ Implemented |
| Process Tree Termination | Suspend → terminate → force-kill with verification | ✅ Implemented |
| Single Process Termination | Targeted termination without affecting child processes | ✅ Implemented |
| File Quarantine | Suspend → move files → terminate (ransomware response) | ✅ Implemented |
| Cron Entry Removal | Surgical line removal from user crontabs via `crontab -u <user> -` | ✅ Implemented |
| Per-Agent Authentication | `X-Agent-Id` + `X-Agent-Token` headers, bcrypt-hashed token | ✅ Implemented |
| Agent Heartbeat | PATCH every 30 s with `online` / `degraded` status | ✅ Implemented |
| Attack Event Reporting | Non-blocking queue-based async HTTP reporting | ✅ Implemented |
| Offline Agent Detection | Background coroutine marks agents offline after 120 s of silence | ✅ Implemented |
| JWT User Authentication | HS256 JWT, 24-hour expiry, bcrypt password hashing | ✅ Implemented |
| Multi-Tenant Isolation | All queries scoped to `user_id` at database layer | ✅ Implemented |
| React Dashboard | Dark-theme UI with charts, agent list, and attack timeline | ✅ Implemented |
| Agent Download | Dashboard generates pre-configured agent ZIP with `install.sh` | ✅ Implemented |
| Deduplication | 60-second cooldown per `(pid, behaviour_type)` / `(pid, cron_line)` pair | ✅ Implemented |
| Severity Normalisation | Schema-level `field_validator` normalises severity to uppercase | ✅ Implemented |
| Process Name Masking | `setproctitle` + `prctl(PR_SET_NAME)` hides agent in process list | ✅ Implemented |
| Startup Secret Enforcement | Backend refuses to start if `SECRET_KEY` is the insecure default | ✅ Implemented |

---

## Architecture Overview

```
Linux Endpoint
      │
      ▼
┌─────────────────────────────────────────────────────┐
│                   ARCDIS Agent                       │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │   Monitor    │  │ EBPFMonitor  │  │ Reporter  │  │
│  │  (userspace) │  │ (kernel BPF) │  │(heartbeat │  │
│  │              │  │              │  │ + events) │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                 │                │         │
│  ┌──────▼─────────────────▼────────────┐  │          │
│  │  ML Pipeline (IsolationForest ×5)   │  │          │
│  │  → RiskEvaluator → PolicyEngine     │  │          │
│  │  → Preventer (terminate/quarantine) │  │          │
│  └─────────────────────────────────────┘  │          │
└───────────────────────────────────────────┬──────────┘
                                             │
                                    HTTPS REST API
                                             │
                          ┌──────────────────▼──────────────────┐
                          │          FastAPI Backend              │
                          │  /api/auth    /api/agents             │
                          │  /api/users   /api/attacks            │
                          └──────────────────┬──────────────────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │   MongoDB    │
                                    │  users       │
                                    │  agents      │
                                    │  attacks     │
                                    └──────┬──────┘
                                           │
                                           ▼
                          ┌────────────────────────────────────┐
                          │         React Dashboard             │
                          │  Landing / Features / Architecture  │
                          │  Dashboard / Agents / Attacks       │
                          │  AgentDetail / DownloadAgent        │
                          └────────────────────────────────────┘
```

For the full layered architecture diagram with Mermaid flowcharts, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| FastAPI | ≥0.100 | Async REST API framework |
| Uvicorn | ≥0.22 | ASGI server |
| Motor | ≥3.2 | Async MongoDB driver |
| Pydantic v2 | ≥2.0 | Data validation and serialisation |
| pydantic-settings | ≥2.0 | Environment-based configuration |
| python-jose | ≥3.3 | JWT creation and verification (HS256) |
| passlib + bcrypt | ≥1.7.4 / <4.0 | Password and token hashing |
| python-multipart | ≥0.0.6 | OAuth2 form data parsing |

### Agent
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Runtime |
| psutil | 5.9.8 | Process, CPU, memory, IO metrics |
| requests | 2.31.0 | HTTP communication with backend |
| python-dotenv | 1.0.1 | `.env` file loading and token persistence |
| scikit-learn | 1.4.2 | IsolationForest ML models |
| joblib | 1.4.2 | Model serialisation / deserialisation |
| numpy | 1.26.4 | Numerical arrays for ML inference |
| setproctitle | 1.3.3 | Process name masking |
| bcc (python3-bpfcc) | system | eBPF kernel tracing (optional) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| Vite | 5.1 | Build tool and dev server |
| React Router DOM | 7 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Recharts | 3 | Area, bar, and pie charts |
| Axios | 1.19+ | HTTP client with interceptors |
| Framer Motion | 11 | Animations and transitions |
| Lucide React | 1.31+ | Icon library |
| react-hot-toast | 2.6 | Toast notifications |
| date-fns | 4.4 | Date formatting and manipulation |
| clsx + tailwind-merge | latest | Conditional class composition |

### Database
| Technology | Version | Purpose |
|---|---|---|
| MongoDB | 6+ | Primary data store (users, agents, attacks collections) |

For detailed breakdowns with rationale, see [docs/TECH_STACK.md](docs/TECH_STACK.md).

---

## System Components

### 1. ARCDIS Agent (`/agent`)

A Python daemon that runs on Linux endpoints as root (or as a `systemd` service). It has three major subsystems:

**Monitor** (`monitor.py`) — Polls the process tree every 2 seconds using `psutil`. Tracks CPU history, IO rates, parent-child relationships, filesystem directory deltas for protected home directories, and cron entries every 45 seconds. Operates entirely in userspace and requires no kernel extensions.

**EBPFMonitor** (`ebpf_monitor.py`) — Attaches BCC tracepoints to `open`, `openat`, `creat`, and `openat2` syscalls. Counts file-creation events per PID within a configurable time window. Falls back gracefully if BCC is unavailable, marking the agent as `degraded` rather than failing.

**Reporter** (`reporter.py`) — Maintains a background heartbeat thread (every 30 seconds) and a non-blocking event queue. Events are sent asynchronously via a background sender thread so the detection loop is never blocked by network latency. The attack event queue has a capacity of 200 events; if full, new events are dropped with a warning to prevent back-pressure.

### 2. FastAPI Backend (`/backend`)

An async Python REST API with four route groups registered under `/api`:

- **`/api/auth`** — User registration and JWT login
- **`/api/users`** — Authenticated user profile endpoint
- **`/api/agents`** — Agent registration, listing, individual lookup, heartbeat, and agent ZIP download
- **`/api/attacks`** — Attack event ingestion (agent-auth), listing with filters (JWT), and individual lookup

A background `asyncio` coroutine (`_mark_offline_loop`) runs every 60 seconds and marks agents `offline` if their `last_seen` timestamp is older than 120 seconds.

### 3. React Dashboard (`/client`)

A single-page application with two route groups:

- **Public pages** — Landing, Features, Architecture, Security, Docs
- **Authenticated dashboard** — Dashboard overview, Agents list, Agent Detail, Attacks timeline, Deploy/Download Agent

JWT is stored in `localStorage`. An Axios request interceptor attaches it to every API call. A response interceptor clears the token and emits an `auth:unauthorized` event on any 401 response, triggering an automatic logout.

---

## How ARCDIS Works

### End-to-End Workflow

```
1. User registers on the dashboard
   → Account created in MongoDB (password bcrypt-hashed)

2. User navigates to Deploy Agent
   → Dashboard requests a pre-configured agent ZIP from the backend
   → ZIP contains all agent source files + a .env pre-filled with
     USER_ID and AGENT_ID, plus a generated install.sh

3. Agent runs on a Linux endpoint (requires root)
   → Validates configuration (AGENT_ID, USER_ID required)
   → Sends registration POST to /api/agents/register with X-User-Id header
   → Backend generates a 64-char cryptographic hex token, stores bcrypt hash,
     returns plaintext token once
   → Agent writes AGENT_TOKEN to its .env for all subsequent calls
   → Starts EBPFMonitor (marks degraded if BCC unavailable)
   → Tells Reporter whether eBPF is available (affects heartbeat status)
   → Starts heartbeat thread (every 30 s)
   → Starts monitoring loop (every 2 s) — blocking

4. On every monitoring tick the Monitor:
   → Iterates all running processes via psutil
   → Tracks parent→child spawn counts and memory in a sliding window
   → Records per-PID IO write rates and CPU history
   → Checks directory deltas in protected home-directory paths
   → Every 45 s: scans all user crontabs + /etc/crontab + /etc/cron.d/

5. When suspicious behaviour is observed:
   → Feature vector is extracted (spawn count, memory, CPU, IO rates, etc.)
   → Appropriate IsolationForest model scores the activity (0.0–1.0)
   → RiskEvaluator maps score: <0.5 → LOW, ≤0.8 → SUSPICIOUS, >0.8 → HIGH
   → LOW → silently ignored
   → SUSPICIOUS / HIGH → PolicyEngine selects response action

6. PolicyEngine loads policies.json and matches (risk_tier, behaviour_type):
   → MONITOR_ONLY               (SUSPICIOUS + any behaviour)
   → TERMINATE_PROCESS_TREE     (HIGH + process_storm or resource_hijacker)
   → TERMINATE_SINGLE_PROCESS   (HIGH + anomalous_process)
   → QUARANTINE_AND_TERMINATE   (HIGH + ransomware)
   → pol_default_monitor fallback if no rule matches

7. Preventer executes the matched action:
   → Suspends all processes in the tree before killing (prevents re-spawning)
   → Moves suspicious files to /tmp/arcdis_quarantine/<name>_<ts>.quarantined
   → Removes malicious cron lines via crontab -u <user> -
   → Verifies termination; retries with SIGKILL if SIGTERM times out

8. AttackEvent is assembled and enqueued (non-blocking)
   → Sender thread POSTs to /api/attacks with X-Agent-Id + X-Agent-Token
   → Backend validates agent ownership, stores event in MongoDB attacks collection
   → Dashboard polls and displays the event in real time

9. Agent sends PATCH /api/agents/{id}/heartbeat every 30 s
   → Backend records last_seen timestamp and status (online or degraded)
   → Background coroutine marks agent offline after 120 s of no heartbeat
   → Dashboard reflects offline state
```

---

## ML / AI Components

The agent uses five specialised **IsolationForest** models, each trained on a feature space appropriate to its detection domain. Pre-trained `.pkl` files are included in the repository. If a model file is missing or fails to load, the agent retrains a fresh synthetic baseline at startup and saves it.

| Model | Feature Space | Primary Detection |
|---|---|---|
| `local_tree_model` | spawn_count, total_memory_mb, avg_memory_mb | Process storms (T1059) |
| `local_process_model` | cpu_percent, memory_mb, num_threads | Anomalous single processes (T1046, T1496) |
| `local_fs_model` | write_mb_rate, write_count_rate, protected_open_files | Ransomware filesystem writes (T1486) |
| `local_ebpf_model` | file_creation_count | eBPF-detected burst file creation (T1486) |
| `local_cron_model` | line_length, entropy, keyword_count, network_score | Cron persistence (T1053.003) |

Each model uses a paired `StandardScaler` (stored as a separate `.pkl`). The raw `IsolationForest.decision_function()` score is normalised to [0.0, 1.0] using `min(abs(raw_score) * 2.0, 1.0)` and then passed through heuristic boost rules before reaching the risk evaluator:

| Condition | Boosted Score |
|---|---|
| spawn_count ≥ 4 | 0.85 |
| file_creation_count ≥ 50 (eBPF) | 0.95 |
| write_count_rate ≥ 2 AND protected_open_files ≥ 3 | 0.90 |
| memory_mb > 4096 OR num_threads > 500 | 0.85 |
| cron: suspicious_keywords ≥ 2 OR network_score ≥ 1 | 0.95 |
| cron: suspicious_keywords = 1 | 0.85 |
| cron: entropy > 5.5 | 0.95 |

---

## Risk Evaluation

```python
# risk.py — RiskEvaluator.evaluate()
if anomaly_score < 0.5:   → LOW        (silently ignored)
if anomaly_score <= 0.8:  → SUSPICIOUS (reported, MONITOR_ONLY policy)
if anomaly_score > 0.8:   → HIGH       (active prevention triggered)
```

Severity labels in attack events:

| Severity | Condition |
|---|---|
| `CRITICAL` | anomaly_score ≥ 0.95 |
| `HIGH` | anomaly_score > 0.85 |
| `SUSPICIOUS` | anomaly_score ≥ 0.50 |

---

## Policy Engine

Policies are defined in `agent/policies.json` and loaded at startup by `PolicyEngine`. The engine selects the first matching policy by `(risk_tier, behaviour_type)` and falls back to `MONITOR_ONLY` if no rule matches.

| Policy ID | Risk Tier | Behaviour Type | Action |
|---|---|---|---|
| `pol_high_anomaly_storm` | HIGH | process_storm | TERMINATE_PROCESS_TREE |
| `pol_suspicious_monitoring` | SUSPICIOUS | any | MONITOR_ONLY |
| `pol_high_resource_exhaustion` | HIGH | anomalous_process | TERMINATE_SINGLE_PROCESS |
| `pol_resource_hijacking` | HIGH | resource_hijacker | TERMINATE_PROCESS_TREE |
| `pol_ransomware` | HIGH | ransomware | QUARANTINE_AND_TERMINATE |
| `pol_default_monitor` | (fallback) | (no match) | MONITOR_ONLY |

---

## Prevention Mechanisms

### TERMINATE_PROCESS_TREE
Suspends all processes in the parent-child tree (using `SIGSTOP`) → sends `SIGTERM` to all → waits 3 seconds → sends `SIGKILL` to any survivors. Suspending before killing prevents the parent from spawning new children during the termination window.

### TERMINATE_SINGLE_PROCESS
Suspends → `SIGTERM` → wait 3 seconds → `SIGKILL`. Does not affect child processes.

### QUARANTINE_AND_TERMINATE
Suspends the entire tree to halt encryption → moves each touched file to `/tmp/arcdis_quarantine/<filename>_<timestamp>.quarantined` → calls `TERMINATE_PROCESS_TREE`.

### CRON_LINE_REMOVED
Reads the target user's crontab with `crontab -u <user> -l`, removes the exact matching line, and writes the cleaned crontab back using `crontab -u <user> -`. Operates across all users with UID ≥ 1000 plus root.

---

## MITRE ATT&CK Coverage

| Technique | Name | Detection Method |
|---|---|---|
| T1059 | Command and Scripting Interpreter (Process Storm) | Process tree IsolationForest + child count heuristics |
| T1496 | Resource Hijacking (Cryptominer) | Sustained CPU >70% for 3+ ticks in process tree |
| T1486 | Data Encrypted for Impact (Ransomware) | IO rate + protected file writes + eBPF file-creation burst |
| T1053.003 | Scheduled Task/Job: Cron | Crontab diff + Shannon entropy + keyword scoring + ML |
| T1046 | Network Service Scanning / Anomalous Process | Single-process IsolationForest on CPU/memory/thread profile |

---

## Backend Architecture

The FastAPI backend is an async application using the Motor driver for non-blocking MongoDB access. Key design decisions:

- **Startup secret enforcement** — `config.py` checks `SECRET_KEY` against a set of known-insecure defaults and calls `sys.exit(1)` if one is detected. The server will not start with a weak key.
- **MongoDB indexes** — Created at startup: unique index on `users.email`, unique index on `agents.agent_id`, and indexes on `agents.user_id`, `attacks.agent_id`, `attacks.user_id`.
- **Background offline checker** — An `asyncio.Task` runs in the lifespan context and updates agent statuses every 60 seconds. Agents not seen for 120 seconds are set to `offline`.
- **Streaming ZIP generation** — The `/api/agents/download` endpoint builds the agent ZIP in memory using `io.BytesIO` and streams it with `StreamingResponse`. The install script (`install.sh`) is generated dynamically and embedded in the ZIP.
- **CORS** — Configured for `http://localhost:5173` and `http://localhost:3000` only.

---

## Frontend / Dashboard

The React dashboard is a dark-themed single-page application. Key implementation details:

- **Routing** — React Router DOM v7. Public routes use a `PublicLayout` wrapper; authenticated routes use a `Layout` wrapper with sidebar navigation.
- **Authentication state** — `AuthContext` provides `user`, `login`, `register`, and `logout`. On mount it validates the stored JWT by calling `/api/users/me`. On 401, an `auth:unauthorized` event clears state.
- **Axios interceptors** — Request interceptor attaches `Authorization: Bearer <token>`. Response interceptor handles 401 globally.
- **Pages (authenticated):** Dashboard overview, Agents list, Agent Detail, Attacks timeline, Deploy Agent.
- **Pages (public):** Landing, Features, Architecture, Security, Docs.
- **Charts:** Recharts AreaChart for attack volume over time; additional chart components for severity breakdown.
- **Notifications:** react-hot-toast for operation feedback.

---

## Database Usage

MongoDB (`arcdis_db`) is the sole data store. Three collections are used:

**`users`**
Stores registered user accounts. Fields: `email` (unique indexed), `hashed_password` (bcrypt), `full_name`, `created_at`, `is_active`.

**`agents`**
Stores registered endpoint agents. Fields: `agent_id` (unique indexed), `user_id` (indexed), `hostname`, `os_info`, `status` (`online` / `degraded` / `offline`), `last_seen`, `created_at`, `version`, `token_hash` (bcrypt hash of the per-agent token — plaintext is never stored).

**`attacks`**
Stores attack/detection events reported by agents. Fields: `attack_id`, `agent_id` (indexed), `user_id` (indexed), `technique`, `title`, `description`, `features` (dict), `action_taken`, `severity`, `status`, `risk_score`, `local_anomaly_score`, `hostname`, `process_name`, `parent_process`, `detection_methods`, `timestamp`, `raw_summary`.

All queries include a `user_id` filter to enforce multi-tenant isolation at the database layer.

---

## Authentication & Security

### User Authentication (Dashboard → Backend)
- OAuth2 Password flow (`application/x-www-form-urlencoded`)
- Passwords hashed with bcrypt via `passlib`
- JWT issued on login, signed with HS256, 24-hour expiry (`ACCESS_TOKEN_EXPIRE_MINUTES=1440`)
- Backend **refuses to start** if `SECRET_KEY` is still the default value

### Agent Authentication (Two-Phase)

**Phase 1 — Registration (first run only):**
The agent sends an `X-User-Id` header containing the MongoDB `_id` of the owning user. The backend validates the user exists, creates the agent record, generates a 64-character cryptographically random hex token using `secrets.token_hex(32)`, stores its bcrypt hash, and returns the plaintext token exactly once. The agent writes the token to its `.env` as `AGENT_TOKEN`.

**Phase 2 — All subsequent requests:**
The agent sends `X-Agent-Id` + `X-Agent-Token` headers. The backend looks up the agent by `agent_id` and verifies the token against the stored bcrypt hash using `passlib`. No shared global agent secret is used at any point.

For full security documentation, see [docs/SECURITY.md](docs/SECURITY.md).

---

## Agent Registration & Heartbeat

**Registration:**
```
POST /api/agents/register
Headers: X-User-Id: <user_mongo_id>, Content-Type: application/json
Body: { agent_id, hostname, os_info, version }
Response: { ...agent fields..., agent_token: "<plaintext — returned once only>" }
```
If the agent is already registered (HTTP 400), the agent considers this a success and uses the token already in `.env`.

**Heartbeat:**
```
PATCH /api/agents/{agent_id}/heartbeat
Headers: X-Agent-Id: <id>, X-Agent-Token: <token>
Body: { "status": "online" }   or   { "status": "degraded" }
Response: { status, last_seen }
```
The heartbeat interval is 30 seconds. The backend clamps any unknown status value to `"online"` — only `"online"` and `"degraded"` are persisted.

---

## Attack / Event Reporting Pipeline

```
Detection loop (monitor.py / ebpf_monitor.py)
        │
        │ send_attack_event(event)  [non-blocking]
        ▼
   Queue (maxsize=200)
        │
        │ background sender thread
        ▼
POST /api/attacks
Headers: X-Agent-Id + X-Agent-Token
        │
        ▼
Backend validates agent ownership → inserts to MongoDB attacks collection
        │
        ▼
Frontend polls /api/attacks → renders in Attacks timeline and Dashboard
```

The queue prevents any network latency from blocking the 2-second detection loop.

---

## eBPF / BCC Functionality

`ebpf_monitor.py` compiles and loads an inline BPF program at runtime using the BCC (BPF Compiler Collection) Python bindings. The BPF program attaches tracepoints to four syscalls:

| Syscall | BPF hook |
|---|---|
| `open` | `TRACEPOINT_PROBE(syscalls, sys_enter_open)` |
| `openat` | `TRACEPOINT_PROBE(syscalls, sys_enter_openat)` |
| `creat` | `TRACEPOINT_PROBE(syscalls, sys_enter_creat)` |
| `openat2` | `TRACEPOINT_PROBE(syscalls, sys_enter_openat2)` |

Each event records the calling PID and process name. A per-PID counter tracks events within a sliding time window. When a PID exceeds the configured threshold (default: 100 file creations in 10 seconds), the eBPF ML model scores the count, and if the score exceeds 0.8, the process tree is terminated.

A process whitelist (`chrome`, `firefox`, `apt`, `dpkg`, `node`, `npm`, `git`, etc.) prevents false positives from legitimate burst-IO applications.

**Degraded mode:** If `python3-bpfcc` is not installed or the BPF program fails to load, the `EBPFMonitor` logs a warning, sets `self.available = False`, and the agent continues with userspace monitoring only. The heartbeat reports `status: "degraded"` to the backend.

---

## Cron Monitoring

The cron scanner (`monitor.py → _scan_cron`) runs every 45 seconds. On first startup (`_init_cron_baseline`) it evaluates all existing cron entries. Pre-existing entries that score above 0.8 are excluded from the baseline and will be removed on the first scan. Trusted entries are added to `cron_baseline`.

**Sources scanned per cycle:**
1. Per-user crontabs (all users with UID ≥ 1000 + root) via `crontab -u <user> -l`
2. `/etc/crontab`
3. All files in `/etc/cron.d/`

**Detection features for each cron line:**
- `line_length` — longer lines correlate with obfuscated commands
- `entropy` — Shannon entropy; high entropy suggests base64 or obfuscation
- `suspicious_keywords_count` — count of: `python`, `bash -c`, `sh -c`, `wget`, `curl`, `nc`, `netcat`, `socat`, `/dev/tcp`, `/dev/udp`, `/tmp`, `/dev/shm`, `nohup`, `mkfifo`
- `network_and_obfuscation_score` — regex matches for IP addresses, hidden-directory paths, and `base64 | bash` patterns

---

## Filesystem Monitoring

The filesystem monitor (`monitor.py`) operates at two levels:

**IO Rate Tracking (per-process):** For every non-safe process, `psutil.io_counters()` tracks `write_bytes` and `write_count` between ticks. If the write rate exceeds 1 MB/s or 5 write-ops/sec, the monitor checks the process's open file handles for files in protected home directories.

**Directory Delta Tracking:** Protected directories (home directories + `Documents`, `Desktop` subdirectories for all users with UID ≥ 1000 and root) are compared against a stored snapshot each tick. New files detected are correlated with the highest IO-rate writer that tick.

**Protected directories** are determined dynamically from `/etc/passwd` at startup.

---

## Process Monitoring

The process monitor evaluates three threat types per tick:

| Behaviour | Detection Logic | MITRE |
|---|---|---|
| process_storm | Scripting interpreter (bash/python/perl/ruby/sh/dash/zsh) spawning many children in a window | T1059 |
| resource_hijacker | Process tree with sustained CPU > 70% across 3+ consecutive ticks | T1496 |
| ransomware | High IO write rate + open files in protected home directories | T1486 |
| anomalous_process | Single process with unusual CPU/memory/thread profile | T1046 |

A safe-process allowlist (`systemd`, `gnome-shell`, `Xorg`, `chrome`, `firefox`, `code`, `docker`, `sshd`, `bash`, etc.) prevents the monitor from evaluating core OS processes. The agent's own process (`agent.py`) and its backend/frontend (`uvicorn`, `vite`, `node`) are also excluded.

Deduplication uses a 60-second cooldown per `(pid, behaviour_type)` pair to prevent alert storms.

---

## Project Directory Structure

```
ARCDIS/
├── README.md                     ← This file
├── .gitignore
│
├── docs/
│   ├── ARCHITECTURE.md           ← Full system architecture with Mermaid diagrams
│   ├── API.md                    ← Complete REST API reference
│   ├── SETUP.md                  ← Step-by-step installation guide
│   ├── TECH_STACK.md             ← Detailed technology breakdown
│   ├── SECURITY.md               ← Security model and limitations
│   ├── PROJECT_STRUCTURE.md      ← Annotated repository file tree
│   └── images/                   ← Screenshots (see below)
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example              ← Environment variable template
│   └── app/
│       ├── main.py               ← FastAPI app + lifespan + offline checker
│       ├── config.py             ← pydantic-settings config (startup secret check)
│       ├── database.py           ← Motor client + collection helpers + indexes
│       ├── routes/
│       │   ├── auth.py           ← /api/auth/register, /api/auth/login
│       │   ├── users.py          ← /api/users/me
│       │   ├── agents.py         ← /api/agents (CRUD + heartbeat + download)
│       │   └── attacks.py        ← /api/attacks (report + list + get)
│       ├── models/               ← Pydantic MongoDB document models
│       ├── schemas/              ← Request/response schemas
│       ├── services/             ← auth_service, agent_service (business logic)
│       ├── utils/
│       │   ├── security.py       ← bcrypt helpers, JWT creation
│       │   └── dependencies.py   ← FastAPI dependency injectors (auth middleware)
│       └── middleware/
│           └── cors.py           ← CORS configuration
│
├── agent/
│   ├── agent.py                  ← Entry point, signal handlers, startup sequence
│   ├── monitor.py                ← Userspace detection loop (process/FS/cron)
│   ├── ebpf_monitor.py           ← eBPF kernel monitoring (file-creation syscalls)
│   ├── reporter.py               ← Heartbeat + non-blocking event queue + HTTP sender
│   ├── ml.py                     ← IsolationForest models (load/train/evaluate)
│   ├── risk.py                   ← RiskEvaluator (score → tier mapping)
│   ├── policy.py                 ← PolicyEngine (JSON rule matching)
│   ├── policies.json             ← Policy definitions
│   ├── preventer.py              ← Prevention actions (terminate/quarantine/cron)
│   ├── models.py                 ← AttackEvent and AgentRegistration dataclasses
│   ├── config.py                 ← Env configuration (loaded from .env)
│   ├── utils.py                  ← Rotating file logger setup
│   ├── requirements.txt
│   ├── .env.example
│   ├── local_tree_model.pkl      ← Pre-trained process tree IsolationForest
│   ├── local_tree_scaler.pkl
│   ├── local_process_model.pkl   ← Pre-trained single-process IsolationForest
│   ├── local_process_scaler.pkl
│   └── local_fs_model.pkl        ← Pre-trained filesystem IsolationForest
│       (+ local_fs_scaler.pkl, local_ebpf_model.pkl, local_ebpf_scaler.pkl,
│          local_cron_model.pkl, local_cron_scaler.pkl)
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── App.jsx               ← Route definitions (public + auth + dashboard)
        ├── main.jsx
        ├── api/
        │   └── axios.js          ← Axios instance + request/response interceptors
        ├── context/
        │   └── AuthContext.jsx   ← JWT auth state, login/logout/register
        ├── hooks/
        │   ├── useAuth.js
        │   └── useApi.js
        ├── services/
        │   ├── authService.js
        │   ├── agentService.js
        │   └── attackService.js
        ├── pages/
        │   ├── Landing.jsx       ← Public landing page
        │   ├── Features.jsx      ← Public features page
        │   ├── Architecture.jsx  ← Public architecture page
        │   ├── Security.jsx      ← Public security page
        │   ├── Docs.jsx          ← Public documentation page
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx     ← Main dashboard overview
        │   ├── Agents.jsx        ← Agent list
        │   ├── AgentDetail.jsx   ← Per-agent detail with attack history
        │   ├── Attacks.jsx       ← Global attacks timeline
        │   ├── DownloadAgent.jsx ← Deploy agent page
        │   └── NotFound.jsx
        └── components/
            ├── layout/           ← Layout, Navbar, Sidebar (authenticated)
            ├── public/           ← PublicLayout, PublicNavbar, PublicFooter
            ├── ui/               ← Button, Card, Badge, Input, Modal, LoadingSpinner
            ├── dashboard/        ← StatsCards, AttackChart, RecentAttacks
            ├── agents/           ← AgentList, AgentCard
            └── attacks/          ← AttackTable, AttackFilters, AttackDetail
```

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for a complete annotated listing.

---

## Installation & Setup

For complete step-by-step instructions, see [docs/SETUP.md](docs/SETUP.md).

### Prerequisites

- Python 3.11+ and `pip`
- Node.js 18+ and `npm`
- MongoDB 6+ running on `localhost:27017`
- Linux endpoint for the agent (Ubuntu 20.04+ recommended for eBPF support)
- Root / sudo access on the Linux endpoint

### Quick Reference

```bash
# 1. Clone
git clone <repository-url>
cd ARCDIS

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set SECRET_KEY to a long random string:
# python3 -c "import secrets; print(secrets.token_hex(32))"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (new terminal)
cd client
npm install
cp .env.example .env
npm run dev
# Open http://localhost:5173

# 4. Agent (Linux endpoint, requires root)
# Download the agent ZIP from Dashboard → Deploy Agent
# Extract the archive and run:
sudo python3 agent.py
# Or for persistent systemd install:
sudo bash install.sh
```

---

## API Overview

The backend exposes a REST API under the `/api` prefix. Interactive documentation (Swagger UI) is available at `http://localhost:8000/docs` when the server is running.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create user account |
| POST | `/api/auth/login` | None | Login, receive JWT |
| GET | `/api/users/me` | JWT Bearer | Get current user profile |
| POST | `/api/agents/register` | X-User-Id | Register a new agent |
| GET | `/api/agents` | JWT Bearer | List user's agents |
| GET | `/api/agents/{agent_id}` | JWT Bearer | Get single agent |
| GET | `/api/agents/download` | JWT Bearer | Download pre-configured agent ZIP |
| PATCH | `/api/agents/{agent_id}/heartbeat` | X-Agent-Id + X-Agent-Token | Agent heartbeat |
| POST | `/api/attacks` | X-Agent-Id + X-Agent-Token | Report attack event |
| GET | `/api/attacks` | JWT Bearer | List attacks (filterable by agent, technique, date) |
| GET | `/api/attacks/{attack_id}` | JWT Bearer | Get single attack event |

Full request/response documentation: [docs/API.md](docs/API.md).

---

## Dashboard Preview

The ARCDIS dashboard provides a centralised view of all monitored endpoints and detected threats. It includes real-time agent status (online / degraded / offline), an attack timeline with severity filtering, per-agent drill-down views, and severity breakdown charts.

> **Screenshots are pending.** The dashboard is fully functional. Screenshots should be captured from a running instance and added to `docs/images/`.
>
> Files to capture and add:
> - `docs/images/arcdis-dashboard.png` — Main dashboard overview with stats cards and recent attacks
> - `docs/images/arcdis-agents.png` — Agents list with online/offline/degraded status
> - `docs/images/arcdis-agent-details.png` — Individual agent detail with threat history
> - `docs/images/arcdis-attacks.png` — Attacks timeline with severity filtering
> - `docs/images/arcdis-login.png` — Login page

Once screenshots are captured, embed them here:

```markdown
![ARCDIS Dashboard](docs/images/arcdis-dashboard.png)
![ARCDIS Agents](docs/images/arcdis-agents.png)
![ARCDIS Attack Events](docs/images/arcdis-attacks.png)
```

---

## Testing & Verification

The following verifications were performed manually against the running system. There is no automated test suite (pytest / Jest) in the current project.

| Verification | Method |
|---|---|
| Backend starts cleanly | `uvicorn app.main:app --reload` — no import errors |
| Startup secret enforcement | Backend exits with `[FATAL]` if `SECRET_KEY` is default |
| User registration | POST `/api/auth/register` with valid payload → 201 |
| User login | POST `/api/auth/login` → JWT returned |
| JWT protection | GET `/api/agents` without token → 401 |
| Agent registration | Agent first-run → token written to `.env` → 201 response |
| Heartbeat | PATCH `/api/agents/{id}/heartbeat` with agent headers → 200 |
| Attack reporting | POST `/api/attacks` with agent headers → 201, event visible in dashboard |
| Multi-tenant isolation | User A cannot see User B's agents or attacks |
| Offline detection | Agent stopped → status flips to `offline` after 120 s |
| Severity normalisation | Schema `field_validator` normalises `"critical"` → `"CRITICAL"` |
| eBPF degraded mode | Agent starts without `python3-bpfcc` → logs warning, reports `degraded` |
| Cron deduplication | Same cron line reported twice within 60 s → second event dropped |
| Policy engine fallback | No matching policy → `pol_default_monitor` (MONITOR_ONLY) applied |

---

## Security Considerations

- `SECRET_KEY` must be a cryptographically random string. The backend enforces this at startup.
- JWT tokens are stored in browser `localStorage`. This is a known tradeoff; for high-security deployments, consider `httpOnly` cookies.
- CORS is restricted to `localhost:5173` and `localhost:3000`. Update `middleware/cors.py` before deploying to a public host.
- The agent requires root privileges for cross-user process termination and cron modification. Running without root degrades prevention capabilities.
- Per-agent tokens are 64-character hex strings generated by `secrets.token_hex(32)`. Only the bcrypt hash is stored; the plaintext is returned once.

See [docs/SECURITY.md](docs/SECURITY.md) for the full security model.

---

## Known Limitations

- **Root requirement** — The agent requires root privileges for cross-user process termination and cron modification. Running as a non-root user significantly limits prevention capabilities.
- **Linux only** — The agent uses Linux-specific APIs (`psutil` process trees with Linux semantics, eBPF, `/etc/crontab`, `crontab` CLI). It does not run on Windows or macOS.
- **eBPF dependency** — eBPF monitoring requires `python3-bpfcc` and matching `linux-headers`. Without them, the agent operates in degraded mode (userspace monitoring only).
- **No automated test suite** — The project does not include a pytest or Jest test suite. Verification was performed manually.
- **ML baseline training** — Pre-trained `.pkl` models are based on synthetically generated normal-behaviour distributions. Accuracy may vary across different hardware profiles and workloads until models are retrained on real endpoint data.
- **Filesystem monitoring scope** — Directory delta tracking covers home directories and their `Documents`/`Desktop` subdirectories only. Deep recursive filesystem watching is not implemented.
- **CORS scope** — Only `localhost:5173` and `localhost:3000` are whitelisted. Production deployments require updating the CORS configuration.
- **JWT in localStorage** — The frontend stores JWTs in `localStorage`, which is accessible to JavaScript. This is a common development pattern but is not recommended for high-security production deployments.
- **Attack list pagination** — The API returns up to 100 attacks per query. Pagination is not currently implemented.

---

## Future Scope

> The following are **not currently implemented**. They represent potential directions for future development.

- Retraining ML models from real endpoint telemetry collected over time
- YARA rule integration for static file analysis
- Windows and macOS agent support
- Alert notification integrations (email, Slack, webhook)
- Role-based access control (RBAC) for multi-user team access
- Configurable detection thresholds via the dashboard UI
- Automated test suite (pytest for backend, Vitest for frontend)
- TLS/HTTPS enforcement between agent and backend
- Pagination on API list endpoints
- Time-series charts with configurable date ranges in the dashboard

---

## Project Status

ARCDIS is a complete, functional endpoint detection and response system built as a final-year cybersecurity engineering project. All core components — the agent, backend, and dashboard — are implemented and working end-to-end.

The system is not intended as a production-grade commercial EDR replacement. It is an academic and portfolio project demonstrating autonomous endpoint security using ML, eBPF, and modern full-stack development practices.

---

## License

This project is released under the [MIT License](LICENSE).

---

## Documentation Index

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture with Mermaid diagrams |
| [docs/API.md](docs/API.md) | Complete REST API reference |
| [docs/SETUP.md](docs/SETUP.md) | Step-by-step installation guide |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Detailed technology breakdown with rationale |
| [docs/SECURITY.md](docs/SECURITY.md) | Security model, mechanisms, and limitations |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Annotated repository structure |
