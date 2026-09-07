# ARCDIS — Security Model

This document describes the security mechanisms implemented in ARCDIS. It is written honestly: capabilities are stated accurately, and known limitations are documented without minimisation.

ARCDIS is a final-year academic engineering project. It is **not** a production-grade commercial EDR product and should not be treated as equivalent to one.

---

## Table of Contents

- [User Authentication](#user-authentication)
- [Agent Authentication](#agent-authentication)
- [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Per-Agent Token Design](#per-agent-token-design)
- [Backend Startup Enforcement](#backend-startup-enforcement)
- [Password Hashing](#password-hashing)
- [CORS Policy](#cors-policy)
- [Prevention Mechanisms](#prevention-mechanisms)
  - [Process Tree Termination](#process-tree-termination)
  - [Single Process Termination](#single-process-termination)
  - [File Quarantine](#file-quarantine)
  - [Cron Entry Removal](#cron-entry-removal)
- [eBPF Monitoring Security](#ebpf-monitoring-security)
- [Policy Engine Safety](#policy-engine-safety)
- [Attack Reporting Integrity](#attack-reporting-integrity)
- [Process Name Masking](#process-name-masking)
- [Agent Configuration Security](#agent-configuration-security)
- [Logging](#logging)
- [Known Security Limitations](#known-security-limitations)

---

## User Authentication

**Mechanism:** OAuth2 Password flow with JWT (HS256).

**Implementation:**
- Login endpoint (`POST /api/auth/login`) accepts `application/x-www-form-urlencoded` with `username` (email) and `password`.
- Passwords are verified against bcrypt hashes using `passlib.CryptContext`.
- On successful login, a JWT is issued using `python-jose` signed with HS256.
- The JWT payload contains `{"sub": email, "exp": <timestamp>}`.
- Token expiry is configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 1440 minutes = 24 hours).
- The `get_current_user` dependency in `dependencies.py` decodes and validates the JWT on every protected request.

**What protects against:**
- Unauthenticated access to the dashboard API.
- Accessing other users' agents or attacks (combined with multi-tenant isolation).

**Known limitation:** JWT tokens are stored in browser `localStorage`. JavaScript running in the same origin can read them. This is a common development pattern but is not recommended for high-security production deployments where `httpOnly` cookies should be considered.

---

## Agent Authentication

Agent authentication uses a **two-phase, per-agent zero-trust model**. There is no shared global secret between agents.

### Phase 1 — Registration (first run only)

1. The agent sends `POST /api/agents/register` with an `X-User-Id` header containing the owning user's MongoDB `_id`.
2. The backend validates the user exists using `get_registration_identity`.
3. The backend generates a 64-character cryptographically random hex token using `secrets.token_hex(32)` (256 bits of entropy).
4. The token is hashed with bcrypt using `passlib.get_password_hash()` and stored as `token_hash` in the agents collection. **The plaintext is never stored.**
5. The plaintext token is returned in the registration response exactly once.
6. The agent writes the token to its `.env` file using `python-dotenv.set_key()`.

### Phase 2 — All subsequent requests

1. The agent sends `X-Agent-Id` and `X-Agent-Token` headers with every request.
2. The `get_agent_identity` dependency looks up the agent by `agent_id` and calls `passlib.verify_password(plaintext, stored_hash)`.
3. If verification fails, `401 Unauthorized` is returned.
4. No shared secret, no IP-based trust, no API key reuse across agents.

**What protects against:**
- One agent impersonating another agent.
- Replay attacks (token cannot be derived from the hash).
- A compromised agent exposing tokens for other agents (each token is unique).

---

## Multi-Tenant Isolation

Every database query for agents and attacks includes a `user_id` filter equal to the authenticated user's MongoDB `_id`.

**In `GET /api/agents`:**
```python
cursor = agents_col.find({"user_id": str(current_user["id"])})
```

**In `GET /api/agents/{agent_id}`:**
```python
agent = await agents_col.find_one({"agent_id": agent_id, "user_id": str(current_user["id"])})
```

**In `GET /api/attacks`:**
```python
query = {"user_id": str(current_user["id"])}
```

**In `POST /api/attacks`:**
```python
agent = await agents_col.find_one({"agent_id": attack_in.agent_id, "user_id": str(current_user["id"])})
```

This means:
- User A cannot list User B's agents, even if they know a valid `agent_id`.
- User A cannot read User B's attack events.
- An agent cannot report attacks to a different user's account.

---

## Per-Agent Token Design

| Property | Value |
|---|---|
| Generation | `secrets.token_hex(32)` — 32 bytes = 64 hex characters, 256 bits of entropy |
| Storage | bcrypt hash only (`token_hash` field in agents collection) |
| Transmission | Returned once in registration response; sent by agent in `X-Agent-Token` header |
| Verification | `passlib.verify_password(plaintext, bcrypt_hash)` |
| Revocation | Not currently implemented (token remains valid until agent record is deleted) |
| Re-issuance | Not implemented; tokens cannot be re-retrieved |

---

## Backend Startup Enforcement

`backend/app/config.py` checks the `SECRET_KEY` against a set of known-insecure defaults on every startup:

```python
_INSECURE_DEFAULTS = {"change_me_in_production", "secret", ""}

if settings.SECRET_KEY.strip() in _INSECURE_DEFAULTS:
    print("[FATAL] SECRET_KEY is still set to the insecure default value.", file=sys.stderr)
    sys.exit(1)
```

The server will not start with a weak key. This prevents accidental deployment with the default JWT signing key, which would allow token forgery.

---

## Password Hashing

All passwords and agent tokens are hashed using bcrypt.

**Implementation (`backend/app/utils/security.py`):**
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

- **Algorithm:** bcrypt with passlib's default work factor.
- **Library:** `passlib[bcrypt]` with `bcrypt<4.0.0` for compatibility.
- **Scope:** User passwords (registration), agent tokens (at generation time).

---

## CORS Policy

CORS is configured in `backend/app/middleware/cors.py`:

```python
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Only requests from `localhost:5173` (Vite dev server) and `localhost:3000` are allowed. Any other origin will receive a CORS rejection.

**For production deployment:** `cors.py` must be updated with the actual production frontend origin. Wildcard origins (`*`) must not be used with `allow_credentials=True`.

---

## Prevention Mechanisms

All prevention actions are executed by `agent/preventer.py`. The `execute_policy` method validates the action string against an explicit allowlist before dispatching:

```python
if action not in {"MONITOR_ONLY", "TERMINATE_PROCESS_TREE",
                   "TERMINATE_SINGLE_PROCESS", "QUARANTINE_AND_TERMINATE"}:
    logger.error(f"Unsupported policy action '{action}'. Rejecting execution for safety.")
    return False
```

### Process Tree Termination

**Mechanism:**
1. `psutil.Process(pid).children(recursive=True)` — collect entire process tree.
2. `p.suspend()` (SIGSTOP) on all processes in the tree — prevents re-spawning during kill window.
3. `p.terminate()` (SIGTERM) on all processes.
4. `psutil.wait_procs(processes, timeout=3)` — wait up to 3 seconds.
5. `p.kill()` (SIGKILL) on any survivors.
6. `psutil.pid_exists(parent_pid)` — verify termination.

**Why suspend before terminate:** A forking malware process can spawn replacements between the SIGTERM and SIGKILL window if not suspended first.

### Single Process Termination

Same sequence as tree termination but only targets the specified PID. Child processes are not affected.

### File Quarantine

1. Suspend the entire process tree (SIGSTOP on all).
2. For each file in `files_to_quarantine`:
   - Move to `/tmp/arcdis_quarantine/<filename>_<timestamp>.quarantined` using `shutil.move`.
3. Call `terminate_process_tree` on the suspended tree.

**Purpose:** Halts active encryption by suspending first, then moves encrypted/encrypting files out of the user's home directory before terminating. The original files are moved, not deleted.

### Cron Entry Removal

1. `crontab -u <user> -l` — read current crontab.
2. Filter out the exact matching malicious line.
3. `crontab -u <user> -` (stdin) — write back the cleaned crontab.
4. Operates across all users with UID ≥ 1000 plus root.

**Limitation:** Requires root privileges. Running as non-root will fail silently for users whose crontabs the agent cannot modify.

---

## eBPF Monitoring Security

The inline BPF program in `ebpf_monitor.py` only captures:
- The calling PID (`bpf_get_current_pid_tgid() >> 32`)
- The process name (`bpf_get_current_comm()`, max 16 bytes)

It does **not** capture:
- File paths (no `filename` or `pathname` argument extraction)
- File content
- Network data
- System call arguments beyond flags

**Whitelist protection:** Before any action is taken, the process name is checked against a hardcoded safe-app whitelist (`chrome`, `firefox`, `apt`, `dpkg`, `node`, `npm`, `git`, `systemd`, etc.). If the process is in the whitelist, the event is discarded with no action.

---

## Policy Engine Safety

The `PolicyEngine` loads policies from `agent/policies.json` at startup. The `execute_policy` method in `Preventer` validates the action against an allowlist before executing. This means a corrupted or maliciously modified `policies.json` cannot introduce arbitrary code execution — only the four defined actions (`MONITOR_ONLY`, `TERMINATE_PROCESS_TREE`, `TERMINATE_SINGLE_PROCESS`, `QUARANTINE_AND_TERMINATE`) are accepted.

---

## Attack Reporting Integrity

When an agent POSTs an attack event:
1. The agent is authenticated via `X-Agent-Id` + `X-Agent-Token`.
2. The backend verifies that `attack_in.agent_id` matches an agent owned by the authenticated agent's owner user.
3. The `user_id` field is set server-side from the authenticated user — it is not accepted from the request body.

This prevents an agent from reporting attacks under a different agent's ID, or associating events with a different user.

---

## Process Name Masking

The agent masks its process name to reduce visibility to attackers performing process enumeration:

```python
# Kernel-level name (visible in /proc/<pid>/status)
libc = ctypes.CDLL('libc.so.6')
libc.prctl(15, b'Arcdis\0', 0, 0, 0)  # PR_SET_NAME = 15

# ps/top display name
import setproctitle
setproctitle.setproctitle("Arcdis")

# argv[0]
sys.argv[0] = "Arcdis"
```

This means the agent appears as `Arcdis` in `ps aux`, `top`, and `/proc/<pid>/status` rather than `python3 agent.py`.

---

## Agent Configuration Security

The `.gitignore` at the root of the project excludes `.env` and `*.env` files from version control:

```
.env
.env.*
!.env.example
```

This prevents `AGENT_TOKEN`, `SECRET_KEY`, and other secrets from being accidentally committed to the repository. Only `.env.example` files (with placeholder values) are tracked.

---

## Logging

The agent logs to `/var/log/arcdis/agent.log` (requires root) or falls back to `logs/agent.log` in the working directory. The logger uses a `RotatingFileHandler` with:
- Maximum file size: 5 MB
- Backup count: 3 files

Sensitive values (agent tokens, passwords) are never logged. Detection events are logged at `WARNING` level.

---

## Known Security Limitations

The following limitations are present in the current implementation and should be understood before deploying ARCDIS.

### JWT Storage
JWTs are stored in browser `localStorage`. This is accessible to any JavaScript running on the same origin. An XSS vulnerability in the frontend could expose the token. For production, `httpOnly` session cookies are a safer alternative.

### Root Requirement
The agent requires root privileges to:
- Terminate processes owned by other users.
- Modify other users' crontabs.
- Load BPF programs (requires `CAP_BPF` or root).
- Read `/proc/<pid>/...` for all processes.

Running without root significantly reduces prevention effectiveness.

### No Token Revocation
Agent tokens cannot be revoked without deleting the agent record from the database. There is no token rotation or expiry mechanism.

### Agent-to-Backend Communication
Agent-to-backend communication is plain HTTP by default (`http://localhost:8000`). For deployments where the agent is on a remote machine, TLS/HTTPS must be configured externally (e.g. via a reverse proxy). The agent does not enforce TLS.

### CORS Localhost Only
The backend CORS policy allows `localhost:5173` and `localhost:3000` only. This is appropriate for development but requires updating for any non-localhost deployment.

### ML Model Accuracy
The pre-trained IsolationForest models are trained on synthetically generated feature distributions. Detection accuracy depends on how well the synthetic training data represents the actual workload of the target endpoint. False positives and false negatives are possible, especially on endpoints with unusual resource usage patterns.

### No Rate Limiting
The backend does not implement API rate limiting. A malicious agent or an automated attack on the login endpoint is not throttled.

### No Input Sanitisation on Policy JSON
The `policies.json` file is loaded from the filesystem at agent startup. If the file is tampered with by a local attacker with write access to the agent directory, the policy engine will load the modified policies. The `execute_policy` allowlist mitigates the worst-case scenario but does not prevent policy logic changes.

### Attack Queue Drop
If the attack event queue (maxsize=200) is full, new events are dropped silently. Under extreme detection load, events may be lost before they are sent to the backend.

### No Mutual TLS
The backend does not validate the agent's identity at the TLS layer. Authentication is application-layer only (via `X-Agent-Id` + `X-Agent-Token` headers).
