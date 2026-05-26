<div align="center">
  <img src="https://raw.githubusercontent.com/PradipLalpura/voicecontract/main/frontend/public/logo-placeholder.png" alt="VoiceContract Logo" width="120" />
  
  # 🎙️ VoiceContract
  **"Where your brand lives online. The meeting ends. The paperwork is already done."**
  
  [![Outskill x OpenAI](https://img.shields.io/badge/Hackathon-Outskill%20x%20OpenAI-00C2CC?style=for-the-badge&logo=openai)](https://github.com/PradipLalpura/voicecontract)
  [![Next.js 14](https://img.shields.io/badge/Next.js%2014-080E1A?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0F1825?style=for-the-badge&logo=fastapi&logoColor=00C2CC)](https://fastapi.tiangolo.com/)
  [![Antarik DNA](https://img.shields.io/badge/Design-Antarik%20DNA-7B5CE5?style=for-the-badge)](https://github.com/PradipLalpura/voicecontract)

  ### Spoken client agreements to professional legal contracts in 60 seconds.
</div>

---

## 🌌 The Vision
Every day, freelancers and agencies lose money and face disputes because the gap between a "verbal agreement" and a "signed contract" is too wide. **VoiceContract** bridges that gap. It is an agentic AI pipeline that listens to your client meetings, extracts the binding terms, catches missing legal gaps, and generates a structured Service Agreement, GST Invoice, and Purchase Order — ready to send before the call even ends.

## 🧠 The Agentic Pipeline
VoiceContract uses a high-speed, 4-agent parallel architecture designed for precision and reliability:

1.  **Agent 1 (Groq Whisper):** Transcribes high-fidelity meeting audio to text with blazing speed.
2.  **Agent 2 (Llama 3.3 70B):** Extracts 8 specific deal terms and performs a comprehensive **Gap Analysis** to identify missing critical clauses.
3.  **Agent 3 (OpenAI GPT-4o / Codex):** The reasoning engine. Generates legally-sound clauses based on the Indian Contract Act, 1872, adapting to your brand's specific DNA.
4.  **Agent 4 (fpdf2):** A deterministic assembly engine that formats the final PDF with your logo and professional branding.

## ✨ The Antarik Experience
Designed with the **Antarik Brand DNA**, VoiceContract follows the "Atmosphere Before Dawn" aesthetic:
- **Void & Starlight:** A deep, professional dark theme that removes noise and focuses on the signal.
- **Signal Cyan:** High-precision accents for clear user pathways.
- **Editorial Typography:** Authoritative serif headlines paired with clean, functional body text.

## 🛡️ Hackathon Perfection
*   **Codex Integration:** We used Codex (OpenAI GPT-4o) as the primary legal reasoning engine, capable of complex multi-clause generation and logical mapping.
*   **Triple-Layer Fallback:** Built with extreme reliability. If one provider fails, the system automatically routes through fallbacks to ensure the 60-second delivery promise is never broken.
*   **Pydantic Security:** Every byte of data is strictly validated and sanitized to ensure a hack-proof, production-ready environment.

## 🚀 Technical Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** FastAPI (Python 3.11).
- **Inference:** Groq (Whisper-large-v3-turbo, Llama-3.3-70b-versatile), GitHub Models (GPT-4o).
- **PDF Engine:** fpdf2 (Pure Python).

---

<div align="center">
  Built for the <b>Outskill x OpenAI AI Builders Hackathon</b> by <b>Pradip Lalpura | JPN Studio / Antarik</b>
</div>
