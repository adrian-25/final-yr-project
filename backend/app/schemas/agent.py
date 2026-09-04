from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AgentRegister(BaseModel):
    agent_id: str
    hostname: str
    os_info: str
    version: str


class AgentResponse(BaseModel):
    id: str
    agent_id: str
    user_id: str
    hostname: str
    os_info: str
    status: str
    last_seen: datetime
    created_at: datetime
    version: str
    # Returned once at registration; None on all subsequent reads.
    # The agent must save this value in its .env as AGENT_TOKEN.
    agent_token: Optional[str] = None
    # Extended fields used by the frontend
    ip_address: Optional[str] = None
    risk_level: Optional[str] = None
    threat_count: Optional[int] = None
    os: Optional[str] = None

    class Config:
        from_attributes = True


class AgentHeartbeat(BaseModel):
    """Optional body that the agent may include with its heartbeat PATCH.

    If the agent is running without eBPF (BCC not installed) it sends
    status='degraded' so the backend and dashboard can reflect that state.
    Omitting the body (or omitting the field) defaults to 'online'.
    """
    status: Optional[str] = "online"


class AgentHeartbeatResponse(BaseModel):
    status: str
    last_seen: datetime
