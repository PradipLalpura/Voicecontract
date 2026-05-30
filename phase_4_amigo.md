# PHASE 4 — AMIGO VOICE ASSISTANT
## Model: Gemini 3.1 High

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phases 0-3 have been completed. This phase fixes the Amigo voice assistant.

---

## YOUR ROLE

You are a **Conversational AI Engineer**. The Amigo orb (floating chat bubble) is currently broken — the API connection fails, there's no conversation history, and voice input only works on Chrome. Fix all of it.

---

## MANDATORY READING BEFORE CODING

Read these files in FULL:
1. `frontend/components/VoiceAssistantOrb.tsx` (9810 bytes — the Amigo component)
2. `backend/routers/assistant.py` (51 lines — the chat endpoint)
3. `frontend/app/layout.tsx` (understand global placement)

---

## TASK 1: Fix API Connection

**File**: `frontend/components/VoiceAssistantOrb.tsx`

**Current problem**: The API URL is constructed incorrectly. The component tries to call `${protocol}//${host}/api/assistant/chat` where `protocol` and `host` are derived from `window.location` — but the backend runs on a DIFFERENT port (8000).

**Fix**:
```typescript
// Use the same API URL pattern as the dashboard
const apiUrl = process.env.NEXT_PUBLIC_CAPTURE_WS_HOST 
  ? `http://${process.env.NEXT_PUBLIC_CAPTURE_WS_HOST.replace("ws://", "").replace("wss://", "")}` 
  : "http://localhost:8000";

// Then in the fetch call:
const res = await fetch(`${apiUrl}/api/assistant/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`  // Get token from Clerk
  },
  body: JSON.stringify({ messages: conversationHistory })
});
```

---

## TASK 2: Add Conversation History

**File**: `frontend/components/VoiceAssistantOrb.tsx`

**Current**: Each message is sent independently with no memory of previous messages.

**Fix**: Maintain a messages array in state:
```typescript
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const [messages, setMessages] = useState<ChatMessage[]>([]);

// When sending:
const newMessages = [...messages, { role: "user" as const, content: userInput }];
setMessages(newMessages);

const res = await fetch(`${apiUrl}/api/assistant/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  body: JSON.stringify({ messages: newMessages })
});

if (res.ok) {
  const data = await res.json();
  setMessages([...newMessages, { role: "assistant" as const, content: data.reply }]);
}
```

**UI**: Display all messages in a scrollable chat list, not just the last response. Each message should have:
- User messages: right-aligned, primary blue background, white text
- Assistant messages: left-aligned, light gray background, dark text
- Auto-scroll to bottom on new message

---

## TASK 3: Add Loading & Error States

**File**: `frontend/components/VoiceAssistantOrb.tsx`

**Current**: No visual feedback while waiting for API response. No error display if API fails.

**Fix**:
1. Add `isLoading` state — show a typing indicator (animated dots) while waiting
2. Add `error` state — show error message in chat if API fails
3. Disable the send button while loading
4. Auto-retry once on failure with a 2-second delay

---

## TASK 4: Browser Detection for Voice Input

**File**: `frontend/components/VoiceAssistantOrb.tsx`

**Current**: Uses `window.SpeechRecognition || window.webkitSpeechRecognition` which is Chrome/Edge-only. No fallback for Firefox/Safari.

**Fix**:
```typescript
const isSpeechSupported = typeof window !== 'undefined' && 
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// In the UI:
{isSpeechSupported ? (
  <button onClick={toggleVoice} className="...">
    {isListening ? "🔴 Listening..." : "🎤 Voice"}
  </button>
) : (
  <span className="text-xs text-text-muted italic">Voice input requires Chrome/Edge</span>
)}
```

---

## TASK 5: Route-Based Visibility

**File**: `frontend/app/layout.tsx`

**Current**: `VoiceAssistantOrb` appears on ALL pages, including the landing page for unauthenticated users.

**Fix**: Wrap in Clerk's `<SignedIn>` component:
```jsx
import { SignedIn } from "@clerk/nextjs";

// In layout:
<SignedIn>
  <VoiceAssistantOrb />
</SignedIn>
```

**Also handle the no-Clerk case**: If Clerk isn't configured (no publishable key), still show the orb on non-landing pages. Use `usePathname()` to check.

---

## TASK 6: Fix Backend Chat Endpoint

**File**: `backend/routers/assistant.py`

**Current problems**:
- Creates new `ChatGroq` client per request (wasteful)
- `max_tokens=150` (too limiting for meaningful answers)
- No conversation history support (only accepts single message)
- System prompt is too vague

**Fix**:
```python
from fastapi import APIRouter, Depends, Body
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from backend.auth.jwt_auth import verify_token
import os
from typing import List

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# Cached client — created once, reused
_llm = None
def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
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
    
    incoming_messages = payload.get("messages", [])
    if not incoming_messages:
        return {"reply": "Hey! I'm Amigo, your legal AI assistant. Ask me anything about contracts, negotiations, or VoiceContract features."}
    
    # Build LangChain message list
    lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
    
    # Include last 10 messages for context window management
    recent = incoming_messages[-10:]
    for msg in recent:
        if msg.get("role") == "user":
            lc_messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            lc_messages.append(AIMessage(content=msg["content"]))
    
    try:
        response = llm.invoke(lc_messages)
        return {"reply": response.content}
    except Exception as e:
        return {"reply": "I'm having trouble connecting right now. Please try again in a moment.", "error": str(e)}
```

---

## VERIFICATION CHECKLIST

1. **Build**: `cd frontend && npm run build` — zero errors
2. **Chat flow**:
   - Sign in → Amigo orb appears (bottom right)
   - Click orb → chat panel opens
   - Type "What is an MSA?" → send
   - Loading indicator shows → response appears
   - Type follow-up "What should it include?" → context-aware response
3. **Voice**: On Chrome, click voice button → speak → text appears in input
4. **Landing page**: Amigo orb should NOT appear on `/` for unsigned users
5. **Error handling**: Kill backend → send message → error shown in chat → backend restart → next message works
6. **Conversation memory**: Send 3 messages → all 3 visible in chat history with correct alignment

---

## FILES YOU WILL MODIFY

1. `frontend/components/VoiceAssistantOrb.tsx` — Tasks 1-4 (main fix)
2. `frontend/app/layout.tsx` — Task 5 (route-based visibility)
3. `backend/routers/assistant.py` — Task 6 (backend chat upgrade)

## CONSTRAINTS

- Do NOT touch dashboard, cockpit, 3D, or any other page
- Keep the floating orb aesthetic — bottom-right, circular button
- Use existing Tailwind theme classes
- Maximum chat message limit: 10 recent messages sent to API (context window management)

## PHASE 1 CONTEXT (Read Before Coding)

- `Background3D.tsx` now exports `MicModel`, `LockModel`, `SealModel`, `Feature3DGrid`, and `Mini3D` as named exports. Do NOT import `MeshTransmissionMaterial` — it has been removed.
- The Tailwind config now includes `accent: "#00C2CC"` (teal). Use `text-accent` for accent-colored text.
- CSS utilities `.shimmer`, `.float-gentle`, `.text-gradient`, `.card-glow`, `.reveal-on-scroll` are available in `globals.css`.
