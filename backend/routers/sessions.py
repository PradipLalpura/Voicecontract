import os
import sys
import logging
from typing import Any, Protocol

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

# --- ROBUST IMPORT SYSTEM ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from backend.agents.langgraph_firm import LegalDocumentPackage, execute_legal_firm
    from backend.utils.crypto_stamp import generate_document_hash
    from backend.auth.jwt_auth import verify_token
    from backend.utils.encryption import security_service
    from backend.database.client import supabase_admin
except ModuleNotFoundError:
    from agents.langgraph_firm import LegalDocumentPackage, execute_legal_firm
    from utils.crypto_stamp import generate_document_hash
    from auth.jwt_auth import verify_token
    from utils.encryption import security_service
    from database.client import supabase_admin

logger = logging.getLogger("voicecontract.sessions")

class LegalInputRegistry(Protocol):
    async def get_legal_inputs(self, session_id: str) -> dict[str, Any] | None:
        ...

class EndMeetingRequest(BaseModel):
    identity: dict[str, Any] = Field(default_factory=dict)

class EndMeetingResponse(BaseModel):
    session_id: str
    documents: dict[str, Any]
    crypto_stamp: str

def create_sessions_router(registry: LegalInputRegistry) -> APIRouter:
    router = APIRouter(prefix="/api/meeting", tags=["Meeting Sessions"])

    @router.post("/{session_id}/end", response_model=EndMeetingResponse)
    async def end_meeting(session_id: str, payload: EndMeetingRequest | None = None, current_user: dict = Depends(verify_token)) -> EndMeetingResponse:
        legal_inputs = await registry.get_legal_inputs(session_id)
        if legal_inputs is None:
            raise HTTPException(status_code=404, detail="Meeting session not found.")

        transcript = str(legal_inputs.get("transcript", "")).strip()
        if not transcript:
            raise HTTPException(status_code=422, detail="Meeting session has no transcript to process.")

        stored_identity = legal_inputs.get("identity") if isinstance(legal_inputs.get("identity"), dict) else {}
        request_identity = payload.identity if payload is not None else {}
        identity = {
            **stored_identity,
            **request_identity,
            "session_id": session_id,
            "live_commitments": legal_inputs.get("commitments", []),
        }

        try:
            package: LegalDocumentPackage = await execute_legal_firm(transcript=transcript, identity=identity)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception as exc:
            logger.exception("legal_firm_execution_failed session=%s", session_id)
            raise HTTPException(status_code=502, detail="Legal firm execution failed.") from exc

        docs_dict = package.to_dict()
        stamp = generate_document_hash(docs_dict)
        logger.info(f"🔒 Generated Crypto Stamp for {session_id}: {stamp}")

        # --- DATABASE INSERTION & ENCRYPTION ---
        if supabase_admin:
            try:
                user_id = current_user.get("sub", "anonymous_user")
                
                # 1. Encrypt the document payload
                encrypted_msa = security_service.encrypt(docs_dict.get("msa", ""))
                
                # 2. Insert Deal
                deal_data = {
                    "user_id": user_id,
                    "session_id": session_id,
                    "client_name": identity.get("client", "Unknown Client"),
                    "total_value_inr": docs_dict.get("blueprint", {}).get("total_price_inr", 0),
                    "status": "drafted",
                    "friction_summary": "Deal generated successfully."
                }
                deal_response = supabase_admin.table("deals").insert(deal_data).execute()
                
                if deal_response.data:
                    deal_id = deal_response.data[0]["id"]
                    
                    # 3. Insert Encrypted Document
                    doc_data = {
                        "deal_id": deal_id,
                        "doc_type": "msa",
                        "encrypted_content": encrypted_msa,
                        "crypto_stamp": stamp
                    }
                    supabase_admin.table("documents").insert(doc_data).execute()
                    
                    logger.info(f"✅ Securely stored encrypted document and deal info for session {session_id}.")
            except Exception as db_err:
                logger.error(f"Database insertion failed: {db_err}")

        # Return cleartext document for frontend session completion phase
        return EndMeetingResponse(session_id=session_id, documents=docs_dict, crypto_stamp=stamp)

    return router
