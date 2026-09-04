from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

@dataclass
class AgentRegistration:
    agent_id: str
    hostname: str
    os_info: str
    version: str

    def to_dict(self):
        return asdict(self)

@dataclass
class AttackEvent:
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
    detection_methods: List[str] = field(default_factory=list)
    raw_summary: Optional[str] = None

    def to_dict(self):
        return asdict(self)

@dataclass
class ProcessInfo:
    pid: int
    ppid: int
    name: str
    cmdline: str
    create_time: float
    memory_mb: float
