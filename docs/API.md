# ARCDIS — REST API Reference

Complete documentation for all ARCDIS backend endpoints. All endpoints documented here are verified from the actual route source files in `backend/app/routes/`.

The base URL for all endpoints is `http://localhost:8000` by default.

Interactive documentation (Swagger UI) is available at `http://localhost:8000/docs` when the backend is running.

---

## Table of Contents

- [Authentication Overview](#authentication-overview)
- [Auth Endpoints](#auth-endpoints)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
- [User Endpoints](#user-endpoints)
  - [GET /api/users/me](#get-apiusersme)
- [Agent Endpoints](#agent-endpoints)
  - [POST /api/agents/register](#post-apiapiagentsregister)
  - [GET /api/agents](#get-apiagents)
  - [GET /api/agents/{agent_id}](#get-apiagentsagent_id)
  - [GET /api/agents/download](#get-apiagentsdownload)
  - [PATCH /api/agents/{agent_id}/heartbeat](#patch-apiagentsagent_idheartbeat)
- [Attack Endpoints](#attack-endpoints)
  - [POST /api/attacks](#post-apiattacks)
  - [GET /api/attacks](#get-apiattacks)
  - [GET /api/attacks/{attack_id}](#get-apiattacksattack_id)
- [Error Responses](#error-responses)

---

## Authentication Overview

ARCDIS uses three distinct authentication mechanisms depending on the caller:

| Mechanism | Used By | Headers |
|---|---|---|
| JWT Bearer | Dashboard users | `Authorization: Bearer <token>` |
| Agent registration | Agent (first run only) | `X-User-Id: <user_mongo_id>` |
| Agent token | Agent (all subsequent requests) | `X-Agent-Id: <id>` + `X-Agent-Token: <token>` |

**JWT tokens** are issued by `POST /api/auth/login` and expire after 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).

**Agent tokens** are 64-character hex strings issued once at registration. Only the bcrypt hash is stored in the database. The plaintext is returned in the registration response and never stored or re-issued.

---

## Auth Endpoints

### POST /api/auth/register

Creates a new user account.

**Authentication:** None required.

**Request:**
```
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "full_name": "Ada Lovelace"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string | Yes | Valid email address. Must be unique. |
| `password` | string | Yes | Plaintext password. Stored as bcrypt hash. |
| `full_name` | string | Yes | Display name for the user. |

**Response — 201 Created:**
```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "full_name": "Ada Lovelace",
  "created_at": "2024-09-04T10:00:00.000Z",
  "is_active": true
}
```

**Error Responses:**
- `400 Bad Request` — User with this email already exists.
- `422 Unprocessable Entity` — Invalid email format or missing fields.

---

### POST /api/auth/login

Authenticates a user and returns a JWT access token.

**Authentication:** None required.

**Request:**
```
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body (form data):**
```
username=user@example.com&password=your_password
```

> Note: The field name is `username` (per OAuth2 specification), but the value should be the user's email address.

**Response — 200 OK:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `401 Unauthorized` — Incorrect email or password.

---

## User Endpoints

### GET /api/users/me

Returns the profile of the currently authenticated user.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/users/me
Authorization: Bearer <access_token>
```

**Response — 200 OK:**
```json
{
  "id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "email": "user@example.com",
  "full_name": "Ada Lovelace",
  "created_at": "2024-09-04T10:00:00.000Z",
  "is_active": true
}
```

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.

---

## Agent Endpoints

### POST /api/agents/register

Registers a new agent with the backend. Called by the agent on its first run.

**Authentication:** `X-User-Id` header (the MongoDB `_id` of the owning user).

> After registration, the agent must use `X-Agent-Id` + `X-Agent-Token` for all subsequent requests. The `X-User-Id` mechanism is only used for this endpoint.

**Request:**
```
POST /api/agents/register
X-User-Id: 64f1a2b3c4d5e6f7a8b9c0d1
Content-Type: application/json
```

**Request Body:**
```json
{
  "agent_id": "agt_webserver_01",
  "hostname": "prod-web-01",
  "os_info": "Linux 5.15.0-91-generic (#101-Ubuntu SMP ...)",
  "version": "1.0.0"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | Yes | Unique identifier for this agent instance. |
| `hostname` | string | Yes | The endpoint's hostname. |
| `os_info` | string | Yes | Operating system and kernel version string. |
| `version` | string | Yes | Agent software version. |

**Response — 201 Created:**
```json
{
  "id": "64f2b3c4d5e6f7a8b9c0d1e2",
  "agent_id": "agt_webserver_01",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "hostname": "prod-web-01",
  "os_info": "Linux 5.15.0-91-generic ...",
  "status": "online",
  "last_seen": "2024-09-04T10:00:00.000Z",
  "created_at": "2024-09-04T10:00:00.000Z",
  "version": "1.0.0",
  "agent_token": "a3f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
}
```

> `agent_token` is returned **exactly once** in this response. The agent writes it to `.env` as `AGENT_TOKEN`. It is never stored in plaintext and cannot be retrieved again. Only the bcrypt hash is stored in the database.

**Error Responses:**
- `400 Bad Request` — Agent with this `agent_id` already exists.
- `401 Unauthorized` — Missing or invalid `X-User-Id` header, or user not found.

---

### GET /api/agents

Lists all agents registered by the authenticated user.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/agents
Authorization: Bearer <access_token>
```

**Response — 200 OK:**
```json
[
  {
    "id": "64f2b3c4d5e6f7a8b9c0d1e2",
    "agent_id": "agt_webserver_01",
    "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "hostname": "prod-web-01",
    "os_info": "Linux 5.15.0-91-generic ...",
    "status": "online",
    "last_seen": "2024-09-04T10:05:00.000Z",
    "created_at": "2024-09-04T10:00:00.000Z",
    "version": "1.0.0",
    "agent_token": null
  }
]
```

> Returns up to 100 agents. Results are scoped to the authenticated user only — no cross-user data is returned.

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.

---

### GET /api/agents/{agent_id}

Returns a single agent by its `agent_id`.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/agents/agt_webserver_01
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `agent_id` | string | The agent's unique identifier (not the MongoDB `_id`). |

**Response — 200 OK:**
```json
{
  "id": "64f2b3c4d5e6f7a8b9c0d1e2",
  "agent_id": "agt_webserver_01",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "hostname": "prod-web-01",
  "os_info": "Linux 5.15.0-91-generic ...",
  "status": "online",
  "last_seen": "2024-09-04T10:05:00.000Z",
  "created_at": "2024-09-04T10:00:00.000Z",
  "version": "1.0.0",
  "agent_token": null
}
```

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.
- `404 Not Found` — Agent not found, or belongs to a different user.

---

### GET /api/agents/download

Downloads a pre-configured agent ZIP package for the authenticated user.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/agents/download?agent_id=agt_webserver_01
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | Yes | The identifier to embed in the `.env` file inside the ZIP. |

**Response — 200 OK:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename=arcdis_agent.zip
```

The ZIP file contains:
- All agent source files (`agent.py`, `monitor.py`, `ebpf_monitor.py`, `reporter.py`, `ml.py`, `risk.py`, `policy.py`, `policies.json`, `preventer.py`, `models.py`, `config.py`, `utils.py`)
- Pre-trained model `.pkl` files
- `requirements.txt`
- A dynamically generated `.env` with `USER_ID` and `AGENT_ID` pre-filled, `AGENT_TOKEN` left empty
- A dynamically generated `install.sh` for systemd setup

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.
- `500 Internal Server Error` — Agent source directory not found on the server.

---

### PATCH /api/agents/{agent_id}/heartbeat

Updates the agent's `last_seen` timestamp and status. Called by the agent every 30 seconds.

**Authentication:** `X-Agent-Id` + `X-Agent-Token` headers required.

**Request:**
```
PATCH /api/agents/agt_webserver_01/heartbeat
X-Agent-Id: agt_webserver_01
X-Agent-Token: a3f1b2c3d4e5f6a7b8c9d0e1...
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "status": "online"
}
```

| Value | Meaning |
|---|---|
| `"online"` | Agent running normally with eBPF available |
| `"degraded"` | Agent running but eBPF is unavailable |

If the body is omitted or `status` is not provided, `"online"` is used. Any value other than `"online"` or `"degraded"` is silently clamped to `"online"`.

**Response — 200 OK:**
```json
{
  "status": "online",
  "last_seen": "2024-09-04T10:05:30.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` — Missing, invalid, or non-matching `X-Agent-Id` / `X-Agent-Token`.
- `404 Not Found` — Agent not found or does not belong to the authenticated agent's owner.

---

## Attack Endpoints

### POST /api/attacks

Reports a detected attack event from an agent. Called by the agent's sender thread.

**Authentication:** `X-Agent-Id` + `X-Agent-Token` headers required.

**Request:**
```
POST /api/attacks
X-Agent-Id: agt_webserver_01
X-Agent-Token: a3f1b2c3d4e5f6a7b8c9d0e1...
Content-Type: application/json
```

**Request Body:**
```json
{
  "attack_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "agt_webserver_01",
  "technique": "T1059",
  "title": "Autonomous ML Detection: process_storm",
  "description": "Detected abnormal process_storm by bash (PID: 12345). Local Anomaly: 0.92",
  "features": {
    "spawn_count_in_window": 18,
    "total_child_memory_mb": 350.5,
    "avg_child_memory_mb": 19.5,
    "parent_pid": 12345,
    "parent_name": "bash",
    "parent_cmdline": "/bin/bash exploit.sh",
    "window_seconds": 10,
    "behavior_type": "process_storm"
  },
  "action_taken": "TERMINATE_PROCESS_TREE",
  "severity": "HIGH",
  "status": "MITIGATED",
  "risk_score": 0.92,
  "local_anomaly_score": 0.92,
  "hostname": "prod-web-01",
  "process_name": "bash",
  "parent_process": "sshd",
  "detection_methods": ["Behavioral anomaly", "ML process_storm model"],
  "raw_summary": null
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `attack_id` | string | Yes | UUID for this specific event. |
| `agent_id` | string | Yes | Must match the authenticated agent's ID. |
| `technique` | string | Yes | MITRE ATT&CK technique ID (e.g. `T1059`, `T1486`, `T1053.003`, `T1496`, `T1046`). |
| `title` | string | Yes | Short title for the event. |
| `description` | string | Yes | Full human-readable description. |
| `features` | object | Yes | Detection feature dictionary (varies by behaviour type). |
| `action_taken` | string | Yes | Policy action executed: `TERMINATE_PROCESS_TREE`, `TERMINATE_SINGLE_PROCESS`, `QUARANTINE_AND_TERMINATE`, `CRON_LINE_REMOVED`, `MONITOR_ONLY`, or `mitigation_failed`. |
| `severity` | string | Yes | `CRITICAL`, `HIGH`, or `SUSPICIOUS`. Normalised to uppercase by the backend schema. |
| `status` | string | No | `MITIGATED`, `ACTIVE`, or `MONITORING`. Defaults to `MITIGATED`. |
| `risk_score` | float | No | Risk score (0.0–1.0). |
| `local_anomaly_score` | float | No | Raw ML anomaly score (0.0–1.0). |
| `hostname` | string | No | Hostname of the endpoint. |
| `process_name` | string | No | Name of the detected process. |
| `parent_process` | string | No | Name of the parent process. |
| `detection_methods` | array | No | List of detection method labels. |
| `raw_summary` | string | No | Optional free-text summary. |

**Response — 201 Created:**
```json
{
  "id": "64f3c4d5e6f7a8b9c0d1e2f3",
  "attack_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "agt_webserver_01",
  "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "technique": "T1059",
  "title": "Autonomous ML Detection: process_storm",
  "description": "Detected abnormal process_storm by bash (PID: 12345). Local Anomaly: 0.92",
  "features": { ... },
  "action_taken": "TERMINATE_PROCESS_TREE",
  "severity": "HIGH",
  "status": "MITIGATED",
  "risk_score": 0.92,
  "local_anomaly_score": 0.92,
  "hostname": "prod-web-01",
  "process_name": "bash",
  "parent_process": "sshd",
  "detection_methods": ["Behavioral anomaly", "ML process_storm model"],
  "timestamp": "2024-09-04T10:07:00.000Z",
  "raw_summary": null
}
```

**Error Responses:**
- `400 Bad Request` — `agent_id` in the body does not match the authenticated agent, or agent does not belong to the agent's owner.
- `401 Unauthorized` — Missing, invalid, or non-matching agent credentials.

---

### GET /api/attacks

Lists attack events for the authenticated user. Supports optional filtering.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/attacks?agent_id=agt_webserver_01&technique=T1059
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| `agent_id` | string | No | Filter by agent ID. |
| `technique` | string | No | Filter by MITRE technique ID (e.g. `T1059`). |
| `start_date` | datetime | No | Filter events at or after this timestamp (ISO 8601). |
| `end_date` | datetime | No | Filter events at or before this timestamp (ISO 8601). |

**Response — 200 OK:**
```json
[
  {
    "id": "64f3c4d5e6f7a8b9c0d1e2f3",
    "attack_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "agt_webserver_01",
    "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "technique": "T1059",
    "title": "Autonomous ML Detection: process_storm",
    "description": "...",
    "features": { ... },
    "action_taken": "TERMINATE_PROCESS_TREE",
    "severity": "HIGH",
    "status": "MITIGATED",
    "risk_score": 0.92,
    "local_anomaly_score": 0.92,
    "hostname": "prod-web-01",
    "process_name": "bash",
    "parent_process": "sshd",
    "detection_methods": ["Behavioral anomaly", "ML process_storm model"],
    "timestamp": "2024-09-04T10:07:00.000Z",
    "raw_summary": null
  }
]
```

Results are sorted by `timestamp` descending (newest first). Maximum 100 results returned per request. All results are scoped to the authenticated user's `user_id`.

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.

---

### GET /api/attacks/{attack_id}

Returns a single attack event by its `attack_id`.

**Authentication:** JWT Bearer required.

**Request:**
```
GET /api/attacks/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Description |
|---|---|---|
| `attack_id` | string | The UUID of the attack event (not the MongoDB `_id`). |

**Response — 200 OK:**
Same structure as a single element from `GET /api/attacks`.

**Error Responses:**
- `401 Unauthorized` — Missing or invalid JWT.
- `404 Not Found` — Attack not found, or belongs to a different user.

---

## Error Responses

All error responses follow the FastAPI default format:

```json
{
  "detail": "Human-readable error message"
}
```

| Status Code | Meaning |
|---|---|
| `400 Bad Request` | Invalid input or duplicate resource. |
| `401 Unauthorized` | Missing, expired, or invalid credentials. |
| `404 Not Found` | Resource not found or does not belong to the requesting user. |
| `422 Unprocessable Entity` | Request body failed Pydantic validation. |
| `500 Internal Server Error` | Server-side error (e.g. agent source directory missing for download). |

### Severity Values

The backend `AttackReport` schema normalises severity to uppercase using a `field_validator`. Accepted values (case-insensitive):

| Value | Displayed As |
|---|---|
| `critical` / `CRITICAL` | `CRITICAL` |
| `high` / `HIGH` | `HIGH` |
| `suspicious` / `SUSPICIOUS` | `SUSPICIOUS` |

### Attack Status Values

| Value | Meaning |
|---|---|
| `MITIGATED` | Prevention action was executed successfully. |
| `ACTIVE` | Threat was detected but prevention failed. |
| `MONITORING` | SUSPICIOUS tier — monitoring only, no action taken. |

### Agent Status Values

| Value | Meaning |
|---|---|
| `online` | Agent running normally with eBPF available. |
| `degraded` | Agent running but eBPF kernel monitoring is unavailable. |
| `offline` | Agent has not sent a heartbeat in over 120 seconds. |
