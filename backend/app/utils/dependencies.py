from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from bson import ObjectId
from app.config import settings
from app.schemas.token import TokenData
from app.database import get_user_collection, get_agent_collection
from app.utils.security import verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    users_col = get_user_collection()
    user = await users_col.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception

    user["id"] = str(user.pop("_id"))
    return user


async def get_registration_identity(
    x_user_id: str = Header(None, alias="X-User-Id"),
):
    """
    Used exclusively for the agent registration endpoint.

    On first run the agent has no AGENT_TOKEN yet.  It proves ownership by
    sending the USER_ID from its .env (the MongoDB _id of the owning user)
    in the X-User-Id header.  The backend looks up and validates that user.

    After registration the agent MUST use get_agent_identity (X-Agent-Id +
    X-Agent-Token) for every subsequent request.
    """
    if not x_user_id or not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id header for agent registration",
        )

    users_col = get_user_collection()
    try:
        oid = ObjectId(x_user_id.strip())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-User-Id format",
        )

    user = await users_col.find_one({"_id": oid})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for the provided X-User-Id",
        )

    user["id"] = str(user.pop("_id"))
    return user


async def get_agent_identity(
    x_agent_id: str = Header(None, alias="X-Agent-Id"),
    x_agent_token: str = Header(None, alias="X-Agent-Token"),
):
    """
    Per-agent authentication used for heartbeat and attack reporting.

    The agent sends:
      X-Agent-Id:    its agent_id (e.g. "agt_abc123")
      X-Agent-Token: the plaintext token it received at registration

    The backend looks up the agent by agent_id and verifies the token
    against the stored bcrypt hash.  No shared global secret is used.
    """
    if not x_agent_id or not x_agent_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Agent-Id or X-Agent-Token header",
        )

    agents_col = get_agent_collection()
    agent = await agents_col.find_one({"agent_id": x_agent_id})

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent not found",
        )

    token_hash = agent.get("token_hash")
    if not token_hash or not verify_password(x_agent_token, token_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent token",
        )

    # Return a minimal user-like dict so existing route handlers that call
    # current_user["id"] continue to work unchanged.
    users_col = get_user_collection()
    try:
        user = await users_col.find_one({"_id": ObjectId(agent["user_id"])})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent owner not found",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent owner not found",
        )

    user["id"] = str(user.pop("_id"))
    return user
