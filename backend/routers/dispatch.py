from __future__ import annotations

import logging
import os
import uuid
from typing import Any, Dict, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token

logger = logging.getLogger("voicecontract.dispatch")
router = APIRouter(prefix="/api/dispatch", tags=["Dispatch"])

# In-memory dispatch log (persists for the lifetime of the server process)
_dispatch_log: Dict[str, Dict[str, Any]] = {}


class DispatchChannels(BaseModel):
    email: str = ""
    whatsapp: str = ""


class DispatchRequest(BaseModel):
    session_id: str
    channels: DispatchChannels = DispatchChannels()


class DispatchResponse(BaseModel):
    status: str
    tracking_id: str
    channels: Dict[str, str]
    timestamp: str


async def _simulate_email_dispatch(session_id: str, recipient: str) -> str:
    """Simulate queuing an email dispatch. Returns a tracking ID."""
    tracking = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"
    _dispatch_log[tracking] = {
        "channel": "email",
        "session_id": session_id,
        "recipient": recipient,
        "status": "queued",
        "timestamp": datetime.utcnow().isoformat(),
    }
    logger.info(
        "dispatch_email_queued tracking=%s session=%s recipient=%s",
        tracking, session_id, recipient
    )
    return tracking


async def _simulate_whatsapp_dispatch(session_id: str, recipient: str) -> str:
    """Simulate queuing a WhatsApp dispatch. Returns a tracking ID."""
    tracking = f"WA-{uuid.uuid4().hex[:8].upper()}"
    _dispatch_log[tracking] = {
        "channel": "whatsapp",
        "session_id": session_id,
        "recipient": recipient,
        "status": "queued",
        "timestamp": datetime.utcnow().isoformat(),
    }
    logger.info(
        "dispatch_whatsapp_queued tracking=%s session=%s recipient=%s",
        tracking, session_id, recipient
    )
    return tracking


@router.post("/send", response_model=DispatchResponse)
async def dispatch_documents(payload: DispatchRequest, current_user: dict = Depends(verify_token)):
    """
    Omnichannel Dispatch: Simultaneously fires the legal package
    to the client via Email and WhatsApp (simulated).
    Returns a master tracking ID and per-channel tracking IDs.
    """
    session_id = payload.session_id
    channel_results: Dict[str, str] = {}

    # 1. EMAIL DISPATCH
    if payload.channels.email:
        try:
            email_tracking = await _simulate_email_dispatch(session_id, payload.channels.email)
            channel_results["email"] = email_tracking
        except Exception as e:
            logger.error(f"Email dispatch failed: {e}")
            channel_results["email"] = "FAILED"

    # 2. WHATSAPP DISPATCH
    if payload.channels.whatsapp:
        try:
            wa_tracking = await _simulate_whatsapp_dispatch(session_id, payload.channels.whatsapp)
            channel_results["whatsapp"] = wa_tracking
        except Exception as e:
            logger.error(f"WhatsApp dispatch failed: {e}")
            channel_results["whatsapp"] = "FAILED"

    if not channel_results:
        raise HTTPException(
            status_code=422,
            detail="No valid dispatch channels provided. Supply at least one email or WhatsApp number."
        )

    # 3. Master tracking ID
    master_tracking = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    _dispatch_log[master_tracking] = {
        "channel": "master",
        "session_id": session_id,
        "sub_channels": channel_results,
        "status": "dispatched",
        "timestamp": datetime.utcnow().isoformat(),
    }

    return DispatchResponse(
        status="dispatched",
        tracking_id=master_tracking,
        channels=channel_results,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/status/{tracking_id}")
async def get_dispatch_status(tracking_id: str, current_user: dict = Depends(verify_token)):
    """Check the status of a dispatch by its tracking ID."""
    record = _dispatch_log.get(tracking_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tracking ID not found.")
    return record
