# 🎙️ VoiceContract: Autonomous Legal Grid

**Bridging the fatal gap between verbal agreements and signed contracts.**

Built for the **Antarik X Outskill AI Buildathon**, VoiceContract is an elite, AI-first ecosystem that transforms conversational intent into cryptographically secured, boardroom-ready legal instruments in real-time.

---

## 🚀 The Vision
Freelancers and agencies lose millions every year to "unwritten scope." You agree on a price and timeline on a call, but the contract never follows. Two weeks later, scope creep hits, and you have nothing in writing.

**VoiceContract fixes this.** Our engine intercepts your meetings (Live or Recorded), extracts the core logic, validates legal safety, and mints a professional **Legal Trinity (MSA, Invoice, PO)** before you even hang up.

---

## 🧠 The Smartest Brain (Multi-Agent Architecture)
We don't just transcribe; we **reason**. Our backend is powered by a high-fidelity LangGraph pipeline:

1.  **Acoustic Interceptor (Whisper-v3):** Natively understands English, Hindi, Gujarati, and Hinglish nuances.
2.  **Logic Extractor (Llama-3.3-70B):** Distinguishes banter from binding commitments.
3.  **The Strategist (Amigo):** An optional live coach providing real-time psychological cues and negotiation tactics.
4.  **The Sentinel:** Cross-checks extracted terms against the Indian Contract Act and your specific **Brand DNA**.
5.  **Master Drafter:** Mints boardroom-ready HTML documents styled with your brand's unique colors and tone.

---

## ✨ Features
- **Hyper-Realistic 3D Dashboard:** A premium, "Titanium & Frost" interface built with React Three Fiber and GSAP.
- **Brand DNA Identity:** Captures your company logo, GST, and legal style during onboarding to personalize every document.
- **Hybrid Local Transcription:** Guaranteed visual feedback during demos using browser-native SpeechRecognition fallbacks.
- **Zero-Storage Ephemeral Signatures:** Dual E-signatures lock the PDF cryptographically and vanish from memory instantly.
- **Multi-Channel Dispatch:** One-click execution sends secure signing links via WhatsApp and Email.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS v4, Framer Motion, Three.js, GSAP.
- **Backend:** FastAPI (Python), LangChain, Groq (Llama-3.3), OpenAI (Whisper-v3).
- **Database:** Supabase (PostgreSQL) with strict RLS policies.
- **Auth:** Clerk.

---

## 🚦 Quick Start

### 1. Grid Initialization (Backend)
```bash
# Setup environment
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Start the neural grid
python run.py
```

### 2. Atmospheric Stage (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables
Create a `.env` in the root:
```env
GROQ_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
CAPTURE_SHARED_SECRET=your_secret
```

---

## 🛸 The Result
VoiceContract isn't just an MVP; it's a structural shift in how we handle agreements. It moves legal logic from "Post-Meeting Overhead" to "Live Meeting Automation."

**Talk. Audit. Mint. Seal.** 🛡️🚀
