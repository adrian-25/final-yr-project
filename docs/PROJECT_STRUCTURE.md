# ARCDIS — Project Structure

Annotated file tree of the ARCDIS repository. All paths are relative to the repository root. Generated files (`node_modules`, `__pycache__`, `venv`, `dist`, `.pkl` model binaries beyond naming) are excluded.

---

## Repository Root

```
ARCDIS/
├── README.md                    ← Main project documentation
├── .gitignore                   ← Excludes .env files, __pycache__, venv, node_modules,
│                                   logs, and OS/editor artifacts
├── backend/                     ← FastAPI Python backend
├── agent/                       ← Python endpoint monitoring agent
├── client/                      ← React frontend (Vite SPA)
└── docs/                        ← Documentation suite
```

---

## docs/

```
docs/
├── ARCHITECTURE.md              ← Full system architecture with Mermaid diagrams
├── API.md                       ← Complete REST API reference
├── SETUP.md                     ← Step-by-step installation guide
├── TECH_STACK.md                ← Technology breakdown with rationale
├── SECURITY.md                  ← Security model, mechanisms, and limitations
├── PROJECT_STRUCTURE.md         ← This file
└── images/                      ← Screenshot directory (screenshots pending)
```

---

## backend/

```
backend/
├── requirements.txt             ← Python dependencies (pip install -r)
│                                   fastapi, uvicorn[standard], motor, pydantic[email],
│                                   pydantic-settings, python-jose[cryptography],
│                                   passlib[bcrypt], bcrypt<4.0.0, python-multipart
├── .env.example                 ← Environment variable template (safe to commit)
└── app/
    ├── __init__.py
    ├── main.py                  ← FastAPI application instance, lifespan context,
    │                               background _mark_offline_loop coroutine,
    │                               router registration, CORS setup
    ├── config.py                ← pydantic-settings Settings class; loads .env;
    │                               enforces SECRET_KEY at startup (sys.exit if insecure)
    ├── database.py              ← AsyncIOMotorClient setup, connect/close functions,
    │                               collection accessors, MongoDB index creation
    │
    ├── models/                  ← MongoDB document models (Pydantic BaseModel)
    │   ├── __init__.py          ← PyObjectId custom type for bson.ObjectId compatibility
    │   ├── user.py              ← UserModel: _id, email, hashed_password, full_name,
    │   │                           created_at, is_active
    │   ├── agent.py             ← AgentModel: _id, agent_id, user_id, hostname, os_info,
    │   │                           status, last_seen, created_at, version, token_hash
    │   └── attack.py            ← AttackModel: _id, attack_id, agent_id, user_id,
    │                               technique, title, description, features (dict),
    │                               action_taken, severity, status, risk_score,
    │                               local_anomaly_score, hostname, process_name,
    │                               parent_process, detection_methods, timestamp, raw_summary
    │
    ├── schemas/                 ← Request/response schemas (Pydantic BaseModel)
    │   ├── __init__.py
    │   ├── user.py              ← UserCreate (email, password, full_name)
    │   │                           UserResponse (id, email, full_name, created_at, is_active)
    │   ├── token.py             ← Token (access_token, token_type)
    │   │                           TokenData (email)
    │   ├── agent.py             ← AgentRegister, AgentResponse, AgentHeartbeat,
    │   │                           AgentHeartbeatResponse
    │   └── attack.py            ← AttackReport (with field_validator for severity normalisation)
    │                               AttackResponse
    │
    ├── routes/                  ← FastAPI APIRouter route handlers
    │   ├── __init__.py
    │   ├── auth.py              ← POST /api/auth/register
    │   │                           POST /api/auth/login (OAuth2PasswordRequestForm)
    │   ├── users.py             ← GET /api/users/me (JWT auth)
    │   ├── agents.py            ← POST /api/agents/register (X-User-Id auth)
    │   │                           GET /api/agents (JWT auth)
    │   │                           GET /api/agents/download (JWT auth)
    │   │                           GET /api/agents/{agent_id} (JWT auth)
    │   │                           PATCH /api/agents/{agent_id}/heartbeat (agent token auth)
    │   └── attacks.py           ← POST /api/attacks (agent token auth)
    │                               GET /api/attacks (JWT auth, with optional filters)
    │                               GET /api/attacks/{attack_id} (JWT auth)
    │
    ├── services/                ← Business logic layer
    │   ├── __init__.py
    │   ├── auth_service.py      ← create_user: validates uniqueness, hashes password,
    │   │                           inserts UserModel into MongoDB
    │   └── agent_service.py     ← register_agent: generates per-agent token via
    │                               secrets.token_hex(32), stores bcrypt hash, returns
    │                               plaintext once
    │                               update_agent_heartbeat: updates last_seen + status,
    │                               clamps status to allowed values
    │
    ├── utils/
    │   ├── __init__.py
    │   ├── security.py          ← passlib CryptContext (bcrypt), verify_password,
    │   │                           get_password_hash, create_access_token (HS256 JWT)
    │   └── dependencies.py      ← FastAPI Depends functions:
    │                               get_current_user (JWT Bearer)
    │                               get_registration_identity (X-User-Id for registration)
    │                               get_agent_identity (X-Agent-Id + X-Agent-Token)
    │
    └── middleware/
        └── cors.py              ← CORSMiddleware configuration
                                    allowed origins: localhost:5173, localhost:3000
```

---

## agent/

```
agent/
├── requirements.txt             ← Python dependencies (exact versions):
│                                   psutil==5.9.8, requests==2.31.0,
│                                   python-dotenv==1.0.1, scikit-learn==1.4.2,
│                                   joblib==1.4.2, numpy==1.26.4, setproctitle==1.3.3
│                                   (python3-bpfcc is a system package, not pip-installed)
├── .env.example                 ← Environment variable template for agent configuration
│
├── agent.py                     ← Entry point
│                                   - Process name masking (prctl + setproctitle)
│                                   - SIGINT/SIGTERM signal handlers
│                                   - ARCDISAgent class: orchestrates startup sequence
│                                   - Startup order: validate → register → eBPF → heartbeat → monitor
│
├── monitor.py                   ← Userspace monitoring loop (blocking, 2s interval)
│                                   - _init_cron_baseline: evaluates pre-existing cron entries
│                                   - _scan_processes: iterates psutil process tree each tick
│                                   - _check_directory_deltas: detects new files in home dirs
│                                   - _scan_cron: every 45s, scans crontabs + /etc/crontab + /etc/cron.d/
│                                   - _handle_detection: dedup → risk → policy → prevent → report
│                                   - Protected directories from /etc/passwd (UID ≥ 1000 + root)
│                                   - Deduplication: 60s cooldown per (pid, behavior_type)
│
├── ebpf_monitor.py              ← eBPF kernel-level file-creation monitor
│                                   - Inline BPF C program compiled at runtime via BCC
│                                   - Tracepoints: sys_enter_openat, sys_enter_open,
│                                     sys_enter_creat, sys_enter_openat2
│                                   - Per-PID sliding window event counter
│                                   - Whitelist for safe apps (chrome, firefox, apt, node, git, etc.)
│                                   - Graceful degradation if BCC is unavailable
│
├── reporter.py                  ← HTTP communication layer
│                                   - register(): POST /api/agents/register
│                                   - _persist_token(): writes AGENT_TOKEN to .env
│                                   - send_attack_event(): non-blocking queue enqueue
│                                   - _sender_loop(): background thread draining event queue
│                                   - _heartbeat_loop(): PATCH heartbeat every 30s
│                                   - Queue capacity: 200 events (drops on full)
│
├── ml.py                        ← LocalAnomalyDetector class
│                                   - Manages 5 IsolationForest models + 5 StandardScalers
│                                   - Loads from .pkl or retrains synthetic baseline if missing
│                                   - evaluate_tree(spawn_count, total_memory, avg_memory)
│                                   - evaluate_process(cpu_percent, memory_mb, num_threads)
│                                   - evaluate_fs(write_mb_rate, write_count_rate, protected_open_files)
│                                   - evaluate_ebpf(file_creation_count)
│                                   - evaluate_cron(line_length, entropy, keyword_count, network_score)
│                                   - Heuristic boost rules applied after ML score
│
├── risk.py                      ← RiskEvaluator class
│                                   - evaluate(score): < 0.5 → LOW, ≤ 0.8 → SUSPICIOUS, > 0.8 → HIGH
│
├── policy.py                    ← PolicyEngine class
│                                   - Loads policies from policies.json
│                                   - select_policy(risk_tier, behavior_type): first-match rule engine
│                                   - Fallback: pol_default_monitor (MONITOR_ONLY)
│
├── policies.json                ← Policy rule definitions (JSON)
│                                   5 rules:
│                                   - pol_high_anomaly_storm (HIGH + process_storm → TERMINATE_PROCESS_TREE)
│                                   - pol_suspicious_monitoring (SUSPICIOUS + any → MONITOR_ONLY)
│                                   - pol_high_resource_exhaustion (HIGH + anomalous_process → TERMINATE_SINGLE_PROCESS)
│                                   - pol_resource_hijacking (HIGH + resource_hijacker → TERMINATE_PROCESS_TREE)
│                                   - pol_ransomware (HIGH + ransomware → QUARANTINE_AND_TERMINATE)
│
├── preventer.py                 ← Preventer class (all prevention actions)
│                                   - terminate_process_tree(parent_pid): SIGSTOP → SIGTERM → wait → SIGKILL
│                                   - terminate_single_process(pid): same, single process only
│                                   - quarantine_and_terminate(pid, files): suspend → move files → terminate
│                                   - remove_cron_line(malicious_line): crontab -u user - (all users)
│                                   - execute_policy(policy, pid, files): action allowlist dispatcher
│
├── models.py                    ← Dataclasses for agent-side data structures
│                                   - AgentRegistration: agent_id, hostname, os_info, version
│                                   - AttackEvent: full attack event payload
│                                   - ProcessInfo: pid, ppid, name, cmdline, create_time, memory_mb
│
├── config.py                    ← Config class: loads .env via python-dotenv
│                                   - Identity: AGENT_ID, USER_ID, AGENT_TOKEN
│                                   - System: HOSTNAME, OS_INFO, AGENT_VERSION
│                                   - Timings: HEARTBEAT_INTERVAL, MONITOR_INTERVAL
│                                   - Thresholds: MAX_CHILDREN_PER_WINDOW, MAX_CHILD_MEMORY_MB,
│                                     SPAWN_WINDOW_SECONDS, EBPF_FILE_CREATION_THRESHOLD,
│                                     EBPF_WINDOW_SECONDS
│                                   - validate(): raises ValueError if AGENT_ID or USER_ID missing
│
├── utils.py                     ← Rotating file logger setup
│                                   - /var/log/arcdis/agent.log (root) or logs/agent.log (fallback)
│                                   - RotatingFileHandler: 5 MB max, 3 backup files
│
├── local_tree_model.pkl         ← Pre-trained IsolationForest for process tree detection
├── local_tree_scaler.pkl        ← StandardScaler paired with tree model
├── local_process_model.pkl      ← Pre-trained IsolationForest for single process detection
├── local_process_scaler.pkl     ← StandardScaler paired with process model
├── local_fs_model.pkl           ← Pre-trained IsolationForest for filesystem detection
├── local_fs_scaler.pkl          ← StandardScaler paired with FS model
├── local_ebpf_model.pkl         ← Pre-trained IsolationForest for eBPF file-creation detection
├── local_ebpf_scaler.pkl        ← StandardScaler paired with eBPF model
├── local_cron_model.pkl         ← Pre-trained IsolationForest for cron persistence detection
└── local_cron_scaler.pkl        ← StandardScaler paired with cron model
```

---

## client/

```
client/
├── package.json                 ← npm dependencies and scripts
│                                   scripts: dev, build, lint, preview
│                                   dependencies: react 18.2, react-router-dom 7,
│                                     axios, tailwind-merge, date-fns, framer-motion,
│                                     lucide-react, react-hot-toast, recharts, clsx
│                                   devDependencies: vite 5, @vitejs/plugin-react,
│                                     tailwindcss 3, @tailwindcss/forms, postcss, autoprefixer,
│                                     eslint + react plugins
├── vite.config.js               ← Vite build config (React plugin only, no proxy config)
├── tailwind.config.js           ← Tailwind theme extensions (custom colours, fonts, utilities)
├── postcss.config.js            ← PostCSS config required by Tailwind
├── index.html                   ← SPA entry point (div#root, imports main.jsx)
├── .env.example                 ← Frontend env template: VITE_API_URL
│
└── src/
    ├── main.jsx                 ← React app bootstrap: ReactDOM.createRoot,
    │                               BrowserRouter wrapper
    ├── App.jsx                  ← Route definitions:
    │                               PublicLayout group (/ /features /architecture /security /docs)
    │                               Auth pages (/login /register)
    │                               Dashboard Layout group (/dashboard/*)
    │                               Legacy redirects
    ├── App.css                  ← Global base styles (minimal, most styling via Tailwind)
    ├── index.css                ← Tailwind base/components/utilities directives,
    │                               custom scrollbar styles, global typography
    │
    ├── api/
    │   └── axios.js             ← Configured Axios instance:
    │                               - baseURL from VITE_API_URL constant
    │                               - Request interceptor: attach Authorization Bearer token
    │                               - Response interceptor: 401 → dispatch auth:unauthorized event
    │
    ├── context/
    │   └── AuthContext.jsx      ← React Context for authentication state:
    │                               - user, login, register, logout, loading
    │                               - On mount: GET /api/users/me to validate stored JWT
    │                               - Listens for auth:unauthorized to clear state
    │
    ├── hooks/
    │   ├── useAuth.js           ← Convenience hook: useContext(AuthContext)
    │   └── useApi.js            ← Generic API call hook with loading/error state
    │
    ├── services/                ← API call functions (use the Axios instance)
    │   ├── authService.js       ← login, register, getCurrentUser
    │   ├── agentService.js      ← getAgents, getAgent, downloadAgent
    │   └── attackService.js     ← getAttacks, getAttack
    │
    ├── utils/
    │   ├── constants.js         ← API_BASE_URL, SEVERITY_LEVELS, AGENT_STATUS,
    │   │                           SEVERITY_COLORS, STATUS_COLORS, NAV_LINKS
    │   ├── mockData.js          ← Development mock data (not used in production API calls)
    │   └── cn.js                ← clsx + tailwind-merge helper: cn(...classes)
    │
    ├── pages/
    │   │
    │   │   ── Public pages (within PublicLayout) ──
    │   ├── Landing.jsx          ← Marketing landing page with hero, feature highlights,
    │   │                           architecture overview, CTA
    │   ├── Features.jsx         ← Feature details page
    │   ├── Architecture.jsx     ← Architecture overview page
    │   ├── Security.jsx         ← Security model overview page
    │   ├── Docs.jsx             ← Documentation page
    │   │
    │   │   ── Auth pages ──
    │   ├── Login.jsx            ← Login form: email + password → authService.login
    │   ├── Register.jsx         ← Registration form: email + password + full_name
    │   │
    │   │   ── Authenticated dashboard pages ──
    │   ├── Dashboard.jsx        ← Main overview: stats cards, attack timeline chart,
    │   │                           recent attacks list
    │   ├── Agents.jsx           ← List of all agents with status badges
    │   ├── AgentDetail.jsx      ← Per-agent detail view: info + attack history
    │   ├── Attacks.jsx          ← Full attacks timeline with filters
    │   ├── DownloadAgent.jsx    ← Deploy agent: enter agent_id, download ZIP
    │   └── NotFound.jsx         ← 404 page
    │
    └── components/
        │
        ├── layout/              ← Authenticated dashboard shell
        │   ├── Layout.jsx       ← Outlet wrapper with Sidebar + Navbar
        │   ├── Navbar.jsx       ← Top navigation bar (user info, logout)
        │   └── Sidebar.jsx      ← Left sidebar with nav links (Dashboard, Agents,
        │                           Attacks, Deploy Agent)
        │
        ├── public/              ← Public site shell
        │   ├── PublicLayout.jsx ← Outlet wrapper with PublicNavbar + PublicFooter
        │   ├── PublicNavbar.jsx ← Top navigation with links to public pages + login/register
        │   └── PublicFooter.jsx ← Footer for public pages
        │
        ├── ui/                  ← Reusable primitive components
        │   ├── Button.jsx       ← Button with variant (primary/secondary/danger/ghost)
        │   │                       and size (sm/md/lg) props
        │   ├── Card.jsx         ← Dark-themed card container
        │   ├── Badge.jsx        ← Status/severity badge using SEVERITY_COLORS / STATUS_COLORS
        │   ├── Input.jsx        ← Styled text input with label and error state
        │   ├── Modal.jsx        ← Overlay modal dialog
        │   └── LoadingSpinner.jsx ← Animated SVG spinner
        │
        ├── dashboard/           ← Dashboard page components
        │   ├── StatsCards.jsx   ← Grid of metric cards (total agents, online, attacks, etc.)
        │   ├── AttackChart.jsx  ← Recharts AreaChart of attack volume over time
        │   └── RecentAttacks.jsx ← List of most recent attack events
        │
        ├── agents/              ← Agent list components
        │   ├── AgentList.jsx    ← Maps agent data to AgentCard components
        │   └── AgentCard.jsx    ← Individual agent card with status, hostname, last_seen
        │
        └── attacks/             ← Attack view components
            ├── AttackTable.jsx  ← Tabular view of attack events
            ├── AttackFilters.jsx ← Filter controls (by technique, severity, date)
            └── AttackDetail.jsx ← Expanded detail view for a single attack event
```

---

## Files Intentionally Excluded

The following are excluded from the above tree (gitignored or generated):

| Path | Reason |
|---|---|
| `**/node_modules/` | npm dependency cache |
| `**/__pycache__/` | Python bytecode cache |
| `**/venv/` or `**/.venv/` | Python virtual environment |
| `client/dist/` | Vite production build output |
| `**/.env` | Secret configuration files |
| `**/logs/` or `/var/log/arcdis/` | Runtime log files |
| `agent/agent.log` | Agent log file |

These are all covered by the root `.gitignore`.
