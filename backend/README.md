# ARCDIS Backend

ARCDIS (Autonomous Runtime Cyber Defence & Intrusion System) FastAPI backend.

## Requirements

- Python 3.11+
- MongoDB 6+ (local or Atlas)

## Setup

### 1. Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable         | Description                                               |
|------------------|-----------------------------------------------------------|
| `SECRET_KEY`     | **Required.** Long random string for JWT signing.         |
| `MONGODB_URL`    | MongoDB connection string (default: `mongodb://localhost:27017`) |
| `DATABASE_NAME`  | Database name (default: `arcdis_db`)                      |

Generate a secure `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

> **The backend refuses to start if `SECRET_KEY` is still the default value.**

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

Interactive API docs are available at `http://127.0.0.1:8000/docs`.

---

## Authentication

### User authentication (dashboard)

Standard OAuth2 Password flow with JWT Bearer tokens.  Users register via
`POST /api/auth/register` and log in via `POST /api/auth/login`.

### Agent authentication (per-agent tokens)

Agents authenticate with two custom headers:

| Header          | Description                                      |
|-----------------|--------------------------------------------------|
| `X-Agent-Id`    | The agent's unique identifier                    |
| `X-Agent-Token` | The per-agent token issued at registration       |

Tokens are generated as 64-character cryptographically random hex strings,
stored as **bcrypt hashes** in MongoDB, and returned **once** at registration.
No shared global secret is used.

---

## Background Tasks

A background coroutine checks every 60 seconds and marks agents `offline` if
their last heartbeat was more than 120 seconds ago.  An agent that is running
but without eBPF support will report `status=degraded` via its heartbeat body.
