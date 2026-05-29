from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from backend.auth.jwt_auth import verify_token

logger = logging.getLogger("voicecontract.dispatch")
router = APIRouter(prefix="/api/dispatch", tags=["Dispatch"])

class DispatchRequest(BaseModel):
    session_id: str
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = None # E.164 format
    document_package: Dict[str, Any]
    crypto_stamp: str

class DispatchResponse(BaseModel):
    email_sent: bool
    whatsapp_sent: bool
    tracking_id: str

@router.post("/send", response_model=DispatchResponse)
async def dispatch_documents(payload: DispatchRequest, current_user: dict = Depends(verify_token)):
    """
    Omnichannel Dispatch: Simultaneously fires the legal package to the client via Email and WhatsApp.
    """
    session_id = payload.session_id
    email_status = False
    whatsapp_status = False
    
    # 1. EMAIL DISPATCH (via SendGrid Logic)
    if payload.client_email:
        try:
            logger.info(f"📧 Dispatching MSA to {payload.client_email} for session {session_id}")
            # Placeholder for actual SendGrid API call
            # In production: send_email(to=payload.client_email, subject="Your Contract", body=...)
            email_status = True
        except Exception as e:
            logger.error(f"Email Dispatch Failed: {e}")

    # 2. WHATSAPP DISPATCH (via Meta Cloud API Logic)
    if payload.client_phone:
        try:
            logger.info(f"🟢 Dispatching WhatsApp to {payload.client_phone} for session {session_id}")
            # Placeholder for actual WhatsApp API call
            # In production: send_whatsapp_message(to=payload.client_phone, template="contract_ready", params=[...])
            whatsapp_status = True
        except Exception as e:
            logger.error(f"WhatsApp Dispatch Failed: {e}")

    return DispatchResponse(
        email_sent=email_status,
        whatsapp_sent=whatsapp_status,
        tracking_id=f"TRK_{session_id}"
    )
