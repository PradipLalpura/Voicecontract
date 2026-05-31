from __future__ import annotations

import logging
import hashlib
import json
import os
import secrets
from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel

try:
    from backend.database.client import supabase_admin
    from backend.utils.encryption import security_service
    from backend.utils.pdf_generator import generate_locked_pdf
except ModuleNotFoundError:
    from database.client import supabase_admin
    from utils.encryption import security_service
    from utils.pdf_generator import generate_locked_pdf

logger = logging.getLogger("voicecontract.client_sign")
router = APIRouter(prefix="/api/client-sign", tags=["Client Signing"])


class ClientPoint(BaseModel):
    x: float
    y: float
    t: int


class ClientStroke(BaseModel):
    points: List[ClientPoint]


class ClientSignRequest(BaseModel):
    client_name: str
    strokes: List[ClientStroke]
    agreed_to_terms: bool = True


@router.get("/{session_id}")
async def get_contract_for_signing(session_id: str):
    """
    PUBLIC endpoint. Returns the contract data for client to review.
    No authentication required — the session_id itself acts as a token.
    """
    if not supabase_admin:
        # Dev fallback
        return {
            "session_id": session_id,
            "client_name": "Demo Client",
            "client_company": "Demo Corp",
            "provider_name": "VoiceContract Provider",
            "provider_company": "Antarik Technologies",
            "msa_text": "MASTER SERVICE AGREEMENT\n\nThis is a demonstration contract.\n\n1. SCOPE: As discussed during the recorded meeting.\n2. CONSIDERATION: As agreed upon by both parties.\n3. TIMELINE: As per the mutually decided schedule.\n4. IP RIGHTS: All intellectual property transfers upon full payment.\n5. CONFIDENTIALITY: Both parties agree to maintain confidentiality.",
            "invoice_text": "TAX INVOICE\n\nInvoice Number: VC-INV-DEMO-0001\nDate: " + datetime.utcnow().strftime("%Y-%m-%d") + "\n\nDemo invoice content.\n\nSubtotal: INR 50,000\nIGST @18%: INR 9,000\nGrand Total: INR 59,000",
            "po_text": "",
            "crypto_stamp": "DEMO-STAMP-" + secrets.token_hex(8).upper(),
            "provider_signed": True,
            "client_signed": False,
            "status": "pending_client_signature",
            "brand_accent": "#2563EB",
        }

    try:
        # Fetch deal by session_id (no user_id filter — this is a public link)
        deal_res = supabase_admin.table("deals").select("*").eq("session_id", session_id).execute()
        if not deal_res.data:
            raise HTTPException(status_code=404, detail="Contract not found or link expired.")

        deal = deal_res.data[0]
        deal_id = deal["id"]

        # Check if already fully signed
        if deal.get("status") == "fully_signed":
            raise HTTPException(status_code=400, detail="This contract has already been fully executed.")

        # Fetch all documents
        msa_text = ""
        invoice_text = ""
        po_text = ""
        crypto_stamp = ""

        doc_res = supabase_admin.table("documents").select("*").eq("deal_id", deal_id).execute()
        for doc in (doc_res.data or []):
            try:
                decrypted = security_service.decrypt(doc.get("encrypted_content", ""))
            except Exception:
                decrypted = "[Document content unavailable]"

            if doc["doc_type"] == "msa":
                msa_text = decrypted
                crypto_stamp = doc.get("crypto_stamp", "")
            elif doc["doc_type"] == "invoice":
                invoice_text = decrypted
            elif doc["doc_type"] == "po":
                po_text = decrypted

        # Get provider info from users table
        provider_info = {}
        try:
            user_res = supabase_admin.table("users").select("*").eq("id", deal.get("user_id", "")).execute()
            if user_res.data:
                provider_info = user_res.data[0]
        except Exception:
            pass

        return {
            "session_id": session_id,
            "client_name": deal.get("client_name", "Client"),
            "client_company": deal.get("client_company", ""),
            "provider_name": f"{provider_info.get('first_name', '')} {provider_info.get('last_name', '')}".strip() or "Provider",
            "provider_company": provider_info.get("company_name", "Provider Company"),
            "msa_text": msa_text or "Contract content pending.",
            "invoice_text": invoice_text,
            "po_text": po_text,
            "crypto_stamp": crypto_stamp,
            "provider_signed": deal.get("status") in ["signed", "pending_client_signature", "fully_signed"],
            "client_signed": deal.get("status") == "fully_signed",
            "status": deal.get("status", "unknown"),
            "brand_accent": provider_info.get("brand_accent", "#2563EB"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch contract for signing: {e}")
        raise HTTPException(status_code=500, detail="Failed to load contract.")


@router.post("/{session_id}/sign")
async def client_sign_contract(session_id: str, request: Request, payload: ClientSignRequest):
    """
    PUBLIC endpoint. Client submits their signature strokes.
    Generates the final dual-signed PDF and marks deal as fully_signed.
    """
    if not payload.agreed_to_terms:
        raise HTTPException(status_code=400, detail="You must agree to the terms before signing.")

    if not payload.strokes or len(payload.strokes) == 0:
        raise HTTPException(status_code=400, detail="Please provide your signature.")

    if not supabase_admin:
        # Dev fallback — generate a mock PDF
        mock_text = (
            "MASTER SERVICE AGREEMENT\n\n"
            "This agreement is executed between Provider and Client.\n\n"
            "1. SCOPE: As discussed during the recorded meeting.\n"
            "2. CONSIDERATION: As agreed upon.\n"
            "3. TIMELINE: As agreed upon.\n"
            "4. IP RIGHTS: Transfers on full payment.\n"
        )
        strokes_dict = [s.model_dump() for s in payload.strokes]
        metadata = {
            "session_id": session_id,
            "client_name": payload.client_name,
            "signed_by": "client",
            "timestamp": datetime.utcnow().isoformat(),
            "crypto_stamp": "DEV-" + secrets.token_hex(8).upper(),
        }
        pdf_bytes = generate_locked_pdf(mock_text, strokes_dict, metadata)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=VoiceContract_{session_id[:8]}_countersigned.pdf"}
        )

    try:
        # Fetch deal
        deal_res = supabase_admin.table("deals").select("*").eq("session_id", session_id).execute()
        if not deal_res.data:
            raise HTTPException(status_code=404, detail="Contract not found.")

        deal = deal_res.data[0]
        deal_id = deal["id"]

        if deal.get("status") == "fully_signed":
            raise HTTPException(status_code=400, detail="Contract already fully executed.")

        # Fetch MSA document
        doc_res = supabase_admin.table("documents").select("*").eq("deal_id", deal_id).eq("doc_type", "msa").execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found.")

        doc = doc_res.data[0]
        msa_text = security_service.decrypt(doc.get("encrypted_content", ""))
        crypto_stamp = doc.get("crypto_stamp", "UNVERIFIED")

        # Generate signature hash for audit trail
        sig_json = payload.model_dump_json()
        client_sig_hash = hashlib.sha256(sig_json.encode()).hexdigest()

        # Get client IP for audit
        client_ip = request.client.host if request.client else "unknown"

        # Build metadata
        metadata = {
            "session_id": session_id,
            "client_name": payload.client_name,
            "crypto_stamp": crypto_stamp,
            "ip_address": client_ip,
            "timestamp": datetime.utcnow().isoformat(),
            "signed_by": "client",
            "signature_vectors": len(payload.strokes),
        }

        # Generate PDF with client signature
        strokes_dict = [s.model_dump() for s in payload.strokes]
        pdf_bytes = generate_locked_pdf(msa_text, strokes_dict, metadata)

        # Update deal status to fully_signed
        supabase_admin.table("deals").update({
            "status": "fully_signed",
            "signed_at": datetime.utcnow().isoformat(),
        }).eq("id", deal_id).execute()

        # Store client signature hash in document
        supabase_admin.table("documents").update({
            "client_signature_hash": client_sig_hash,
        }).eq("id", doc["id"]).execute()

        logger.info(f"Client signed contract for session {session_id}")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=VoiceContract_{session_id[:8]}_countersigned.pdf"}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Client signing failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute client signature.")
