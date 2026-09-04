import secrets
from fastapi import HTTPException, status
from datetime import datetime, timezone
from app.database import get_agent_collection
from app.schemas.agent import AgentRegister
from app.models.agent import AgentModel
from app.utils.security import get_password_hash

# Statuses that an agent is allowed to self-report via heartbeat
_ALLOWED_STATUSES = {"online", "degraded"}


async def register_agent(user_id: str, agent_in: AgentRegister) -> dict:
    agents_col = get_agent_collection()

    existing_agent = await agents_col.find_one({"agent_id": agent_in.agent_id})
    if existing_agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent with this ID already exists"
        )

    # Generate a cryptographically random per-agent token (32 bytes → 64 hex chars).
    # The plaintext is returned exactly once in the registration response and never stored.
    plaintext_token = secrets.token_hex(32)
    token_hash = get_password_hash(plaintext_token)

    new_agent = AgentModel(
        agent_id=agent_in.agent_id,
        user_id=user_id,
        hostname=agent_in.hostname,
        os_info=agent_in.os_info,
        version=agent_in.version,
        token_hash=token_hash,
    )

    result = await agents_col.insert_one(new_agent.model_dump(by_alias=True, exclude_none=True))
    created_agent = await agents_col.find_one({"_id": result.inserted_id})
    created_agent["id"] = str(created_agent.pop("_id"))
    # Inject plaintext token for one-time delivery; never persisted in DB.
    created_agent["agent_token"] = plaintext_token
    return created_agent


async def update_agent_heartbeat(user_id: str, agent_id: str, agent_status: str = "online") -> dict:
    """Update last_seen and status for an agent heartbeat.

    agent_status should be 'online' or 'degraded'.  Any other value is
    silently clamped to 'online' so a misbehaving agent cannot set an
    arbitrary status string in the database.
    """
    agents_col = get_agent_collection()
    now = datetime.now(timezone.utc)

    # Clamp unknown status values to 'online'
    safe_status = agent_status if agent_status in _ALLOWED_STATUSES else "online"

    result = await agents_col.update_one(
        {"agent_id": agent_id, "user_id": user_id},
        {"$set": {"last_seen": now, "status": safe_status}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    return {"status": safe_status, "last_seen": now}
