import sys
from pydantic_settings import BaseSettings

_INSECURE_DEFAULTS = {"change_me_in_production", "secret", ""}

class Settings(BaseSettings):
    PROJECT_NAME: str = "ARCDIS Backend"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "change_me_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "arcdis_db"
    # AGENT_SECRET is no longer used for auth (per-agent tokens replaced it).
    # Kept in config only so existing .env files with this variable don't break.
    AGENT_SECRET: str = "change_agent_secret_in_production"

    class Config:
        env_file = ".env"


settings = Settings()

# Refuse to start if the JWT secret is still the insecure default.
# Set SECRET_KEY in backend/.env to a long random string before running.
if settings.SECRET_KEY.strip() in _INSECURE_DEFAULTS:
    print(
        "[FATAL] SECRET_KEY is still set to the insecure default value.\n"
        "        Set a strong SECRET_KEY in backend/.env before starting.\n"
        "        Generate one with:  python -c \"import secrets; print(secrets.token_hex(32))\"\n",
        file=sys.stderr,
    )
    sys.exit(1)
