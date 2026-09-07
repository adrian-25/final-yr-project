# ARCDIS — Technology Stack

Detailed breakdown of every technology used in the ARCDIS project. All entries below were verified directly from source code, `requirements.txt`, `package.json`, and configuration files.

---

## Table of Contents

- [Frontend](#frontend)
- [Backend](#backend)
- [Security / Endpoint Agent](#security--endpoint-agent)
- [Database](#database)
- [Infrastructure / OS](#infrastructure--os)
- [Development & Build Tools](#development--build-tools)

---

## Frontend

The ARCDIS dashboard is a React single-page application built with Vite. It is located in the `/client` directory.

### React 18.2
**What it is:** A declarative JavaScript library for building component-based user interfaces.  
**Why ARCDIS uses it:** Provides a component model and Context API for managing global authentication state (`AuthContext`) and building reusable UI primitives (Card, Badge, Button, Modal, etc.).  
**Where it is used:** All pages and components under `client/src/`.

### Vite 5.1
**What it is:** A fast ES-module-native build tool and development server.  
**Why ARCDIS uses it:** Near-instant HMR (Hot Module Replacement) during development and optimised production builds. The project is bootstrapped with `@vitejs/plugin-react`.  
**Where it is used:** `client/vite.config.js`, `npm run dev`, `npm run build`.

### React Router DOM 7
**What it is:** The standard client-side routing library for React applications.  
**Why ARCDIS uses it:** Manages two distinct route groups: a public marketing site (`PublicLayout`) and an authenticated dashboard (`Layout`). Also handles legacy redirects from old URL paths.  
**Where it is used:** `client/src/App.jsx` — all route definitions. Version 7 is specified in `package.json` (`^7.18.2`).

### Tailwind CSS 3.4
**What it is:** A utility-first CSS framework.  
**Why ARCDIS uses it:** Enables rapid styling of dark-themed components without writing custom CSS. All UI components use Tailwind utility classes directly.  
**Where it is used:** `client/tailwind.config.js`, `client/src/index.css` (base directives), all `.jsx` component files.

### Recharts 3
**What it is:** A composable charting library built on React and D3.  
**Why ARCDIS uses it:** Renders the attack timeline AreaChart in the dashboard overview, and additional charts in the `AttackChart` component.  
**Where it is used:** `client/src/components/dashboard/AttackChart.jsx`, `Dashboard.jsx`.

### Axios 1.19+
**What it is:** A Promise-based HTTP client for JavaScript.  
**Why ARCDIS uses it:** Provides a configured API instance with two critical interceptors — a request interceptor that attaches the JWT Bearer token to every call, and a response interceptor that handles 401 errors globally by dispatching an `auth:unauthorized` event.  
**Where it is used:** `client/src/api/axios.js`, all service files (`authService.js`, `agentService.js`, `attackService.js`).

### Framer Motion 11.3.19
**What it is:** An animation library for React.  
**Why ARCDIS uses it:** Powers page transitions and interactive animations across the landing page and dashboard components.  
**Where it is used:** Public pages (`Landing.jsx`, `Features.jsx`, etc.) and dashboard pages.

### Lucide React 1.31+
**What it is:** A tree-shakeable icon library for React based on the Lucide icon set.  
**Why ARCDIS uses it:** Provides all icons used in the sidebar, navbar, cards, and status indicators throughout the dashboard.  
**Where it is used:** Sidebar (`Sidebar.jsx`), Navbar, card components, attack and agent components.

### react-hot-toast 2.6
**What it is:** A lightweight toast notification library for React.  
**Why ARCDIS uses it:** Provides feedback for user actions such as login success/failure, agent download, and error conditions. Configured with a dark theme to match the dashboard.  
**Where it is used:** `client/src/App.jsx` (Toaster component), triggered from login/register/download flows.

### date-fns 4.4
**What it is:** A modern JavaScript date utility library.  
**Why ARCDIS uses it:** Formats timestamps on attack events and agent `last_seen` fields into human-readable strings throughout the dashboard.  
**Where it is used:** Attack table, agent card, and detail components.

### clsx 2.1.1
**What it is:** A small utility for constructing conditional `className` strings.  
**Why ARCDIS uses it:** Used alongside `tailwind-merge` in `client/src/utils/cn.js` to compose conditional Tailwind classes without conflicts.  
**Where it is used:** `client/src/utils/cn.js`, UI components (Button, Badge, Card).

### tailwind-merge 3.6.0
**What it is:** A utility that intelligently merges Tailwind CSS classes, resolving conflicts.  
**Why ARCDIS uses it:** Prevents class conflicts when components receive variant overrides. Works in combination with `clsx` via the `cn()` helper.  
**Where it is used:** `client/src/utils/cn.js`.

### @tailwindcss/forms 0.5.11
**What it is:** A Tailwind CSS plugin that resets default browser form styling.  
**Why ARCDIS uses it:** Ensures consistent cross-browser styling for the login, register, and filter form inputs.  
**Where it is used:** `client/tailwind.config.js` (plugins section).

---

## Backend

The ARCDIS backend is a Python async REST API located in the `/backend` directory.

### Python 3.11+
**What it is:** The Python runtime.  
**Why ARCDIS uses it:** Version 3.11+ is required for the `timedelta | None` union syntax used in `security.py` and async improvements in the `asyncio` runtime.  
**Where it is used:** All Python source files under `backend/`.

### FastAPI ≥0.100
**What it is:** A modern, high-performance Python web framework for building APIs with automatic OpenAPI documentation generation.  
**Why ARCDIS uses it:** Provides async request handling, automatic Pydantic-based validation, dependency injection for authentication middleware, and built-in Swagger UI at `/docs`.  
**Where it is used:** `backend/app/main.py` — the FastAPI application instance. All route files in `backend/app/routes/`.

### Uvicorn ≥0.22 (standard extras)
**What it is:** An ASGI web server implementation for Python.  
**Why ARCDIS uses it:** Serves the FastAPI application. The `[standard]` extra installs `uvloop` and `httptools` for improved performance.  
**Where it is used:** Used to start the server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

### Motor ≥3.2
**What it is:** The official asynchronous Python driver for MongoDB, built on top of PyMongo and `asyncio`.  
**Why ARCDIS uses it:** All database operations are non-blocking. `AsyncIOMotorClient` is initialised at startup and used across all route handlers via dependency injection.  
**Where it is used:** `backend/app/database.py` — `connect_to_mongo()`, `get_user_collection()`, `get_agent_collection()`, `get_attack_collection()`.

### Pydantic v2 ≥2.0
**What it is:** A data validation and serialisation library using Python type annotations.  
**Why ARCDIS uses it:** Defines all request/response schemas and MongoDB document models. The `field_validator` on `AttackReport.severity` normalises severity strings to uppercase at the schema boundary.  
**Where it is used:** `backend/app/schemas/` (all schema files), `backend/app/models/` (all model files).

### pydantic-settings ≥2.0
**What it is:** A Pydantic extension for loading configuration from environment variables and `.env` files.  
**Why ARCDIS uses it:** The `Settings` class in `config.py` loads all environment variables (`SECRET_KEY`, `MONGODB_URL`, `DATABASE_NAME`, etc.) from the `.env` file at startup. Also performs the startup secret enforcement check.  
**Where it is used:** `backend/app/config.py`.

### python-jose ≥3.3 (cryptography backend)
**What it is:** A Python implementation of JOSE (JSON Object Signing and Encryption) standards, including JWT.  
**Why ARCDIS uses it:** Creates and verifies HS256-signed JWT tokens for user authentication. The `SECRET_KEY` from config is used as the signing key.  
**Where it is used:** `backend/app/utils/security.py` (`create_access_token`), `backend/app/utils/dependencies.py` (`get_current_user`).

### passlib ≥1.7.4
**What it is:** A comprehensive password hashing library for Python.  
**Why ARCDIS uses it:** Provides the `CryptContext` configured with bcrypt for hashing and verifying both user passwords and per-agent tokens.  
**Where it is used:** `backend/app/utils/security.py` — `get_password_hash()` and `verify_password()`.

### bcrypt <4.0.0
**What it is:** The bcrypt password hashing algorithm implementation.  
**Why ARCDIS uses it:** Required as the hashing backend for `passlib`. Version is capped at `<4.0.0` for `passlib` compatibility.  
**Where it is used:** Transitively via `passlib[bcrypt]`.

### python-multipart ≥0.0.6
**What it is:** A streaming multipart form data parser for Python.  
**Why ARCDIS uses it:** Required by FastAPI to parse `OAuth2PasswordRequestForm` submissions (the login endpoint uses `application/x-www-form-urlencoded` format).  
**Where it is used:** Login endpoint in `backend/app/routes/auth.py`.

---

## Security / Endpoint Agent

The ARCDIS agent is a Python daemon located in the `/agent` directory.

### Python 3.11+
**What it is:** The Python runtime.  
**Why ARCDIS uses it:** Required for the `match/case` compatibility and dataclass features used in `models.py` and `config.py`.  
**Where it is used:** All Python source files under `agent/`.

### psutil 5.9.8
**What it is:** A cross-platform library for retrieving information on running processes and system utilisation.  
**Why ARCDIS uses it:** The core of the userspace monitoring loop. Used to iterate the process tree, measure CPU percentage, memory RSS, thread count, IO counters, open file handles, and parent-child relationships.  
**Where it is used:** `agent/monitor.py` — `psutil.process_iter()`, `psutil.Process()`, `io_counters()`, `open_files()`, `children()`, `wait_procs()`. Also used in `preventer.py` for process termination.

### requests 2.31.0
**What it is:** A synchronous HTTP library for Python.  
**Why ARCDIS uses it:** Used by the `Reporter` class for all outbound HTTP calls — agent registration, heartbeat PATCH, and attack event POST. Runs in background threads to avoid blocking the detection loop.  
**Where it is used:** `agent/reporter.py` — all HTTP calls.

### python-dotenv 1.0.1
**What it is:** A library for loading environment variables from `.env` files.  
**Why ARCDIS uses it:** Loads agent configuration on startup (`load_dotenv()` in `config.py`). Also used to write the `AGENT_TOKEN` back to `.env` after registration using `set_key()` from `dotenv`.  
**Where it is used:** `agent/config.py`, `agent/reporter.py` (`_persist_token` method).

### scikit-learn 1.4.2
**What it is:** A machine learning library for Python built on NumPy and SciPy.  
**Why ARCDIS uses it:** Provides the `IsolationForest` unsupervised anomaly detection algorithm used for all five detection models, and `StandardScaler` for feature normalisation.  
**Where it is used:** `agent/ml.py` — `LocalAnomalyDetector` class, all model training and inference methods.

### joblib 1.4.2
**What it is:** A library for lightweight pipelining and serialisation in Python.  
**Why ARCDIS uses it:** Serialises and deserialises the trained IsolationForest models and StandardScalers to/from `.pkl` files. `joblib.dump()` and `joblib.load()` are used instead of `pickle` for better performance with large NumPy arrays.  
**Where it is used:** `agent/ml.py` — all `_load_or_train_models()`, `_train_baseline_*()` methods.

### numpy 1.26.4
**What it is:** The fundamental package for numerical computing in Python.  
**Why ARCDIS uses it:** All feature vectors passed to IsolationForest models are NumPy arrays. Used for `np.array()`, `np.random.uniform()`, and `np.vstack()` in model training and inference.  
**Where it is used:** `agent/ml.py` — all `evaluate_*()` and `_train_baseline_*()` methods.

### setproctitle 1.3.3
**What it is:** A Python library to customise the process title as shown in `ps`, `top`, etc.  
**Why ARCDIS uses it:** Masks the agent's process name to `Arcdis` in the process list, making it less obvious to an attacker who is enumerating running processes.  
**Where it is used:** `agent/agent.py` — startup block using `setproctitle.setproctitle("Arcdis")`.

### ctypes (stdlib) + prctl(PR_SET_NAME)
**What it is:** Python's built-in foreign function library, used to call C library functions directly.  
**Why ARCDIS uses it:** Calls `libc.prctl(PR_SET_NAME=15, "Arcdis")` to set the kernel-level process name, which is visible in `/proc/<pid>/status` and `top`. Complements `setproctitle` for complete process masking.  
**Where it is used:** `agent/agent.py` — startup block.

### bcc / python3-bpfcc (system package)
**What it is:** The BPF Compiler Collection — a toolkit for creating kernel tracing and networking programs using eBPF.  
**Why ARCDIS uses it:** Allows the agent to compile and load an inline BPF C program at runtime that attaches tracepoints to `open`, `openat`, `creat`, and `openat2` syscalls. Enables kernel-boundary file-creation event monitoring.  
**Where it is used:** `agent/ebpf_monitor.py` — `from bcc import BPF`. Installed separately as a system package (`sudo apt-get install python3-bpfcc linux-headers-$(uname -r)`). The import is wrapped in a try/except so the agent degrades gracefully if bcc is not installed.

### signal (stdlib)
**What it is:** Python's built-in signal handling module.  
**Why ARCDIS uses it:** Registers handlers for `SIGINT` and `SIGTERM` to trigger a graceful shutdown sequence (stopping the eBPF monitor, monitor loop, and heartbeat thread cleanly before exit).  
**Where it is used:** `agent/agent.py` — `signal.signal(signal.SIGINT, signal_handler)`, `signal.signal(signal.SIGTERM, signal_handler)`.

### subprocess (stdlib)
**What it is:** Python's built-in module for spawning subprocesses.  
**Why ARCDIS uses it:** Used to invoke `crontab -u <user> -l` (read crontab) and `crontab -u <user> -` (write crontab) for cron persistence scanning and cron line removal.  
**Where it is used:** `agent/monitor.py` (`_scan_cron`, `_init_cron_baseline`), `agent/preventer.py` (`remove_cron_line`).

### pwd (stdlib)
**What it is:** Python's built-in interface to the POSIX password database (`/etc/passwd`).  
**Why ARCDIS uses it:** Enumerates all system users with UID ≥ 1000 plus root to determine which home directories to protect and which user crontabs to scan.  
**Where it is used:** `agent/monitor.py` — constructor and `_scan_cron`.

### logging + logging.handlers (stdlib)
**What it is:** Python's built-in structured logging framework.  
**Why ARCDIS uses it:** All agent modules use a centralised rotating file logger that writes to `/var/log/arcdis/agent.log` (falling back to `logs/agent.log` if not running as root) with a 5 MB max size and 3 backup files.  
**Where it is used:** `agent/utils.py` — `setup_logger()`, imported as `logger` in all agent modules.

### threading (stdlib)
**What it is:** Python's built-in thread-based parallelism module.  
**Why ARCDIS uses it:** The heartbeat loop and event sender loop run as daemon threads. The eBPF monitor also runs its perf buffer poll loop in a daemon thread.  
**Where it is used:** `agent/reporter.py`, `agent/ebpf_monitor.py`.

### queue (stdlib)
**What it is:** Python's built-in thread-safe queue implementation.  
**Why ARCDIS uses it:** The `Reporter` uses a `queue.Queue(maxsize=200)` as the event buffer between the detection loop and the sender thread, ensuring detection is never blocked by network latency.  
**Where it is used:** `agent/reporter.py`.

---

## Database

### MongoDB 6+
**What it is:** A document-oriented NoSQL database.  
**Why ARCDIS uses it:** Schema-flexible storage that naturally maps to the varied `features` dictionary field in attack events (each detection type produces a different feature set). No rigid column schema required.  
**Where it is used:** `backend/app/database.py`. Three collections:

| Collection | Purpose | Key Indexes |
|---|---|---|
| `users` | User accounts | `email` (unique) |
| `agents` | Registered endpoint agents | `agent_id` (unique), `user_id` |
| `attacks` | Attack/detection events | `agent_id`, `user_id` |

**Database name:** `arcdis_db` (configurable via `DATABASE_NAME` in `.env`).  
**Connection:** `mongodb://localhost:27017` by default (configurable via `MONGODB_URL` in `.env`).  
**Driver:** Motor (async) on the backend side; no direct connection from the agent (all writes go through the FastAPI backend REST API).

### PyObjectId (custom type)
**What it is:** A custom Pydantic v2 type defined in `backend/app/models/__init__.py` that wraps `bson.ObjectId`.  
**Why ARCDIS uses it:** Enables Pydantic models to correctly handle MongoDB's `_id` field (which is an ObjectId, not a string) while serialising it to a string in API responses.  
**Where it is used:** All three model files: `UserModel`, `AgentModel`, `AttackModel`.

---

## Infrastructure / OS

### Linux (Ubuntu 20.04+ recommended)
**What it is:** The target operating system for the ARCDIS agent.  
**Why it is required:** The agent uses Linux-specific APIs:
- `/etc/passwd` and `pwd` module for user enumeration
- `crontab` CLI for cron scanning and modification
- `/etc/crontab` and `/etc/cron.d/` for system cron scanning
- `prctl(PR_SET_NAME)` syscall for process name masking
- eBPF via `/proc/sys/kernel/perf_event_paranoid` (requires kernel support)
- `psutil` process tree operations use Linux-specific semantics

**For the backend and frontend:** Any OS with Python 3.11+ and Node.js 18+ is sufficient.

### systemd
**What it is:** The Linux init system and service manager.  
**Why it is used:** The `install.sh` script (generated by the agent download endpoint) creates a `arcdis-agent.service` unit file that runs the agent as a root service on boot with `Restart=always`.  
**Where it is used:** `install.sh` (embedded in agent ZIP by `backend/app/routes/agents.py`).

### linux-headers + kernel ≥4.9 (for eBPF)
**What it is:** Kernel header files required to compile BPF programs.  
**Why it is required:** The BCC library compiles the inline BPF C code in `ebpf_monitor.py` at runtime and requires matching kernel headers. Without them, the agent runs in degraded mode.  
**Where it is used:** Required by `python3-bpfcc` at BPF program load time.

---

## Development & Build Tools

### npm (Node Package Manager)
**What it is:** The package manager for JavaScript.  
**Why ARCDIS uses it:** Manages all frontend dependencies defined in `client/package.json`.  
**Where it is used:** `npm install`, `npm run dev`, `npm run build`, `npm run lint`.

### ESLint 8.56.0
**What it is:** A static analysis tool for JavaScript and JSX.  
**Why ARCDIS uses it:** Lints the React codebase for code quality and consistency. Configured with `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.  
**Where it is used:** `client/.eslintrc.cjs`, `npm run lint`.

### PostCSS + Autoprefixer
**What it is:** A CSS post-processor and its vendor-prefix automation plugin.  
**Why ARCDIS uses it:** Required by Tailwind CSS v3 for processing utility classes.  
**Where it is used:** `client/postcss.config.js`.

### Python venv (stdlib)
**What it is:** Python's built-in virtual environment tool.  
**Why ARCDIS uses it:** Isolates backend and agent Python dependencies from system Python packages.  
**Where it is used:** Documented in setup instructions: `python3 -m venv venv && source venv/bin/activate`.

### pip
**What it is:** The Python package installer.  
**Why ARCDIS uses it:** Installs dependencies from `requirements.txt` for both the backend and agent.  
**Where it is used:** `pip install -r requirements.txt`.
