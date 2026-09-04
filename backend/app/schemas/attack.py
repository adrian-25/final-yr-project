from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict, Any, List


class AttackReport(BaseModel):
    attack_id: str
    agent_id: str
    technique: str
    title: str
    description: str
    features: Dict[str, Any]
    action_taken: str
    severity: str
    status: str = "MITIGATED"
    risk_score: float = 0.0
    local_anomaly_score: float = 0.0
    hostname: Optional[str] = None
    process_name: Optional[str] = None
    parent_process: Optional[str] = None
    detection_methods: List[str] = []
    raw_summary: Optional[str] = None

    @field_validator("severity", mode="before")
    @classmethod
    def normalise_severity(cls, v: str) -> str:
        """Normalise severity to uppercase regardless of what the agent sends.

        monitor.py sends 'CRITICAL'/'HIGH'/'SUSPICIOUS' (already uppercase).
        ebpf_monitor.py was sending 'critical' (lowercase) — now fixed at source too.
        This validator is the final safety net at the schema boundary.
        """
        return v.upper() if isinstance(v, str) else v


class AttackResponse(BaseModel):
    id: str
    attack_id: str
    agent_id: str
    user_id: str
    technique: str
    title: str
    description: str
    features: Dict[str, Any]
    action_taken: str
    severity: str
    status: str = "MITIGATED"
    risk_score: float = 0.0
    local_anomaly_score: float = 0.0
    hostname: Optional[str] = None
    process_name: Optional[str] = None
    parent_process: Optional[str] = None
    detection_methods: List[str] = []
    timestamp: datetime
    raw_summary: Optional[str] = None

    class Config:
        from_attributes = True
