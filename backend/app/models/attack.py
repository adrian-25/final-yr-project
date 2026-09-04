from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.models import PyObjectId

class AttackModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    attack_id: str
    agent_id: str
    user_id: str
    technique: str
    title: str
    description: str
    features: Dict[str, Any] = Field(default_factory=dict)
    action_taken: str
    severity: str
    status: str = "MITIGATED"
    risk_score: float = 0.0
    local_anomaly_score: float = 0.0
    hostname: Optional[str] = None
    process_name: Optional[str] = None
    parent_process: Optional[str] = None
    detection_methods: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw_summary: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
