# VOICECONTRACT — MASTER IDEATION & CODEBASE CONTEXT

> **PURPOSE OF THIS FILE**: This document is the single source of truth for any AI model working on VoiceContract. It contains the complete product vision, technical architecture, current codebase state, and every known bug. **Read this file in full before touching any code.**

---

## 1. THE PROBLEM

Freelancers and small agencies agree on scope, price, and deadlines over a phone/video call. The call ends, but nobody sends a contract. Two weeks later the client says "that's not what we agreed." There's nothing in writing. The gap between "we discussed it" and "we have something signed" is a massive financial liability.

## 2. THE SOLUTION: VOICECONTRACT

VoiceContract is an AI-powered autonomous legal engine. It sits in on client meetings (live or via uploaded recording), listens to the conversation, extracts firm commitments, and mints structured, binding legal documents (MSA, Invoice, Purchase Order) before the call ends.

### The Pipeline:
1. **Ingestion** — Live audio via WebSocket or uploaded recording
2. **Transcription** — Whisper Large V3 Turbo via Groq (sub-second latency)
3. **Commitment Extraction** — Llama 3.3 70B identifies firm legal commitments (price, scope, timeline, revisions, IP, etc.)
4. **Negotiation Coaching** (Optional) — GPT-4o provides real-time tactical advice during live meetings
5. **Document Minting** — LangGraph pipeline: Strategist → Drafter → Red Team → Auditor → Deal Surgeon
6. **Brand DNA Styling** — Documents formatted per user's company identity (logo, GST, address, template)
7. **Dual E-Sign** — Provider signs → Document locks → Dispatched to client via Email/WhatsApp
8. **Amigo** — AI assistant chatbot (Llama 3.3 70B) available globally for legal Q&A

### Linguistic Intelligence:
Full mastery of **English, Hindi, Gujarati, and Hinglish**. Must recognize that "Barabar chhe" (Gujarati) or "Done hai" (Hindi) means a legal commitment to the previous point.

### Aesthetic: "Titanium & Frost"
Premium Enterprise Light theme. Apple-grade precision. Inter font. Blue primary (#2563EB). Clean whites (#F9FAFB background, #FFFFFF surface). No toy-like UI.

---

## 3. COMPLETE TECH STACK

### Frontend
- **Framework**: Next.js 14.2.3, React 18, TypeScript
- **3D Engine**: React Three Fiber (R3F) + Three.js 0.184 + @react-three/drei 9.106
- **Animation**: GSAP 3.12.5 + Framer Motion 11.2.6
- **Auth**: Clerk (@clerk/nextjs 5.7.6)
- **Styling**: Tailwind CSS 3.4.3
- **Font**: Inter (@fontsource/inter)

### Backend
- **Framework**: FastAPI (Python), Uvicorn
- **AI Models**:
  - Groq Whisper Large V3 Turbo (transcription)
  - Groq Llama 3.3 70B Versatile (context extraction, auditor, Amigo chat)
  - GPT-4o via GitHub Models (strategist, drafter, red team, deal surgeon)
- **Pipeline**: LangGraph state machine (5 nodes with feedback loop)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: HMAC-SHA256 for WebSocket, JWT for REST APIs
- **Security**: Fernet encryption, PII scrubbing, SHA-256 crypto stamps

### Infrastructure
- **Entry Point**: `run.py` at project root → loads `.env` → runs `uvicorn backend.main:app`
- **Env File**: Single `.env` at project root (shared by frontend via `dotenv` in next.config.mjs)

---

## 4. DIRECTORY STRUCTURE

```
Voicecontract/
├── .env                              # API keys (GROQ, GEMINI, GITHUB_TOKEN, CLERK, SHARED_SECRET)
├── run.py                            # Backend entry: uvicorn backend.main:app
├── Issues.txt                        # User-reported bugs
├── MASTER_EXECUTION_PLAN.md          # Product roadmap
│
├── backend/
│   ├── main.py                       # (769 lines) Core engine: WebSocket /ws/capture, binary audio protocol, SessionRegistry, AudioAccumulator, real-time AI pipeline
│   ├── requirements.txt              # ⚠️ INCOMPLETE — missing many deps
│   ├── agents/
│   │   ├── whisper_agent.py          # (126 lines) Groq Whisper transcription, PCM→WAV, retry logic
│   │   ├── context_agent.py          # (233 lines) Groq Llama commitment extraction, deduplication, confidence filtering
│   │   ├── strategist_agent.py       # (107 lines) GPT-4o negotiation tips via GitHub Models
│   │   └── langgraph_firm.py         # (425 lines) LangGraph: Strategist→Drafter→RedTeam→Auditor→DealSurgeon
│   ├── auth/
│   │   └── jwt_auth.py              # (46 lines) JWT create/verify, ⚠️ verify_signature=False, dev_token bypass
│   ├── database/
│   │   ├── client.py                # (22 lines) Supabase admin client (service role key)
│   │   └── migrations/
│   │       └── 01_genesis_schema.sql # Schema: users, deals, deal_metrics, documents (with RLS)
│   ├── models/
│   │   └── deal.py                  # (45 lines) Pydantic models (unused by routers)
│   ├── routers/
│   │   ├── sessions.py              # POST /api/meeting/{session_id}/end → triggers LangGraph pipeline
│   │   ├── dispatch.py              # POST /api/dispatch/send → ⚠️ STUB (email/WhatsApp placeholder)
│   │   ├── dashboard.py             # GET /api/dashboard/stats, GET /api/dashboard/deals, POST /api/dashboard/deals/draft
│   │   ├── webhooks.py              # POST /api/webhooks/clerk → Clerk→Supabase user sync
│   │   ├── signature.py             # POST /api/signature/execute → biometric sign + PDF generation
│   │   ├── assistant.py             # POST /api/assistant/chat → Amigo chatbot (Groq Llama)
│   │   └── users.py                 # GET /api/users/me, POST /api/users/onboard
│   └── utils/
│       ├── crypto_stamp.py          # SHA-256 document hashing (⚠️ non-reproducible salt)
│       ├── encryption.py            # Fernet symmetric encryption
│       ├── pdf_generator.py         # ReportLab PDF with watermark, signatures, password protection
│       └── pii_scrubber.py          # Regex PII scrubber for Indian context
│
└── frontend/
    ├── package.json                  # Dependencies listed above
    ├── next.config.mjs              # ⚠️ Exposes CLERK_SECRET_KEY to browser
    ├── middleware.ts                  # Clerk route protection
    ├── tailwind.config.ts            # Titanium & Frost theme tokens
    ├── app/
    │   ├── layout.tsx               # Root: ClerkProvider + VoiceAssistantOrb (global)
    │   ├── globals.css              # Base styles
    │   ├── page.tsx                 # (11808 bytes) Landing page: GSAP ScrollTrigger + Background3D
    │   ├── dashboard/page.tsx       # (22909 bytes) Command Center: 15+ useState hooks, pre-flight modal
    │   ├── onboarding/page.tsx      # First-time setup → IdentityWizard
    │   ├── cockpit/page.tsx         # (11763 bytes) Live meeting interception UI
    │   ├── processing/page.tsx      # ⚠️ FAKE — timed animation, no real backend call
    │   ├── review/[session_id]/page.tsx  # ⚠️ HARDCODED terms — no backend fetch
    │   ├── sign/[session_id]/page.tsx    # (12633 bytes) E-sign vault, ⚠️ hardcoded docs, signature never sent
    │   └── settings/
    │       ├── [[...rest]]/page.tsx  # ⚠️ BROKEN — defaultValue, no save handler
    │       └── temp.tsx             # ✅ CORRECT impl with API calls — but NOT ROUTED (wrong filename)
    ├── components/
    │   ├── Background3D.tsx         # (20649 bytes) R3F: RealisticLaptop, RealisticPhone, RealisticContract, CrashProofWave
    │   ├── IdentityWizard.tsx       # (12929 bytes) 4-step onboarding: Company→Address→Template→Confirm
    │   ├── VoiceAssistantOrb.tsx    # (9810 bytes) Amigo floating chat + voice input
    │   ├── MultimodalIngestor.tsx   # ⚠️ UNUSED — never imported
    │   ├── TemplateEditor.tsx       # ⚠️ UNUSED — never imported
    │   ├── SafeAuth.tsx             # ⚠️ UNUSED — never imported
    │   └── animations/
    │       └── SuccessHandshake.tsx  # Success animation (buttons not wired)
    ├── hooks/
    │   ├── useLiveAudio.ts          # (14122 bytes) WebSocket audio capture, custom binary protocol, AudioWorklet
    │   └── useSafeUser.ts           # ⚠️ VIOLATES Rules of Hooks (conditional hook call)
    ├── lib/
    │   └── encryption.ts            # ⚠️ STUB — returns input unchanged after 300ms delay
    └── public/
        └── audio-processor.js       # AudioWorklet: Float32→Int16 PCM conversion
```

---

## 5. COMPLETE BUG REGISTRY

### 🔴 CRITICAL (Security)
| ID | File | Bug |
|----|------|-----|
| SEC-1 | `frontend/next.config.mjs` L19 | `CLERK_SECRET_KEY` exposed to browser via `env:{}` block |
| SEC-2 | `frontend/next.config.mjs` L21 | `CAPTURE_SHARED_SECRET` exposed as `NEXT_PUBLIC_CAPTURE_SHARED_SECRET` |
| SEC-3 | `backend/auth/jwt_auth.py` L38 | JWT decoded with `verify_signature: False` — anyone can forge tokens |

### 🔴 CRITICAL (Broken Features)
| ID | File | Bug |
|----|------|-----|
| BRK-1 | `frontend/app/dashboard/page.tsx` L304 | "Start Live Meeting" button uses `setShowPreFlight(true)` instead of `openPreFlight("live")` — doesn't reset state |
| BRK-2 | `frontend/app/dashboard/page.tsx` L61 | `audioInputRef` is created but the `<input>` element is NEVER rendered in JSX — upload flow completely broken |
| BRK-3 | `frontend/app/dashboard/page.tsx` L149-151 | No `finally` block — if API fails, `isStarting` stays `true` forever ("Initializing_Vault" freeze) |
| BRK-4 | `frontend/app/settings/[[...rest]]/page.tsx` | Uses `defaultValue` (uncontrolled) — save button has no `onClick` — form is 100% non-functional |
| BRK-5 | `frontend/app/settings/temp.tsx` | CORRECT implementation exists but file is named `temp.tsx`, not `page.tsx` — Next.js never routes to it |
| BRK-6 | `frontend/hooks/useSafeUser.ts` L6-20 | Conditional `useClerkUser()` call violates React's Rules of Hooks |

### 🟠 HIGH (Hardcoded/Fake)
| ID | File | Bug |
|----|------|-----|
| FKE-1 | `frontend/app/processing/page.tsx` | Entirely fake — timed animation, no backend API call |
| FKE-2 | `frontend/app/review/[session_id]/page.tsx` | Terms are hardcoded static data, no backend fetch |
| FKE-3 | `frontend/app/sign/[session_id]/page.tsx` | Documents are hardcoded strings, not from backend |
| FKE-4 | `frontend/app/sign/[session_id]/page.tsx` | Signature canvas data is drawn but NEVER extracted or sent to backend |
| FKE-5 | `frontend/app/sign/[session_id]/page.tsx` | "Download" button is `window.print()` — not real PDF |
| FKE-6 | `frontend/app/cockpit/page.tsx` | Term detection is keyword-based, coach advice is hardcoded (not from AI) |
| FKE-7 | `backend/routers/dispatch.py` | Email/WhatsApp dispatch are stubs that always return success |
| FKE-8 | `backend/routers/dashboard.py` | `conversion_rate` hardcoded to `72.5` |

### 🟡 MEDIUM (Performance/Architecture)
| ID | File | Bug |
|----|------|-----|
| PRF-1 | `Background3D.tsx` L270 | Creates new `THREE.BufferAttribute` every frame in `CrashProofWave` |
| PRF-2 | `Background3D.tsx` L174 | `MeshTransmissionMaterial` with `samples={16}` is extremely GPU-intensive |
| PRF-3 | `page.tsx` (landing) | 3 Mini3D instances = 3 separate WebGL contexts on one page |
| PRF-4 | `frontend/app/cockpit/page.tsx` | Missing `<Suspense>` around `useSearchParams()` (Next.js 14 requirement) |
| ARC-1 | No state management | Every page uses local `useState` — zero state sharing between pages |
| ARC-2 | `backend/requirements.txt` | Missing: supabase, svix, cryptography, reportlab, PyJWT, python-dotenv, httpx |
| ARC-3 | `.env` | Missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| ARC-4 | `backend/routers/assistant.py` | Creates new ChatGroq client per request, max_tokens=150, no conversation history |

---

## 6. API ENDPOINT MAP

| Method | Path | Auth | Backend File | Status |
|--------|------|------|-------------|--------|
| GET | `/healthz` | None | main.py | ✅ Working |
| WS | `/ws/capture` | HMAC | main.py | ✅ Working |
| POST | `/api/meeting/{session_id}/end` | JWT | sessions.py | ✅ Working |
| POST | `/api/dispatch/send` | JWT | dispatch.py | ⚠️ STUB |
| GET | `/api/dashboard/stats` | JWT | dashboard.py | ✅ Working |
| GET | `/api/dashboard/deals` | JWT | dashboard.py | ✅ Working |
| POST | `/api/dashboard/deals/draft` | JWT | dashboard.py | ✅ Working |
| POST | `/api/webhooks/clerk` | Svix | webhooks.py | ✅ Working |
| POST | `/api/signature/execute` | JWT | signature.py | ✅ Working |
| POST | `/api/assistant/chat` | JWT | assistant.py | ⚠️ Reported broken |
| GET | `/api/users/me` | JWT | users.py | ✅ Working |
| POST | `/api/users/onboard` | JWT | users.py | ✅ Working |

---

## 7. AI MODEL MAP

| Agent | Model | Provider | API Base URL |
|-------|-------|----------|-------------|
| WhisperAgent | `whisper-large-v3-turbo` | Groq | `https://api.groq.com/openai/v1` |
| ContextAgent | `llama-3.3-70b-versatile` | Groq | `https://api.groq.com/openai/v1` |
| StrategistAgent | `gpt-4o` | GitHub Models | `https://models.inference.ai.azure.com` |
| LangGraph (all nodes) | `openai/gpt-4o` + `llama-3.3-70b-versatile` | GitHub Models + Groq | Mixed |
| Amigo | `llama-3.3-70b-versatile` | Groq | via `langchain-groq` |

---

## 8. ENVIRONMENT VARIABLES

```env
# Available in .env:
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AQ.Ab8... (⚠️ NEVER USED in any code)
GITHUB_TOKEN=github_pat_... (used for GPT-4o via GitHub Models)
CAPTURE_SHARED_SECRET=VoiceContract_Antarik_X_Outskill_2026
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MISSING (needed for persistence):
SUPABASE_URL=???
SUPABASE_SERVICE_ROLE_KEY=???
```

---

## 9. PHASE EXECUTION ORDER

| Phase | Model | Focus |
|-------|-------|-------|
| 0 | **Opus 4.6** | Security & Infrastructure fixes |
| 1 | **Gemini 3.1 Pro Preview** | 3D Engine, GSAP, ScrollTrigger, Settings |
| 2 | **Gemini 3.1 High** | Brand DNA & Onboarding |
| 3 | **Opus 4.6** | Dashboard State Isolation & Un-Freezing |
| 4 | **Gemini 3.1 High** | Amigo Voice Assistant |
| 5 | **Opus 4.6** | Cockpit & Live Coaching |
| 6 | **Gemini 3.1 Pro Preview** | E-Sign Vault & Dispatch |

---

## 10. GOLDEN RULES

1. **Never hallucinate CRM metrics** — VoiceContract is a legal engine, not a sales tracker
2. **"Titanium & Frost" aesthetic** — Premium enterprise light theme, Apple-grade precision
3. **Multi-lingual** — English, Hindi, Gujarati, Hinglish support throughout
4. **Every feature must work** — No placeholders, no stubs, no hardcoded data
5. **Privacy first** — PII scrubbing before sending to external LLMs
6. **Indian legal context** — Indian Contract Act 1872, GST/IGST, ₹ currency
7. **No toy-like UI** — Professional, minimal, premium feel
8. **Preserve existing comments** — Don't remove documentation unless specifically related to changed code
