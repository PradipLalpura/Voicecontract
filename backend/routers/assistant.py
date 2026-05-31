import logging
import os
from fastapi import APIRouter, Depends, Body, HTTPException
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
try:
    from backend.auth.jwt_auth import verify_token
except ModuleNotFoundError:
    from auth.jwt_auth import verify_token
from typing import List, Dict, Optional
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

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
            temperature=0.6, # Slightly higher temperature to reduce repetition
            max_tokens=1024
        )
    return _llm

SYSTEM_PROMPT = """You are Amigo, the elite high-fidelity Legal Reasoning Brain for VoiceContract.

Your primary directive is to be an indispensable strategic partner. 
NEVER use robotic greetings or repeat the same phrases across turns.
Analyze the user's specific input, query, or transcript and provide a unique, intelligent, and contextually relevant response.

KNOWLEDGE BASE:
- VoiceContract: An autonomous legal grid transforming verbal agreements into signed MSAs, Invoices, and POs.
- Legal Trinity: Every deal requires a Master Agreement, a defined Purchase Order, and a GST-compliant Invoice.
- Security Architecture: We use End-to-End Encryption and Zero-Storage Biometric Signatures.
- Multi-Lingual: You have native-level understanding of English, Hindi, Gujarati, and Hinglish.

BEHAVIORAL RULES:
1. STOP THE CLUTTER: Do not start every response with "I'm Amigo" or "How can I help?". Just dive into the value.
2. ANALYZE FIRST: If a user mentions a deal term, immediately evaluate it for legal logic (e.g., "₹50k with no advance is high risk").
3. PROBLEM SOLVE: If the user is stuck on a page, guide them through the precise UI sequence.
4. CULTURAL FLUENCY: Use Hinglish or Gujarati phrases (like "Barabar chhe" or "Pakka") if the user initiates it, to build trust.

IMPORTANT: You are an AI reasoning engine. You do NOT provide legal advice. Always state you are explaining legal logic and platform functionality."""

@router.post("/chat")
async def chat_with_amigo(
    payload: ChatRequest,
    token_data: dict = Depends(verify_token)
):
    """
    Multi-turn chat with Amigo, the legal AI assistant.
    Accepts a 'messages' array with role/content pairs.
    """
    llm = get_llm()
    if not llm:
        return {"reply": "I am Amigo. (Neural Link Offline). Please ensure your GROQ_API_KEY is configured."}
    
    incoming_messages = payload.messages
    if not incoming_messages:
        return {"reply": "Hey! I'm Amigo, your legal AI assistant. Ask me anything about contracts, negotiations, or VoiceContract features."}
    
    # Build LangChain message list
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    
    # Include last 10 messages for context window management
    recent = incoming_messages[-10:]
    for msg in recent:
        role = msg.role
        content = msg.content
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role in ["assistant", "agent"]: # Map 'agent' to 'assistant'
            lc_messages.append(AIMessage(content=content))
    
    try:
        response = await llm.ainvoke(lc_messages)
        return {"reply": response.content}
    except Exception as e:
        logger.error(f"Amigo Assistant Error: {e}")
        return {"reply": "Neural grid interference detected. I am standing by for your next command."}
