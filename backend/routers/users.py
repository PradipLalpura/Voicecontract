import logging
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token
from backend.database.client import supabase_admin

logger = logging.getLogger("voicecontract.users")
router = APIRouter(prefix="/api/users", tags=["Users"])

class UserProfileUpdate(BaseModel):
    company_name: str
    gst_number: str = ""
    address: str = ""
    onboarding_complete: bool = True

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
            # Create entry if missing
            new_user = {"id": user_id, "email": current_user.get("email", ""), "onboarding_complete": False}
            supabase_admin.table("users").insert(new_user).execute()
            return new_user
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return {"id": user_id, "onboarding_complete": False}

@router.post("/onboard")
async def onboard_user(payload: UserProfileUpdate, current_user: dict = Depends(verify_token)):
    user_id = current_user.get("sub")
    if not supabase_admin:
        return {"success": True}
        
    try:
        data = payload.dict()
        res = supabase_admin.table("users").update(data).eq("id", user_id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        logger.error(f"Onboarding failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save profile.")
