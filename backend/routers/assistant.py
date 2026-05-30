import logging
import os
from fastapi import APIRouter, Depends, Body, HTTPException
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from backend.auth.jwt_auth import verify_token
from typing import List, Dict

logger = logging.getLogger("voicecontract.assistant")
router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

# Cached client — created once, reused
_llm = None
def get_llm():
    global _llm
    if _llm is None:
        token = os.getenv("GROQ_API_KEY")
        if not token:
            logger.warning("GROQ_API_KEY is not set. Amigo will fail.")
            return None
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=token,
            temperature=0.4,
            max_tokens=512
        )
    return _llm

SYSTEM_PROMPT = """You are Amigo, the AI legal assistant for VoiceContract — a platform that converts verbal agreements into signed legal documents.

Your capabilities:
- Explain contract terms (MSA, NDA, SLA, indemnity, liability caps, IP assignment)
- Advise on negotiation strategies and deal structuring
- Answer questions about VoiceContract features and workflow
- Help with Indian Contract Act 1872 concepts, GST/IGST, and Indian business law
- Understand English, Hindi, Gujarati, and Hinglish

Your personality:
- Professional yet approachable
- Concise — prefer 2-3 sentences over paragraphs
- Use simple language — avoid unnecessary legalese
- If asked something outside your domain, redirect to VoiceContract features

IMPORTANT: You are an AI assistant. You do NOT provide legal advice. Always recommend consulting a licensed attorney for binding decisions."""

@router.post("/chat")
async def chat_with_amigo(
    payload: dict = Body(...),
    token_data: dict = Depends(verify_token)
):
    """
    Multi-turn chat with Amigo, the legal AI assistant.
    Accepts a 'messages' array with role/content pairs.
    """
    llm = get_llm()
    if not llm:
        return {"reply": "I am Amigo. (Groq API Key is missing, so I am running in offline mode). How can I help you with VoiceContract today?"}
    
    incoming_messages = payload.get("messages", [])
    if not incoming_messages:
        return {"reply": "Hey! I'm Amigo, your legal AI assistant. Ask me anything about contracts, negotiations, or VoiceContract features."}
    
    # Build LangChain message list
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    
    # Include last 10 messages for context window management
    recent = incoming_messages[-10:]
    for msg in recent:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
    
    try:
        response = await llm.ainvoke(lc_messages)
        return {"reply": response.content}
    except Exception as e:
        logger.error(f"Amigo Assistant Error: {e}")
        return {"reply": "I'm having trouble connecting right now. Please try again in a moment.", "error": str(e)}
