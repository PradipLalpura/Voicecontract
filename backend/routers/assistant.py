import logging
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.auth.jwt_auth import verify_token
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger("voicecontract.assistant")
router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

SYSTEM_PROMPT = """
You are Lex, the AI Legal Assistant for VoiceContract.
Your job is to help users understand the platform, explain legal terms simply, and guide them on how to use VoiceContract.
VoiceContract is a platform that uses AI to listen to business meetings and automatically draft Master Service Agreements (MSAs).
Keep your answers brief, professional, and helpful. Do not give actual legal advice, only explain concepts or platform features.
"""

@router.post("/chat", response_model=ChatResponse)
async def chat_with_lex(request: ChatRequest, current_user: dict = Depends(verify_token)):
    try:
        # Initialize Groq LLM
        token = os.getenv("GROQ_API_KEY")
        if not token:
            logger.warning("GROQ_API_KEY is not set. Using fallback mock response.")
            return ChatResponse(reply="I am Lex. (Groq API Key is missing, so I am running in offline mode). How can I help you with VoiceContract today?")
            
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=token,
            temperature=0.3,
            max_tokens=150
        )
        
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=request.message)
        ])
        
        return ChatResponse(reply=str(response.content))
        
    except Exception as e:
        logger.error(f"Lex Assistant Error: {e}")
        raise HTTPException(status_code=500, detail="Lex is currently unavailable.")
