from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
from app.models import PyObjectId


class AgentModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    agent_id: str
    user_id: str
    hostname: str
    os_info: str
    status: str = "online"
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: str
    # Per-agent authentication token stored as a bcrypt hash.
    # The plaintext token is returned once at registration and never stored.
    token_hash: Optional[str] = None
    # Optional extended fields set after registration / heartbeat updates
    ip_address: Optional[str] = None
    risk_level: Optional[str] = None
    threat_count: Optional[int] = None
    os: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
