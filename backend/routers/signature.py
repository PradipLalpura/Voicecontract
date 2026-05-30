import os
import json
import logging
import hashlib
from typing import List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token
from backend.utils.encryption import security_service
from backend.database.client import supabase_admin
from backend.utils.pdf_generator import generate_locked_pdf

logger = logging.getLogger("voicecontract.signature")
router = APIRouter(prefix="/api/signature", tags=["Signature"])

class Point(BaseModel):
    x: float
    y: float
    t: int

class Stroke(BaseModel):
    points: List[Point]

class SignatureRequest(BaseModel):
    session_id: str
    strokes: List[Stroke]

@router.post("/execute")
async def execute_signature(request: Request, payload: SignatureRequest, current_user: dict = Depends(verify_token)):
    """
    Executes the contract by capturing biometric vector paths,
    decrypting the document, generating a locked PDF, and marking the deal as SIGNED.
    """
    session_id = payload.session_id
    user_id = current_user.get("sub", "anonymous_user")
    
    logger.info(f"Received Execution Request for session {session_id}")

    # 1. Fetch encrypted document and deal from Supabase
    msa_text = ""
    crypto_stamp = "UNVERIFIED"
    
    if supabase_admin:
        try:
            # Fetch deal
            deal_res = supabase_admin.table("deals").select("*").eq("session_id", session_id).eq("user_id", user_id).execute()
            if not deal_res.data:
                raise HTTPException(status_code=404, detail="Deal not found or unauthorized.")
            
            deal = deal_res.data[0]
            deal_id = deal["id"]
            
            # Fetch document
            doc_res = supabase_admin.table("documents").select("*").eq("deal_id", deal_id).eq("doc_type", "msa").execute()
            if not doc_res.data:
                raise HTTPException(status_code=404, detail="Document not found.")
            
            doc = doc_res.data[0]
            crypto_stamp = doc.get("crypto_stamp", "UNVERIFIED")
            
            # 2. Decrypt the document
            encrypted_content = doc.get("encrypted_content")
            msa_text = security_service.decrypt(encrypted_content)
            
            # Hash the vector data for audit
            signature_json = payload.model_dump_json()
            sig_hash = hashlib.sha256(signature_json.encode()).hexdigest()
            
            # 3. Update Deal and Document
            supabase_admin.table("deals").update({
                "status": "signed",
                "signed_at": datetime.utcnow().isoformat()
            }).eq("id", deal_id).execute()
            
            supabase_admin.table("documents").update({
                "digital_signature_hash": sig_hash
            }).eq("id", doc["id"]).execute()
            
        except Exception as e:
            logger.error(f"Error accessing database during signature: {e}")
            # If we fail but we are in dev mode, we might want to fallback.
            # But for secure mode, we raise.
            if not msa_text:
                raise HTTPException(status_code=500, detail="Database access failed during execution.")
    else:
        # Fallback for local testing without Supabase
        msa_text = "MOCK MASTER SERVICE AGREEMENT\n\nFallback text since Supabase is not configured."

    # 4. Compile Audit Metadata
    client_ip = request.client.host if request.client else "unknown"
    metadata = {
        "session_id": session_id,
        "user_id": user_id,
        "crypto_stamp": crypto_stamp,
        "ip_address": client_ip,
        "timestamp": datetime.utcnow().isoformat(),
        "signature_vectors": len(payload.strokes)
    }

    # 5. Generate Locked PDF
    strokes_dict = [stroke.model_dump() for stroke in payload.strokes]
    try:
        pdf_bytes = generate_locked_pdf(msa_text, strokes_dict, metadata)
    except Exception as e:
        logger.error(f"Failed to generate locked PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to compile locked instrument.")

    # Return PDF directly
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={
            "Content-Disposition": f"attachment; filename=VoiceContract_{session_id[:8]}.pdf"
        }
    )
