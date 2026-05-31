import logging
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

try:
    from backend.auth.jwt_auth import verify_token
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
    from database.client import supabase_admin

logger = logging.getLogger("voicecontract.users")
router = APIRouter(prefix="/api/users", tags=["Users"])


class OnboardPayload(BaseModel):
    company_name: str
    gst_number: str = ""
    address: str = ""
    brand_accent: Optional[str] = None
    template_strategy: str = "generate"
    brand_dna_url: str = ""
    company_logo_filename: str = ""
    existing_msa_filename: str = ""
    existing_po_filename: str = ""
    existing_invoice_filename: str = ""
    onboarding_complete: bool = True
    selected_msa_template: Optional[str] = None
    selected_po_template: Optional[str] = None
    selected_invoice_template: Optional[str] = None


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(verify_token)):
    user_id = current_user.get("sub")
    if not supabase_admin:
        return {"id": user_id, "onboarding_complete": False}

    try:
        res = supabase_admin.table("users").select("*").eq("id", user_id).execute()
        if res.data:
            return res.data[0]
        else:
            import uuid
            email = current_user.get("email") or f"{user_id}_{uuid.uuid4().hex[:6]}@voicecontract.com"
            new_user = {
                "id": user_id, 
                "email": email, 
                "onboarding_complete": False,
                "company_name": "",
                "gst_number": "",
                "address": "",
                "brand_dna_url": "",
                "company_logo_filename": "",
                "existing_msa_filename": "",
                "existing_po_filename": "",
                "existing_invoice_filename": ""
            }
            try:
                supabase_admin.table("users").insert(new_user).execute()
            except Exception as insert_err:
                logger.warning(f"Insert failed (may already exist): {insert_err}")
            return new_user
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return {"id": user_id, "onboarding_complete": False}


@router.post("/onboard")
async def onboard_user(payload: OnboardPayload, current_user: dict = Depends(verify_token)):
    user_id = current_user.get("sub")
    if not supabase_admin:
        return {"success": True}

    try:
        import uuid
        # Get existing email or create a unique fallback
        email = current_user.get("email") or f"{user_id}_{uuid.uuid4().hex[:6]}@voicecontract.com"
        existing_res = supabase_admin.table("users").select("email").eq("id", user_id).execute()
        if existing_res.data and existing_res.data[0].get("email"):
            email = existing_res.data[0]["email"]

        # Build data dict, filtering out None values
        data = {k: v for k, v in payload.model_dump().items() if v is not None}

        res = supabase_admin.table("users").upsert({
            "id": user_id,
            "email": email,
            **data
        }).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        logger.error(f"Onboarding failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")
