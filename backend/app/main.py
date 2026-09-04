import asyncio
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, get_agent_collection
from app.middleware.cors import setup_cors
from app.routes import auth, users, agents, attacks

logger = logging.getLogger(__name__)

# An agent is considered offline if it has not sent a heartbeat in this many seconds.
# The default heartbeat interval is 30 s, so 3 missed beats → 90 s; we give a bit more margin.
_OFFLINE_THRESHOLD_SECONDS = 120
_OFFLINE_CHECK_INTERVAL_SECONDS = 60


async def _mark_offline_loop():
    """Background coroutine: periodically sets agents to 'offline' if they have
    not sent a heartbeat within OFFLINE_THRESHOLD_SECONDS.

    Only agents that are currently 'online' or 'degraded' are updated, so
    an agent that is already 'offline' is not touched unnecessarily.
    """
    while True:
        try:
            await asyncio.sleep(_OFFLINE_CHECK_INTERVAL_SECONDS)
            cutoff = datetime.now(timezone.utc) - timedelta(seconds=_OFFLINE_THRESHOLD_SECONDS)
            agents_col = get_agent_collection()
            result = await agents_col.update_many(
                {
                    "status": {"$in": ["online", "degraded"]},
                    "last_seen": {"$lt": cutoff},
                },
                {"$set": {"status": "offline"}},
            )
            if result.modified_count:
                logger.info(
                    f"[offline-checker] Marked {result.modified_count} agent(s) offline "
                    f"(no heartbeat for >{_OFFLINE_THRESHOLD_SECONDS}s)."
                )
        except Exception as exc:
            logger.error(f"[offline-checker] Error: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    # Start the background offline-checker task
    task = asyncio.create_task(_mark_offline_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        await close_mongo_connection()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

setup_cors(app)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["agents"])
app.include_router(attacks.router, prefix=f"{settings.API_V1_STR}/attacks", tags=["attacks"])


@app.get("/")
def read_root():
    return {"message": "Welcome to ARCDIS API"}
