# ARCDIS — System Architecture

Complete architecture documentation for ARCDIS. Every diagram and description below reflects the actual implementation in the codebase.

---

## Table of Contents

- [System Overview](#system-overview)
- [Component Responsibilities](#component-responsibilities)
- [Agent Internal Architecture](#agent-internal-architecture)
- [Authentication Flow](#authentication-flow)
- [Agent Registration Flow](#agent-registration-flow)
- [Heartbeat Flow](#heartbeat-flow)
- [Detection & Response Pipeline](#detection--response-pipeline)
- [Attack Reporting Pipeline](#attack-reporting-pipeline)
- [eBPF Detection Path](#ebpf-detection-path)
- [Cron Detection Path](#cron-detection-path)
- [Filesystem Detection Path](#filesystem-detection-path)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Degraded Mode Behaviour](#degraded-mode-behaviour)
- [Offline Detection](#offline-detection)
- [Data Flow Summary](#data-flow-summary)

---

## System Overview

ARCDIS is composed of three independently deployable components that communicate over HTTP REST:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Linux Endpoint                             │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                     ARCDIS Agent                           │  │
│   │                                                            │  │
│   │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│   │  │   Monitor   │  │ EBPFMonitor  │  │    Reporter     │  │  │
│   │  │ (userspace) │  │ (kernel BPF) │  │ (heartbeat +    │  │  │
│   │  │  2s loop    │  │  perf buf    │  │  event queue)   │  │  │
│   │  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘  │  │
│   │         │                │                    │           │  │
│   │  ┌──────▼────────────────▼──────────┐         │           │  │
│   │  │   LocalAnomalyDetector           │         │           │  │
│   │  │   IsolationForest × 5            │         │           │  │
│   │  │   + RiskEvaluator                │         │           │  │
│   │  │   + PolicyEngine                 │         │           │  │
│   │  │   + Preventer                    │         │           │  │
│   │  └──────────────────────────────────┘         │           │  │
│   └────────────────────────────────────────────────┼───────────┘  │
└────────────────────────────────────────────────────┼─────────────┘
                                                      │
                                              HTTP REST API
                                                      │
                          ┌───────────────────────────▼──────────────────────┐
                          │              FastAPI Backend                      │
                          │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
                          │  │/api/auth │ │/api/users│ │  /api/agents      │ │
                          │  └──────────┘ └──────────┘ │  /api/attacks     │ │
                          │                             └──────────────────┘ │
                          │  Background task: _mark_offline_loop (60s)       │
                          └───────────────────────────┬──────────────────────┘
                                                       │
                                                    Motor
                                                       │
                                              ┌────────▼───────┐
                                              │    MongoDB      │
                                              │  arcdis_db      │
                                              │  ├── users      │
                                              │  ├── agents     │
                                              │  └── attacks    │
                                              └────────┬────────┘
                                                       │
                                                  Axios (REST)
                                                       │
                          ┌────────────────────────────▼─────────────────────┐
                          │           React Dashboard (SPA)                   │
                          │  Public: Landing, Features, Architecture,         │
                          │          Security, Docs                           │
                          │  Auth:   Dashboard, Agents, AgentDetail,          │
                          │          Attacks, DownloadAgent                   │
                          └──────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Language | Runtime | Primary Responsibility |
|---|---|---|---|
| Agent | Python 3.11+ | Linux root / systemd | Endpoint monitoring, ML inference, prevention |
| Backend | Python 3.11+ | Any OS, Uvicorn ASGI | REST API, authentication, data persistence |
| Dashboard | JavaScript (React) | Browser | Visualisation, user management, agent deployment |
| MongoDB | — | Any OS | Persistent storage for users, agents, attacks |

---

## Agent Internal Architecture

The agent entry point (`agent.py`) orchestrates three subsystems in a fixed startup sequence:

```mermaid
flowchart TD
    A[agent.py __main__] --> B[Mask process name\nsetproctitle + prctl]
    B --> C[Register SIGINT / SIGTERM\nsignal handlers]
    C --> D[ARCDISAgent.start]
    D --> E[config.validate\ncheck AGENT_ID + USER_ID]
    E --> F{Valid?}
    F -- No --> G[sys.exit 1]
    F -- Yes --> H[reporter.register\nPOST /api/agents/register]
    H --> I{HTTP 201 or 400?}
    I -- 400 already registered --> J[Use existing AGENT_TOKEN]
    I -- 201 new --> K[Persist AGENT_TOKEN to .env]
    J --> L[ebpf_monitor.start]
    K --> L
    L --> M{BCC available?}
    M -- No --> N[ebpf_monitor.available = False\ndegrade silently]
    M -- Yes --> O[Load BPF program\nattach tracepoints]
    N --> P[reporter._ebpf_available = False]
    O --> P2[reporter._ebpf_available = True]
    P --> Q[reporter.start_heartbeat\nheartbeat thread + sender thread]
    P2 --> Q
    Q --> R[monitor.start\nblocking 2s loop]
```

### Subsystem Startup Order (Critical)

The startup sequence in `agent.py` is ordered deliberately:

1. **Config validation** — fails fast if `AGENT_ID` or `USER_ID` are missing
2. **Registration** — must happen before heartbeat so the token exists
3. **eBPF start** — must happen before heartbeat so the degraded flag is set correctly
4. **Reporter._ebpf_available flag** — set after eBPF start, before heartbeat starts
5. **Heartbeat thread** — started with the correct online/degraded state
6. **Monitor loop** — blocking; runs until shutdown signal

---

## Authentication Flow

ARCDIS uses two separate authentication mechanisms depending on the caller.

### User Authentication (Dashboard → Backend)

```mermaid
sequenceDiagram
    participant Browser
    participant Backend
    participant MongoDB

    Browser->>Backend: POST /api/auth/login\nContent-Type: application/x-www-form-urlencoded\nusername=email&password=...
    Backend->>MongoDB: find_one({email: ...})
    MongoDB-->>Backend: user document
    Backend->>Backend: passlib.verify_password(plain, hashed)
    alt Password correct
        Backend->>Backend: jose.jwt.encode(sub=email, exp=+24h, HS256)
        Backend-->>Browser: {access_token, token_type: bearer}
        Browser->>Browser: localStorage.setItem(token, ...)
    else Password wrong
        Backend-->>Browser: 401 Incorrect email or password
    end

    Note over Browser,Backend: All subsequent dashboard requests:
    Browser->>Backend: GET /api/agents\nAuthorization: Bearer <jwt>
    Backend->>Backend: jose.jwt.decode → email
    Backend->>MongoDB: find_one({email: ...})
    MongoDB-->>Backend: user document
    Backend-->>Browser: 200 response data
```

### Agent Authentication (Two-Phase)

```mermaid
sequenceDiagram
    participant Agent
    participant Backend
    participant MongoDB

    Note over Agent,Backend: Phase 1 — First run only (no token yet)
    Agent->>Backend: POST /api/agents/register\nX-User-Id: <user_mongo_id>\nBody: {agent_id, hostname, os_info, version}
    Backend->>MongoDB: find_one({_id: ObjectId(user_id)})
    MongoDB-->>Backend: user document
    Backend->>Backend: secrets.token_hex(32) → 64-char plaintext
    Backend->>Backend: passlib.hash(plaintext) → token_hash
    Backend->>MongoDB: insert_one(AgentModel + token_hash)
    Backend-->>Agent: 201 {agent_token: "<plaintext — once only>"}
    Agent->>Agent: dotenv.set_key(.env, AGENT_TOKEN, token)

    Note over Agent,Backend: Phase 2 — All subsequent requests
    Agent->>Backend: PATCH /api/agents/{id}/heartbeat\nX-Agent-Id: <id>\nX-Agent-Token: <plaintext>\nBody: {status: online|degraded}
    Backend->>MongoDB: find_one({agent_id: ...})
    MongoDB-->>Backend: agent document (with token_hash)
    Backend->>Backend: passlib.verify_password(token, token_hash)
    alt Token valid
        Backend->>MongoDB: update last_seen + status
        Backend-->>Agent: 200 {status, last_seen}
    else Token invalid
        Backend-->>Agent: 401 Invalid agent token
    end
```

---

## Agent Registration Flow

Registration is initiated by `reporter.register()` on every agent startup.

```mermaid
flowchart TD
    A[reporter.register called] --> B[Build AgentRegistration dataclass]
    B --> C[POST /api/agents/register\nHeaders: X-Agent-Id + X-Agent-Token + X-User-Id]
    C --> D{Response code?}
    D -- 201 --> E[Extract agent_token from response]
    E --> F[dotenv.set_key .env AGENT_TOKEN token]
    F --> G[config.AGENT_TOKEN = token in-memory]
    G --> H[Return True]
    D -- 400 already registered --> I[Token already in .env]
    I --> H
    D -- other error --> J[Log error]
    J --> K[Return False → agent exits]
```

---

## Heartbeat Flow

The heartbeat runs in a background daemon thread every 30 seconds.

```mermaid
sequenceDiagram
    participant HeartbeatThread
    participant Backend
    participant MongoDB
    participant BackgroundChecker

    loop Every 30 seconds
        HeartbeatThread->>HeartbeatThread: status = online if ebpf_available else degraded
        HeartbeatThread->>Backend: PATCH /api/agents/{id}/heartbeat\nX-Agent-Id + X-Agent-Token\n{status: online|degraded}
        Backend->>Backend: get_agent_identity dependency\n→ verify token against bcrypt hash
        Backend->>MongoDB: update_one({agent_id, user_id},\n$set {last_seen: now, status: safe_status})
        Backend-->>HeartbeatThread: 200 {status, last_seen}
    end

    loop Every 60 seconds (backend)
        BackgroundChecker->>MongoDB: update_many(\n  status in [online, degraded],\n  last_seen < now - 120s,\n  $set {status: offline})
    end
```

**Status clamping:** The backend only accepts `online` or `degraded`. Any other value is silently set to `online`. This prevents a misbehaving agent from writing arbitrary strings to the database.

---

## Detection & Response Pipeline

The main detection loop is the critical path for ARCDIS. All detection happens in `monitor.py` (userspace) and `ebpf_monitor.py` (kernel).

```mermaid
flowchart TD
    A[monitor.start — 2s tick] --> B[_scan_processes]
    B --> C[psutil.process_iter all procs]
    C --> D[Check directory deltas\n_check_directory_deltas]
    D --> E[For each non-safe process]
    E --> F[Track CPU history\nIO rates per-PID]
    F --> G{evaluate_fs\nwrite rate + protected files}
    G -- score ≥ 0.85 --> H[_handle_detection\nbehavior=ransomware]
    G -- score < 0.85 --> I{sustained_high_cpu\n>70% × 3 ticks}
    I -- Yes --> J[_handle_detection\nbehavior=resource_hijacker\nscore=max,0.90]
    I -- No --> K{evaluate_process\ncpu/mem/threads}
    K -- score ≥ 0.5 --> L[_handle_detection\nbehavior=anomalous_process]
    K -- score < 0.5 --> M[Skip]

    B --> N[For each interpreter parent\nbash/python/perl/ruby/sh/dash/zsh]
    N --> O[evaluate_tree\nspawn_count/memory]
    O -- score ≥ 0.5 --> P{total_tree_cpu > 60%?}
    P -- Yes --> Q[_handle_detection\nbehavior=resource_hijacker]
    P -- No --> R[_handle_detection\nbehavior=process_storm]
    O -- score < 0.5 --> S[Skip]

    H --> T[_handle_detection]
    J --> T
    L --> T
    Q --> T
    R --> T
```

### _handle_detection Internal Flow

```mermaid
flowchart TD
    A[_handle_detection called] --> B{Deduplication check\npid+behavior_type in last 60s?}
    B -- Yes --> C[Return — skip duplicate]
    B -- No --> D[Record dedup timestamp]
    D --> E[RiskEvaluator.evaluate\nscore → LOW/SUSPICIOUS/HIGH]
    E --> F{risk_tier == LOW?}
    F -- Yes --> G[Return silently]
    F -- No --> H[PolicyEngine.select_policy\nrisk_tier + behavior_type]
    H --> I[Preventer.execute_policy\npolicy action + target PID]
    I --> J{Action taken}
    J -- MONITOR_ONLY --> K[Log only]
    J -- TERMINATE_PROCESS_TREE --> L[suspend → SIGTERM → wait 3s → SIGKILL tree]
    J -- TERMINATE_SINGLE_PROCESS --> M[suspend → SIGTERM → wait 3s → SIGKILL]
    J -- QUARANTINE_AND_TERMINATE --> N[suspend tree → move files to quarantine → terminate tree]
    K --> O[Build AttackEvent dataclass]
    L --> O
    M --> O
    N --> O
    O --> P[reporter.send_attack_event\nenqueue non-blocking]
```

---

## Attack Reporting Pipeline

Attack reporting is fully decoupled from the detection loop via a thread-safe queue.

```mermaid
sequenceDiagram
    participant DetectionLoop
    participant Queue
    participant SenderThread
    participant Backend
    participant MongoDB

    DetectionLoop->>Queue: put_nowait(AttackEvent)\n[non-blocking, drops if full]
    Note over Queue: maxsize=200\nDrops on full with warning

    loop Sender background thread
        SenderThread->>Queue: get(timeout=1.0)
        Queue-->>SenderThread: AttackEvent
        SenderThread->>Backend: POST /api/attacks\nX-Agent-Id + X-Agent-Token\nJSON body
        Backend->>Backend: get_agent_identity → verify token
        Backend->>Backend: verify agent.user_id == current_user.id
        Backend->>MongoDB: insert_one(AttackModel)
        Backend-->>SenderThread: 201 Created
        SenderThread->>Queue: task_done()
    end
```

---

## eBPF Detection Path

The eBPF monitor runs entirely in a background thread and triggers independently of the userspace monitor.

```mermaid
flowchart TD
    A[EBPFMonitor.start] --> B{_BCC_AVAILABLE?}
    B -- No --> C[Log warning\navailable = False\nreturn — degraded mode]
    B -- Yes --> D[BPF compile + load\nbpf_text inline C program]
    D --> E[bpf_events.open_perf_buffer\n_print_event callback]
    E --> F[Start _poll_loop thread\nbpf.perf_buffer_poll 500ms]

    F --> G[Kernel syscall fires\nopen/openat/creat/openat2]
    G --> H[BPF captures pid + comm]
    H --> I[_print_event callback\nupdate pid_history timestamp list]
    I --> J[Count events in window\nwindow = EBPF_WINDOW_SECONDS]
    J --> K[ml.evaluate_ebpf\nfile_creation_count]
    K --> L{score > 0.8?}
    L -- No --> M[Continue]
    L -- Yes --> N{Process in whitelist?\nchrome/firefox/apt/node/git/etc}
    N -- Yes --> O[Clear history — false positive]
    N -- No --> P[_handle_detection\nPID + score]
    P --> Q{Dedup cooldown 60s?}
    Q -- Yes --> M
    Q -- No --> R[Preventer.terminate_process_tree\nPID]
    R --> S[Build AttackEvent\ntechnique=T1486\nseverity=CRITICAL]
    S --> T[reporter.send_attack_event]
```

---

## Cron Detection Path

Cron scanning runs every 45 seconds within the main monitor loop.

```mermaid
flowchart TD
    A[monitor._scan_cron\nevery 45s] --> B[Enumerate users\npwd.getpwall UID ≥ 1000 + root]
    B --> C[Per-user: crontab -u user -l]
    C --> D[Read /etc/crontab]
    D --> E[List /etc/cron.d/ files]
    E --> F[For each non-comment line]
    F --> G{line in cron_baseline?}
    G -- Yes --> H[Skip trusted entry]
    G -- No --> I[Extract features:\nline_length, entropy,\nkeyword_count,\nnetwork_score]
    I --> J[ml.evaluate_cron\n4-feature vector]
    J --> K{score > 0.8?}
    K -- No --> L[Add to baseline]
    K -- Yes --> M[Preventer.remove_cron_line\ncrontab -u user -]
    M --> N[Kill matching running\nprocesses by cmdline]
    N --> O{Dedup cooldown 60s?}
    O -- Yes --> P[Skip event]
    O -- No --> Q[Build AttackEvent\ntechnique=T1053.003]
    Q --> R[reporter.send_attack_event]
```

**Shannon entropy formula** is used for cron line analysis. High entropy (> 5.5) indicates base64-encoded payloads and is an automatic 0.95 score boost regardless of ML output.

---

## Filesystem Detection Path

```mermaid
flowchart TD
    A[_scan_processes tick] --> B[_check_directory_deltas\nprotected home dirs]
    B --> C{New files detected?}
    C -- Yes --> D[Assign to highest IO writer\nwrite_count_rate > 2]
    C -- No --> E[Continue]
    D --> F[protected_open_files += new_file_count\nsuspicious_files += paths]

    A --> G[For each non-safe process:\npsutil.io_counters]
    G --> H[Calculate write_mb_rate\nwrite_count_rate since last tick]
    H --> I{write_mb_rate > 1.0\nOR write_count_rate > 5?}
    I -- No --> J[Update io_history only]
    I -- Yes --> K[psutil.Process.open_files\ncheck against home_dirs]
    K --> L[Count protected_open_files\nbuild suspicious_files list]
    L --> M[ml.evaluate_fs\nwrite_mb_rate, write_count_rate,\nprotected_open_files]
    M --> N{score ≥ 0.85?}
    N -- Yes --> O[_handle_detection\nbehavior=ransomware\nfiles_to_quarantine=suspicious_files]
    N -- No --> P[Continue to process evaluation]
```

---

## Backend Architecture

The FastAPI backend uses a lifespan context manager to manage MongoDB connections and background tasks.

```mermaid
flowchart TD
    A[uvicorn app.main:app] --> B[config.py loads .env\nvia pydantic-settings]
    B --> C{SECRET_KEY in insecure defaults?}
    C -- Yes --> D[Print FATAL error\nsys.exit 1]
    C -- No --> E[FastAPI app created\nlifespan context]
    E --> F[connect_to_mongo\nAsyncIOMotorClient]
    F --> G[Create MongoDB indexes\non startup]
    G --> H[asyncio.create_task\n_mark_offline_loop]
    H --> I[setup_cors\nlocalhost 5173 + 3000]
    I --> J[Include routers\n/api/auth /api/users\n/api/agents /api/attacks]
    J --> K[Server running]

    K --> L[_mark_offline_loop\nevery 60s]
    L --> M[agents.update_many\nstatus in online,degraded\nAND last_seen < now-120s\n→ status=offline]
```

### Route Groups

| Prefix | Router | Auth Required |
|---|---|---|
| `/api/auth` | `auth.py` | None |
| `/api/users` | `users.py` | JWT Bearer |
| `/api/agents` | `agents.py` | Mixed (see below) |
| `/api/attacks` | `attacks.py` | Mixed (see below) |

**Mixed auth on `/api/agents`:**
- `POST /api/agents/register` → `get_registration_identity` (X-User-Id header only)
- `GET /api/agents`, `GET /api/agents/{id}`, `GET /api/agents/download` → `get_current_user` (JWT Bearer)
- `PATCH /api/agents/{id}/heartbeat` → `get_agent_identity` (X-Agent-Id + X-Agent-Token)

**Mixed auth on `/api/attacks`:**
- `POST /api/attacks` → `get_agent_identity` (X-Agent-Id + X-Agent-Token)
- `GET /api/attacks`, `GET /api/attacks/{id}` → `get_current_user` (JWT Bearer)

---

## Database Architecture

```mermaid
erDiagram
    users {
        ObjectId _id PK
        string email UK
        string hashed_password
        string full_name
        datetime created_at
        bool is_active
    }

    agents {
        ObjectId _id PK
        string agent_id UK
        string user_id FK
        string hostname
        string os_info
        string status
        datetime last_seen
        datetime created_at
        string version
        string token_hash
    }

    attacks {
        ObjectId _id PK
        string attack_id
        string agent_id FK
        string user_id FK
        string technique
        string title
        string description
        dict features
        string action_taken
        string severity
        string status
        float risk_score
        float local_anomaly_score
        string hostname
        string process_name
        string parent_process
        list detection_methods
        datetime timestamp
        string raw_summary
    }

    users ||--o{ agents : "owns"
    users ||--o{ attacks : "owns"
    agents ||--o{ attacks : "reports"
```

**Multi-tenant isolation:** Every query for agents or attacks includes `{"user_id": str(current_user["id"])}` in the filter. This is enforced at the route handler level, not via middleware, ensuring that even if a user guesses a valid `agent_id` or `attack_id`, they cannot retrieve records belonging to another user.

---

## Frontend Architecture

```mermaid
flowchart TD
    A[main.jsx\nBrowserRouter] --> B[App.jsx\nAuthProvider wrapper]
    B --> C{Route match}

    C --> D[PublicLayout\n/  /features  /architecture\n/security  /docs]
    C --> E[Auth pages\n/login  /register]
    C --> F[Layout dashboard\n/dashboard/*]

    B --> G[AuthContext\nuser + login + logout + register]
    G --> H[localStorage JWT]
    G --> I[On mount: GET /api/users/me\nvalidate token]
    G --> J[On auth:unauthorized event\nclear user state]

    F --> K[Sidebar navigation]
    F --> L[Dashboard overview\nStatsCards + AttackChart + RecentAttacks]
    F --> M[Agents list\nAgentCard components]
    F --> N[AgentDetail\nattack history per agent]
    F --> O[Attacks timeline\nAttackTable + AttackFilters]
    F --> P[DownloadAgent\ngenerate + download ZIP]

    Q[axios.js instance] --> R[Request interceptor\nattach Bearer token]
    Q --> S[Response interceptor\n401 → dispatch auth:unauthorized]
    Q --> T[authService.js]
    Q --> U[agentService.js]
    Q --> V[attackService.js]
```

---

## Degraded Mode Behaviour

When `python3-bpfcc` is not available or the BPF program fails to compile:

```
Agent startup
    ↓
EBPFMonitor.start()
    ↓
try: from bcc import BPF
    ↓
ImportError OR BPF load exception
    ↓
ebpf_monitor.available = False
ebpf_monitor.running = False
LOG: "BCC not installed. Agent running in degraded mode."
    ↓
agent.py: reporter._ebpf_available = False
    ↓
Heartbeat sends: { "status": "degraded" }
    ↓
Backend stores: agents.status = "degraded"
    ↓
Dashboard shows: status = "Degraded" (amber/warning colour)
    ↓
Userspace monitoring (Monitor) continues normally
```

All process, filesystem, and cron monitoring continues to function. Only kernel-boundary file-creation events (T1486 eBPF path) are unavailable.

---

## Offline Detection

```
Agent running normally
    ↓
Agent process killed / network lost
    ↓
No heartbeat PATCH received by backend
    ↓
Backend _mark_offline_loop (every 60s):
  agents with status in {online, degraded}
  AND last_seen < now - 120s
    ↓
  → status = "offline"
    ↓
Dashboard shows: status = "Offline" (red/danger colour)
```

The 120-second threshold gives a 4× margin over the 30-second heartbeat interval before marking an agent offline, accommodating brief network disruptions.

---

## Data Flow Summary

```
User → Register → MongoDB(users) → JWT issued

User → DownloadAgent → Backend generates ZIP
  → ZIP contains: agent source + .env(USER_ID, AGENT_ID) + install.sh

Agent → Register → MongoDB(agents) + token issued once
Agent → Heartbeat every 30s → MongoDB(agents.last_seen)

Endpoint activity
  → Monitor/EBPFMonitor → ML inference → Risk → Policy
  → Prevention (local, immediate)
  → AttackEvent → Queue → HTTP POST → MongoDB(attacks)

User → Dashboard → GET /api/agents → MongoDB(agents) scoped to user_id
User → Dashboard → GET /api/attacks → MongoDB(attacks) scoped to user_id

Backend background task (every 60s):
  → MongoDB(agents) last_seen > 120s → status = offline
```
