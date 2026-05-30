import os
import logging
from supabase import create_client, Client

logger = logging.getLogger("voicecontract.database")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

def get_supabase_client() -> Client | None:
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    else:
        logger.warning("Supabase configuration missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
        return None

supabase_admin = get_supabase_client()
