from __future__ import annotations

import logging
import os
import urllib.parse
import uuid
from typing import Any, Dict, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
try:
    from backend.auth.jwt_auth import verify_token
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token

try:
    import resend
except ImportError:
    resend = None

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
    client_name: str = ""
    signing_link: str = ""


class DispatchResponse(BaseModel):
    status: str
    tracking_id: str
    channels: Dict[str, Any]
    timestamp: str


async def _send_email_dispatch(session_id: str, recipient: str, client_name: str = "", signing_link: str = "") -> str:
    tracking = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"

    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key or not resend:
        logger.warning("RESEND_API_KEY not set or resend not installed, simulating email")
        _dispatch_log[tracking] = {
            "channel": "email", "session_id": session_id,
            "recipient": recipient, "status": "simulated",
            "timestamp": datetime.utcnow().isoformat(),
        }
        return tracking

    try:
        resend.api_key = api_key
        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: #0A0A0A; border-radius: 24px; padding: 48px; text-align: center;">
                <h1 style="color: white; font-size: 28px; font-weight: 900; letter-spacing: -1px; margin: 0 0 8px;">VoiceContract</h1>
                <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 4px; margin: 0;">Secure Document Execution</p>
            </div>
            <div style="padding: 48px 0;">
                <h2 style="font-size: 24px; font-weight: 800; color: #0A0A0A; margin: 0 0 16px;">Your Contract is Ready</h2>
                <p style="font-size: 16px; color: #666; line-height: 1.6; margin: 0 0 32px;">Hi{' ' + client_name if client_name else ''}, a legal agreement has been prepared and signed by the provider. Please review and apply your digital signature.</p>
                <a href="{signing_link}" style="display: inline-block; background: #2563EB; color: white; padding: 18px 48px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Review & Sign Contract</a>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 24px; text-align: center;">
                <p style="font-size: 11px; color: #aaa;">Secured with SHA-256 crypto stamp &bull; Powered by VoiceContract AI</p>
                <p style="font-size: 11px; color: #aaa;">&copy; Antarik Technologies</p>
            </div>
        </div>
        """

        email_result = resend.Emails.send({
            "from": "VoiceContract <projects@antarik.co>",
            "to": [recipient],
            "subject": f"Contract Ready for Signature{' — ' + client_name if client_name else ''}",
            "html": html_content,
        })

        _dispatch_log[tracking] = {
            "channel": "email", "session_id": session_id,
            "recipient": recipient, "status": "sent",
            "resend_id": email_result.get("id", "") if isinstance(email_result, dict) else str(email_result),
            "timestamp": datetime.utcnow().isoformat(),
        }
        logger.info(f"Email sent via Resend to {recipient}, tracking={tracking}")
    except Exception as e:
        logger.error(f"Resend email failed: {e}")
        _dispatch_log[tracking] = {
            "channel": "email", "session_id": session_id,
            "recipient": recipient, "status": "failed",
            "error": str(e), "timestamp": datetime.utcnow().isoformat(),
        }

    return tracking


async def _send_whatsapp_dispatch(session_id: str, recipient: str, signing_link: str = "") -> str:
    tracking = f"WA-{uuid.uuid4().hex[:8].upper()}"

    clean_number = recipient.replace("+", "").replace(" ", "").replace("-", "")
    message = f"Your contract is ready for signature. Review and sign here: {signing_link}"
    wa_link = f"https://wa.me/{clean_number}?text={urllib.parse.quote(message)}"

    _dispatch_log[tracking] = {
        "channel": "whatsapp", "session_id": session_id,
        "recipient": recipient, "status": "link_generated",
        "wa_link": wa_link,
        "timestamp": datetime.utcnow().isoformat(),
    }
    logger.info(f"WhatsApp link generated for {recipient}, tracking={tracking}")
    return tracking


@router.post("/send", response_model=DispatchResponse)
async def dispatch_documents(payload: DispatchRequest, current_user: dict = Depends(verify_token)):
    """
    Omnichannel Dispatch: Fires the legal package
    to the client via Email (Resend) and WhatsApp (deep link).
    Returns a master tracking ID and per-channel tracking IDs.
    """
    session_id = payload.session_id
    channel_results: Dict[str, Any] = {}

    # 1. EMAIL DISPATCH
    if payload.channels.email:
        try:
            email_tracking = await _send_email_dispatch(
                session_id, payload.channels.email,
                client_name=payload.client_name,
                signing_link=payload.signing_link,
            )
            channel_results["email"] = email_tracking
        except Exception as e:
            logger.error(f"Email dispatch failed: {e}")
            channel_results["email"] = "FAILED"

    # 2. WHATSAPP DISPATCH
    if payload.channels.whatsapp:
        try:
            wa_tracking = await _send_whatsapp_dispatch(
                session_id, payload.channels.whatsapp,
                signing_link=payload.signing_link,
            )
            # Include wa_link in channel results
            wa_record = _dispatch_log.get(wa_tracking, {})
            channel_results["whatsapp"] = {
                "tracking_id": wa_tracking,
                "wa_link": wa_record.get("wa_link", ""),
            }
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
