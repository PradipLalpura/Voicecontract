import os
import logging
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from svix.webhooks import Webhook, WebhookVerificationError
from supabase import create_client, Client

logger = logging.getLogger("voicecontract.webhooks")
router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

# Retrieve secrets
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Initialize Supabase Service Role client for bypassing RLS during sync
# NOTE: This requires the SUPABASE_SERVICE_ROLE_KEY which must never be exposed to frontend
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    logger.warning("Supabase URL or Service Role Key is missing. Webhooks will not sync to DB.")

class WebhookResponse(BaseModel):
    success: bool
    message: str

@router.post("/clerk", response_model=WebhookResponse)
async def clerk_webhook(request: Request):
    """
    Cryptographically secure webhook endpoint for syncing Clerk identities into Supabase.
    """
    if not CLERK_WEBHOOK_SECRET:
        logger.error("CLERK_WEBHOOK_SECRET is not configured.")
        raise HTTPException(status_code=500, detail="Server misconfiguration.")

    # Get headers required by Svix
    headers = request.headers
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing svix headers.")

    payload = await request.body()
    payload_str = payload.decode("utf-8")

    # Verify Signature
    wh = Webhook(CLERK_WEBHOOK_SECRET)
    try:
        event = wh.verify(payload_str, headers)
    except WebhookVerificationError:
        logger.error("Webhook signature verification failed.")
        raise HTTPException(status_code=400, detail="Invalid signature.")

    event_type = event.get("type")
    data = event.get("data", {})

    logger.info(f"Received Clerk Webhook: {event_type} for user {data.get('id')}")

    if not supabase:
        return WebhookResponse(success=True, message="Webhook received, but Supabase is not configured. Sync skipped.")

    try:
        if event_type == "user.created" or event_type == "user.updated":
            user_id = data.get("id")
            email_addresses = data.get("email_addresses", [])
            primary_email = ""
            if email_addresses:
                primary_email = email_addresses[0].get("email_address", "")

            user_data = {
                "id": user_id,
                "email": primary_email,
                "first_name": data.get("first_name", ""),
                "last_name": data.get("last_name", ""),
            }

            # Upsert user into Supabase bypassing RLS using Service Role
            response = supabase.table("users").upsert(user_data).execute()
            logger.info(f"Synced user {user_id} to Supabase successfully.")

        elif event_type == "user.deleted":
            user_id = data.get("id")
            response = supabase.table("users").delete().eq("id", user_id).execute()
            logger.info(f"Deleted user {user_id} from Supabase successfully.")
            
    except Exception as e:
        logger.error(f"Error syncing to Supabase: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sync user data.")

    return WebhookResponse(success=True, message="Webhook processed successfully.")
