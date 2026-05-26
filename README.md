# VoiceContract

**Outskill x OpenAI AI Builders Hackathon**

VoiceContract is an AI agent system that listens to a client meeting recording, understands everything verbally agreed upon, and automatically generates a contract, GST invoice, and purchase order — within 60 seconds of the call ending.

## The Pipeline

VoiceContract uses a multi-agent architecture:
1. **Transcription:** Groq Whisper (`whisper-large-v3-turbo`)
2. **Extraction & Gap Analysis:** Gemini 2.0 Flash
3. **Legal Reasoning (Contract Generation):** OpenAI GPT-4o-mini (via GitHub Models)
4. **Document Formatting:** pdfkit

## Tech Stack
* **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui
* **Backend:** FastAPI (Python)
* **Database:** localStorage (MVP) / Supabase

*The meeting ends. The paperwork is already done.*
