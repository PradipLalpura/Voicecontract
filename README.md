<div align="center">
  <img src="https://raw.githubusercontent.com/PradipLalpura/voicecontract/main/Voicecontract.png" alt="VoiceContract Banner" width="800" style="border-radius: 12px; margin-bottom: 20px;" />
  
  # 🎙️ VoiceContract
  **"The meeting ends. The paperwork is already done."**
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00C2CC?style=for-the-badge)](https://voicecontract-fsnrozj2g-pradiplalpuras-projects.vercel.app/)
  [![Backend Status](https://img.shields.io/badge/Backend-Railway-0F1825?style=for-the-badge&logo=fastapi)](https://voicecontract-production.up.railway.app/health)
  [![Built for Builders](https://img.shields.io/badge/Built%20For-Outskill%20x%20OpenAI-7B5CE5?style=for-the-badge)](https://github.com/PradipLalpura/voicecontract)

  ### Transforming spoken client agreements into professional, legally-sound contracts in under 60 seconds.
</div>

---

## 🌌 The Problem
Millions of freelancers and agency owners lose revenue every year because of a critical gap: **The time between a verbal agreement and a signed contract.** 
- Clients forget details. 
- Deadlines shift. 
- "That's not what we agreed on" becomes a project-killing phrase.
The friction of drafting paperwork manually often leads to work starting without protection.

## 🛠️ The Solution: VoiceContract MVP
VoiceContract is an intelligent, agent-driven pipeline that bridges this gap instantly. It doesn't just transcribe; it **reasons**.

### **The Intelligent Pipeline**
1.  **High-Speed Transcription:** Powered by **Groq Whisper**, converting meeting recordings to text with near-zero latency.
2.  **Autonomous Extraction:** A **70B parameter LLM** scans the transcript to extract 8 critical deal terms (Scope, Price, Timeline, IP, etc.).
3.  **Legal Gap Analysis:** The system identifies what you *didn't* discuss and automatically applies standard protective defaults.
4.  **Codex-Driven Drafting:** Using **OpenAI GPT-4o**, the engine drafts a custom Service Agreement tailored to the specific context of your conversation.
5.  **Instant Assembly:** A pure Python engine generates a high-fidelity PDF with your branding, ready for signatures.

---

## ⚡ Key MVP Features
- **Personalized Branding:** Upload your company logo once; it appears on every generated document and in the app preview.
- **Brand DNA Integration:** Upload your own contract format or brand guidelines. Our AI adopts your specific tone and legal structure automatically.
- **Indian Contract Act Compliance:** Generated clauses are structured to meet professional standards for service providers in India.
- **60-Second Turnaround:** From audio upload to final PDF in less than a minute.

---

## 📖 How to Use VoiceContract
Experience the future of freelance paperwork in three simple steps:

1.  **Establish Your Identity:**
    Fill in your company name, GST number, and address. Upload your logo to ensure every contract looks like it came from your office.
2.  **Upload Your Meeting:**
    Drop an MP3 or WAV recording of your client call (up to 25MB). 
3.  **Review & Download:**
    Watch the real-time pipeline status. Review the **Gap Alerts** for terms you missed during the call, preview your contract, and hit **Download PDF**.

---

## 🚀 Technical Excellence
- **Frontend:** Next.js 14 App Router (Tailwind CSS + shadcn/ui)
- **Backend:** FastAPI (Python 3.11)
- **Intelligence:** Groq (Whisper/Llama 3.3), OpenAI GPT-4o (GitHub Models)
- **Architecture:** Multi-agent sequential pipeline with triple-layer failure recovery.

---

<div align="center">
  <b>VoiceContract</b> — Where your brand lives online. 
  <br />
  Built by <b>Pradip Lalpura</b> | JPN Studio / Antarik
</div>
