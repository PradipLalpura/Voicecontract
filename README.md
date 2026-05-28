<div align="center">
  <img src="https://raw.githubusercontent.com/PradipLalpura/voicecontract/main/Voicecontract.png" alt="VoiceContract Banner" width="800" style="border-radius: 12px; margin-bottom: 20px;" />
  
  # 🎙️ VoiceContract
  **"The meeting ends. The paperwork is already done."**
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00C2CC?style=for-the-badge)](https://voicecontract.vercel.app/)
  [![Backend Status](https://img.shields.io/badge/Backend-Railway-0F1825?style=for-the-badge&logo=fastapi)](https://voicecontract-production.up.railway.app/health)
  [![License: MIT](https://img.shields.io/badge/License-MIT-E8C547?style=for-the-badge)](https://github.com/PradipLalpura/voicecontract/blob/main/LICENSE)
  [![Built for Builders](https://img.shields.io/badge/Built%20For-Outskill%20x%20OpenAI-7B5CE5?style=for-the-badge)](https://github.com/PradipLalpura/voicecontract)

  ### Transforming spoken client agreements into professional, legally-sound contracts in under 60 seconds.
</div>

---

## 🌌 The Problem
Millions of freelancers and agency owners lose revenue every year because of a critical gap: **The time between a verbal agreement and a signed contract.** 
The friction of drafting paperwork manually leads to work starting without protection, forgotten scope, and painful disputes.

## 🛠️ The Solution: VoiceContract
VoiceContract is an intelligent, agentic AI pipeline that bridges this gap instantly. It doesn't just transcribe; it **reasons**, **analyzes**, and **assembles**.

---

## 📖 How to Use VoiceContract
Follow this simple workflow on **[voicecontract.vercel.app](https://voicecontract.vercel.app/)**:

### 1. Identity & Branding
First, establish your professional identity. Fill in your **Company Name**, **GST Number**, and **Address**. 
- **Pro Tip:** Upload your **Company Logo**. Our engine will inject it into the high-fidelity PDF header automatically.
- **Advanced:** Upload a **Brand DNA Document** (TXT/MD). Our AI (Codex) will analyze your specific tone and legal format to match your brand 1:1.

### 2. Transmission
Record your client meeting (Zoom, Google Meet, or In-Person). Once finished, upload the audio file (MP3/WAV, up to 25MB) directly to the dashboard. 

### 3. The 60-Second Pipeline
Watch as our four specialized agents process your agreement in real-time:
*   **Agent 1 (Whisper):** Transcribes the conversation with blazing speed.
*   **Agent 2 (Llama 3.3 70B):** Extracts 8 critical deal terms (Scope, Price, etc.).
*   **Agent 3 (GPT-4o / Codex):** Generates legally-sound clauses based on the conversation context.
*   **Agent 4 (FPDF):** Assembles your professional PDF.

### 4. Review & Sign
Review the **Gap Alerts** (terms you forgot to discuss). The system automatically applies protective Indian freelance defaults. Download your polished **Service Agreement** and send it for signature.

---

## 📂 Project Structure
A professional map for judges and contributors:
```text
voicecontract/
├── .github/          # Automated CI/CD (GitHub Actions)
├── backend/          # FastAPI Python Server
│   ├── agents/       # AI Brains (Whisper, Llama, Codex, PDF)
│   ├── routers/      # API Endpoints & Logic
│   └── models.py     # Strict Pydantic Data Schemas
├── frontend/         # Next.js 14 Web Application
│   ├── app/          # App Router (Home, Processing, Result)
│   ├── components/   # Atomic UI (Form, Uploader, Alerts)
│   └── lib/          # API Clients & Types
├── prompts/          # Engineered System Instructions
└── LICENSE           # MIT Open Source License
```

---

## 🚀 Technical Excellence
- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui.
- **Backend:** FastAPI (Python 3.11).
- **Intelligence:** Groq (Whisper/Llama 3.3), OpenAI GPT-4o (GitHub Models).
- **Security:** Triple-layer fallback, Pydantic validation, and zero-storage local-first design.

---

<div align="center">
  <b>VoiceContract</b> — Where your brand lives online. 
  <br />
  Built by <b>Pradip Lalpura</b> | Antarik - a JPN STUDIO brand
</div>
