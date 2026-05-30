import logging
import os
import json
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token
from backend.database.client import supabase_admin
from datetime import datetime

logger = logging.getLogger("voicecontract.dashboard")
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

class DocumentSelection(BaseModel):
    msa: bool = True
    invoice: bool = True
    po: bool = False

class DealCreateRequest(BaseModel):
    client_name: str
    client_company: str
    client_address: str = ""
    client_email: str = ""
    client_whatsapp: str = ""
    documents: DocumentSelection
    use_coach: bool = False

class DealResponse(BaseModel):
    id: str
    client_name: str
    total_value_inr: float
    status: str
    created_at: str

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(verify_token)):
    """Fetch high-level stats for the current user."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        # Fallback for dev mode without DB
        return {
            "total_value_locked": 450000,
            "pending_revenue": 125000,
            "deal_count": 8,
            "conversion_rate": 72.5
        }
        
    try:
        deals_res = supabase_admin.table("deals").select("*").eq("user_id", user_id).execute()
        deals = deals_res.data or []
        
        locked = sum(d.get("total_value_inr", 0) for d in deals if d.get("status") == "signed")
        pending = sum(d.get("total_value_inr", 0) for d in deals if d.get("status") in ["drafted", "sent"])
        
        return {
            "total_value_locked": locked,
            "pending_revenue": pending,
            "deal_count": len(deals),
            "conversion_rate": 72.5 
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")

@router.get("/deals", response_model=List[DealResponse])
async def get_recent_deals(current_user: dict = Depends(verify_token)):
    """Fetch recent deals for the current user."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        return []
        
    try:
        deals_res = supabase_admin.table("deals").select("id, session_id, client_name, total_value_inr, status, created_at").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        
        formatted_deals = []
        for d in deals_res.data:
            dt = datetime.fromisoformat(d.get("created_at", datetime.utcnow().isoformat()).replace('Z', '+00:00'))
            formatted_date = dt.strftime("%b %d, %Y")
            
            formatted_deals.append(DealResponse(
                id=str(d.get("session_id") or d.get("id")),
                client_name=d.get("client_name", "Unknown"),
                total_value_inr=float(d.get("total_value_inr", 0)),
                status=d.get("status", "drafted"),
                created_at=formatted_date
            ))
            
        return formatted_deals
    except Exception as e:
        logger.error(f"Error fetching deals: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")

@router.post("/deals/draft", response_model=DealResponse)
async def draft_new_deal(payload: DealCreateRequest, current_user: dict = Depends(verify_token)):
    """Creates a new draft deal pre-flight."""
    user_id = current_user.get("sub", "anonymous_user")
    
    if not supabase_admin:
        return DealResponse(
            id="dev-session-123",
            client_name=payload.client_name,
            total_value_inr=0.0,
            status="drafted",
            created_at=datetime.utcnow().strftime("%b %d, %Y")
        )
        
    import uuid
    session_id = str(uuid.uuid4())
    
    try:
        new_deal = {
            "user_id": user_id,
            "session_id": session_id,
            "client_name": payload.client_name,
            "total_value_inr": 0.0,
            "status": "drafted",
            "friction_summary": json.dumps({
                "client_company": payload.client_company,
                "client_address": payload.client_address,
                "client_email": payload.client_email,
                "client_whatsapp": payload.client_whatsapp,
                "documents": payload.documents.dict(),
                "use_coach": payload.use_coach
            })
        }
        res = supabase_admin.table("deals").insert(new_deal).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create deal.")
            
        d = res.data[0]
        dt = datetime.fromisoformat(d.get("created_at").replace('Z', '+00:00'))
        
        return DealResponse(
            id=d.get("session_id"),
            client_name=d.get("client_name"),
            total_value_inr=d.get("total_value_inr"),
            status=d.get("status"),
            created_at=dt.strftime("%b %d, %Y")
        )
    except Exception as e:
        logger.error(f"Error creating deal: {e}")
        raise HTTPException(status_code=500, detail="Database access failed.")
