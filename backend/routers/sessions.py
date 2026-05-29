from __future__ import annotations

import logging
from typing import Any, Protocol

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

try:
    from backend.agents.langgraph_firm import LegalDocumentPackage, execute_legal_firm
    from backend.utils.crypto_stamp import generate_document_hash
    from backend.auth.jwt_auth import verify_token
except ModuleNotFoundError:
    from agents.langgraph_firm import LegalDocumentPackage, execute_legal_firm
    from utils.crypto_stamp import generate_document_hash
    from auth.jwt_auth import verify_token

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

        return EndMeetingResponse(session_id=session_id, documents=docs_dict, crypto_stamp=stamp)

    return router
