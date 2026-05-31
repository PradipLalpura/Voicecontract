import os
import logging
from dotenv import load_dotenv

# Force-load .env BEFORE reading any env vars
# Walk up to find .env in project root
_current = os.path.dirname(os.path.abspath(__file__))
for _i in range(5):
    _env_path = os.path.join(_current, ".env")
    if os.path.exists(_env_path):
        load_dotenv(_env_path, override=True)
        break
    _current = os.path.dirname(_current)

from supabase import create_client, Client

logger = logging.getLogger("voicecontract.database")


def get_supabase_client() -> Client | None:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if url and key:
        try:
            client = create_client(url, key)
            logger.info("Supabase client initialized successfully.")
            return client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    else:
        logger.warning(
            f"Supabase configuration missing. URL={'SET' if url else 'EMPTY'}, KEY={'SET' if key else 'EMPTY'}"
        )
        return None


supabase_admin = get_supabase_client()
