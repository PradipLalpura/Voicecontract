# VoiceContract — All 8 CLI Prompts
> Copy-paste ready. 2 prompts per CLI. Run Prompt 1 first, wait for confirmation, then Prompt 2.

---

# ═══════════════════════════════════════
# GEMINI CLI — PROMPT 1 (Understanding)
# ═══════════════════════════════════════

```
You are the lead frontend engineer and orchestrator for VoiceContract — a project being built for the Outskill x OpenAI AI Builders Hackathon.

Read and deeply understand everything below before responding.

━━━ WHAT WE ARE BUILDING ━━━
VoiceContract is an AI agent system that listens to a client meeting recording, understands everything verbally agreed upon, and automatically generates a contract, GST invoice, and purchase order — within 60 seconds of the call ending.

The pipeline has 4 agents running in sequence:
1. AGENT 1 — Groq Whisper: converts audio file to transcript text
2. AGENT 2 — Kimi K2.6 via NVIDIA NIM: extracts 8 deal terms from transcript, runs gap analysis on missing terms
3. AGENT 3 — OpenAI GPT-4o (Codex): generates legally structured contract clauses from deal terms
4. AGENT 4 — pdfkit Python: assembles final PDF (no AI, just formatting)

━━━ YOUR ROLE ━━━
You are responsible for:
- Building the entire Next.js 14 frontend (TypeScript + Tailwind + shadcn/ui)
- Acting as orchestrator — after Kimi and DeepSeek finish, you review, merge, and integrate all outputs
- Maintaining CONTEXT.md as shared brain
- Final deployment to Vercel

━━━ TECH STACK ━━━
Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
Backend: FastAPI Python (built by DeepSeek, runs on Railway)
DB: Supabase
Design: Dark theme, #0a0a0a bg, #111111 cards, #22c55e green accent
Skills: Use @frontend-design for UI decisions, @architecture for structure, @api-design-principles for API contracts, impeccable /craft for quality

━━━ FOLDER OWNERSHIP ━━━
You build ONLY in: /frontend/
You DO NOT touch: /backend/ or /prompts/
Shared file you read AND update: /CONTEXT.md

━━━ CONTEXT.md RULES ━━━
- Read CONTEXT.md at the start of every task
- Update CONTEXT.md when you complete each task
- Mark phases complete in CONTEXT.md checklist
- Document every decision you make in CONTEXT.md

━━━ CONFIRM UNDERSTANDING ━━━
Answer these before writing any code:
1. What does VoiceContract do in one sentence?
2. What are the 4 agents and what does each one do?
3. What folders do you own vs what do other agents own?
4. What is CONTEXT.md and why does it matter?
5. What skills will you use and when?
6. What API endpoints will the frontend call? (list all 4)
```

---

# ═══════════════════════════════════════
# GEMINI CLI — PROMPT 2 (Build Frontend)
# ═══════════════════════════════════════

```
Good. Now build the complete Next.js frontend for VoiceContract.

First read CONTEXT.md from the GitHub repo to get current state.
Then execute everything below completely.

━━━ SETUP COMMANDS ━━━
Run these first:
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --yes
npx shadcn@latest init --defaults
npm install lucide-react

━━━ DESIGN SYSTEM ━━━
Apply these exact values in tailwind.config.ts and globals.css:
Background: #0a0a0a
Surface/Cards: #111111  
Border: #1f1f1f
Text primary: #f5f5f5
Text muted: #888888
Accent green: #22c55e
Warning amber: #f59e0b
Error red: #ef4444
Font: Inter (system stack)
Border radius: 12px for cards, 8px for inputs
Use @frontend-design skill for all spacing and hierarchy decisions.

━━━ FILES TO CREATE ━━━

1. app/page.tsx — UPLOAD PAGE
- Hero: "Client call ends. Contract is ready." with green accent on "Contract is ready"
- Company info form (shown first time, stored in localStorage):
  Fields: Company Name, Your Name, GST Number, Address
  "Save & Continue" button
- Audio upload section:
  Drag and drop zone — accepts MP3, WAV, M4A, MP4
  File size limit display: "Max 25MB"
  Show selected filename after pick
  "Process Meeting" CTA button (green, full width)
- On submit: POST to /api/transcribe with FormData
  Navigate to /processing after submit
- Apply @frontend-design skill for layout hierarchy

2. app/processing/page.tsx — AGENT STATUS PAGE
- Show 4 steps as a vertical stepper:
  Step 1: "Transcribing Audio" — Groq Whisper
  Step 2: "Extracting Deal Terms" — Kimi K2.6
  Step 3: "Generating Contract" — OpenAI Codex
  Step 4: "Building PDF" — Document Assembly
- Each step has: icon, title, subtitle (model name), status
- Status states: waiting (grey) / active (green spinner) / done (green checkmark) / error (red)
- Animate current step with subtle pulse
- Poll /api/status every 2 seconds OR use the processing flow directly
- On complete: navigate to /result with contract data

3. app/result/page.tsx — CONTRACT PREVIEW + DOWNLOAD
- Left panel: Contract text preview (scrollable, monospace-ish, clean)
- Right panel (or top on mobile): 
  - GapAlert component (if gaps exist)
  - Company details summary
  - "Download PDF" button (green, prominent)
  - "Start New" button (ghost)

4. components/AudioUploader.tsx
- Drag and drop with dashed border
- Border turns green on drag-over
- File type validation client-side
- File size validation client-side (25MB max)
- Clear error messages: "Only MP3, WAV, M4A files accepted"
- Apply @frontend-design skill: 44px min touch targets, clear states

5. components/ProcessingStatus.tsx
- Stepper component with 4 steps
- Props: currentStep (0-3), steps (array of step objects), error (optional)
- Smooth transitions between states
- Show time elapsed

6. components/GapAlert.tsx
- Props: gaps (array of {field, warning, default_value})
- Amber warning card design
- Each gap shows: field name, warning message, default being used
- Collapsible — show/hide individual gaps
- Title: "⚠️ 3 terms were not discussed in your call"

7. components/ContractPreview.tsx
- Full contract text in readable format
- Section headings bold
- Clean white-on-dark text
- Copy to clipboard button
- Word count display

8. components/CompanyForm.tsx
- Fields: companyName, yourName, gstNumber, address
- Stores to localStorage on save
- Loads from localStorage on mount
- Simple validation — all fields required

9. lib/api.ts
- Base URL from process.env.NEXT_PUBLIC_API_URL
- function transcribeAudio(file: File, companyDetails: object): Promise
- function extractTerms(transcript: string): Promise
- function generateContract(terms: object, gaps: array): Promise
- function downloadPDF(contract: string, companyDetails: object): Promise
- All functions: proper TypeScript types, error handling, timeout 60s

10. lib/types.ts
- DealTerms interface (8 fields, all string | null)
- Gap interface {field, warning, default_value}
- ProcessingState interface
- CompanyDetails interface

━━━ QUALITY REQUIREMENTS ━━━
Use @frontend-design skill: every component has loading, error, empty states
Use impeccable /craft on every page before committing
Mobile responsive — test at 375px mentally
No any types — strict TypeScript
No Lorem ipsum — all copy is real VoiceContract copy
All buttons have disabled state during loading

━━━ AFTER BUILDING ━━━
1. Run: npm run build — fix ALL errors
2. Run impeccable /polish on the result page (most important screen)
3. Commit to GitHub: git add . && git commit -m "Phase 1A: Frontend complete — Gemini CLI"
4. Update CONTEXT.md: mark Phase 1A complete, note any decisions made
5. Report back: what you built, any issues, what needs DeepSeek's API to be ready
```

---

# ═══════════════════════════════════════
# OPENCODE KIMI K2.6 — PROMPT 1 (Understanding)
# ═══════════════════════════════════════

```
You are the extraction agent engineer for VoiceContract — a project being built for the Outskill x OpenAI AI Builders Hackathon.

Read and deeply understand everything below before responding.

━━━ WHAT WE ARE BUILDING ━━━
VoiceContract converts client meeting audio into legal documents automatically.

The pipeline:
1. Groq Whisper → raw transcript text
2. YOU BUILD THIS → Kimi K2.6 reads transcript, extracts 8 deal terms, finds gaps
3. GPT-4o → generates contract from extracted terms
4. pdfkit → final PDF

━━━ YOUR ROLE ━━━
You are responsible for:
- Writing the AI prompts that power Agent 2 (extraction + gap analysis)
- Building kimi_agent.py — the Python module that calls Kimi K2.6 via NVIDIA NIM
- These prompts and this agent are the intelligence core of the product

━━━ THE 8 DEAL TERMS ━━━
Every client meeting should cover these. VoiceContract finds them or flags them missing:
1. deliverables — what exactly is being built/delivered
2. price — total project amount in INR
3. timeline — start, end, milestones
4. payment_schedule — advance %, milestone %, final %
5. revisions — how many rounds, what counts as revision
6. ip_ownership — who owns the final work
7. confidentiality — any NDA or secrecy requirements
8. dispute_resolution — what happens if things go wrong

━━━ FOLDER OWNERSHIP ━━━
You build ONLY in: /prompts/ and /backend/agents/kimi_agent.py
You DO NOT touch: /frontend/ or other /backend/ files
Shared file you read AND update: /CONTEXT.md

━━━ SKILLS TO USE ━━━
Use @prompt-engineer skill for writing the extraction and gap prompts
Use @api-design-principles for structuring kimi_agent.py functions
Use @rag-engineer for understanding how to process unstructured transcript text

━━━ CONFIRM UNDERSTANDING ━━━
Answer before writing any code:
1. What are the 8 deal terms VoiceContract extracts?
2. What is gap analysis and why does it matter?
3. What files are you responsible for creating?
4. What is the input and output of kimi_agent.py?
5. What NVIDIA NIM model string will you use for Kimi K2.6?
6. What skills will you use and for which tasks?
```

---

# ═══════════════════════════════════════
# OPENCODE KIMI K2.6 — PROMPT 2 (Build Extraction Agent)
# ═══════════════════════════════════════

```
Good. Now build the complete extraction agent for VoiceContract.

First read CONTEXT.md from the GitHub repo to get current state.
Use @prompt-engineer skill throughout this task.

━━━ FILE 1: prompts/extraction_prompt.md ━━━

Write a production-quality system prompt for Kimi K2.6 that:

PURPOSE: Extract 8 structured deal terms from a raw meeting transcript

MUST HANDLE:
- English, Hindi, Gujarati, and mixed language (Hinglish) transcripts
- Amounts written as "45 hazaar" (45,000 in Hindi) or "pachas hajar" (50,000)
- Dates like "teen hafte mein" (3 weeks), "agle mahine tak" (by next month)
- Vague mentions: "we'll figure out payment later" → capture as-is, not null
- Multiple mentions of same term — use the FINAL agreed value
- Sarcasm or hypotheticals — ignore, only capture real agreements

OUTPUT FORMAT: Return ONLY valid JSON, zero preamble, zero explanation:
{
  "deliverables": "string describing what is being delivered | null",
  "price": "amount in INR as string | null",
  "timeline": "start and end dates or duration | null",
  "payment_schedule": "advance/milestone/final breakdown | null",
  "revisions": "number and definition of revision rounds | null",
  "ip_ownership": "who owns the final work | null",
  "confidentiality": "NDA or secrecy terms | null",
  "dispute_resolution": "what happens if things go wrong | null"
}

Return null ONLY if term was truly never mentioned. If mentioned vaguely, capture the vague mention as a string.

━━━ FILE 2: prompts/gap_analysis_prompt.md ━━━

Write a production-quality system prompt that:

PURPOSE: Analyze extracted terms JSON, identify missing critical terms, suggest Indian freelance defaults

INPUT: The extracted terms JSON from above

FOR EACH NULL FIELD generate:
- warning: conversational, non-legal language explaining why this matters
  Example: "You never discussed who owns the final website files. This can cause serious disputes later."
- default_value: the standard Indian freelance practice for this term
  
INDIAN FREELANCE DEFAULTS (use exactly these):
- payment_schedule: "50% advance before work begins, 50% on final delivery"
- ip_ownership: "Client owns all work and source files upon receipt of full payment"
- revisions: "2 rounds of revisions included. Additional revisions at ₹500 per hour"
- dispute_resolution: "Both parties will attempt resolution through mutual discussion. Governed by Indian Contract Act, 1872. Jurisdiction: [City of Service Provider]"
- confidentiality: "Both parties agree to keep project details, business information, and pricing confidential for 2 years from project end"
- timeline: "Project timeline to be mutually agreed upon in writing within 3 days of contract signing"
- deliverables: "Deliverables to be detailed in a separate Scope of Work document"
- price: "Project fee to be mutually agreed upon and documented before work begins"

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "gaps": [
    {
      "field": "field_name",
      "warning": "human readable warning",
      "default_value": "the Indian standard default"
    }
  ],
  "has_gaps": true/false,
  "gap_count": number
}

━━━ FILE 3: backend/agents/kimi_agent.py ━━━

Build a production Python module using @api-design-principles skill:

```python
# Exact model string for NVIDIA NIM:
MODEL = "moonshotai/kimi-k2-instruct"
NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"
```

FUNCTIONS TO BUILD:

async def extract_terms(transcript: str) -> dict:
    """
    Extract 8 deal terms from meeting transcript using Kimi K2.6.
    
    Args:
        transcript: Raw meeting transcript text (any language)
    Returns:
        dict with 8 fields (deliverables, price, timeline, etc.) — null if not found
    Raises:
        ExtractionError: if NIM call fails after retries
    """

async def analyze_gaps(terms: dict) -> dict:
    """
    Identify missing deal terms and suggest Indian freelance defaults.
    
    Args:
        terms: Extracted terms dict from extract_terms()
    Returns:
        dict with gaps array, has_gaps bool, gap_count int
    """

async def process_transcript(transcript: str) -> dict:
    """
    Full pipeline: extract terms then analyze gaps.
    
    Args:
        transcript: Raw meeting transcript
    Returns:
        {
            "terms": {...8 deal terms...},
            "gaps": [...gap objects...],
            "has_gaps": bool,
            "gap_count": int
        }
    """

IMPLEMENTATION REQUIREMENTS:
- Use httpx (async) for HTTP calls, NOT requests
- Load prompts from /prompts/extraction_prompt.md and /prompts/gap_analysis_prompt.md at startup
- Retry: 3 attempts, 5 second exponential backoff on 429 or 500
- Timeout: 45 seconds per call (NIM can be slow)
- Parse JSON response safely — handle malformed JSON with fallback
- Log every call: model, prompt length, response time, success/fail
- Custom exception class: ExtractionError(message, original_error)
- Temperature: 0.1 for extraction (deterministic), 0.2 for gap analysis
- Max tokens: 1000 for extraction, 1500 for gap analysis

━━━ AFTER BUILDING ━━━
1. Test the prompts mentally — paste a sample transcript and trace through what Kimi would return
2. Commit: git add . && git commit -m "Phase 1B: Extraction agent complete — Kimi K2.6"
3. Update CONTEXT.md: mark Phase 1B complete, document exact input/output format of process_transcript()
4. Report back: the exact JSON schema that kimi_agent.process_transcript() returns (DeepSeek needs this)
```

---

# ═══════════════════════════════════════
# OPENCODE DEEPSEEK V4 PRO — PROMPT 1 (Understanding)
# ═══════════════════════════════════════

```
You are the backend engineer for VoiceContract — a project being built for the Outskill x OpenAI AI Builders Hackathon.

Read and deeply understand everything below before responding.

━━━ WHAT WE ARE BUILDING ━━━
VoiceContract converts client meeting audio into legal documents automatically.

Pipeline:
1. Groq Whisper (YOU build the agent that calls it) → transcript
2. Kimi K2.6 via NIM (Kimi builds this agent) → deal terms + gaps
3. OpenAI GPT-4o (YOU build the stub + final integration) → contract text
4. pdfkit (YOU build this) → PDF bytes

━━━ YOUR ROLE ━━━
You are responsible for:
- Complete FastAPI backend — all routes, all middleware, all config
- whisper_agent.py — calls Groq API for transcription
- codex_agent.py — calls OpenAI GPT-4o for contract generation
- pdf_agent.py — generates PDF using pdfkit (NO AI, just formatting)
- groq_client.py — reusable Groq API client
- Supabase integration for document storage
- requirements.txt and all Python dependencies

━━━ FOLDER OWNERSHIP ━━━
You build ONLY in: /backend/
Exception: kimi_agent.py is built by Kimi — do NOT create or modify it
Shared file you read AND update: /CONTEXT.md

━━━ SKILLS TO USE ━━━
Use @architecture skill for FastAPI structure and layer separation
Use @api-design-principles for endpoint design and response formats
Use @security-auditor for input validation and rate limiting
Use @python-patterns for clean Python code
Use @docker-expert for Railway deployment config

━━━ CONFIRM UNDERSTANDING ━━━
Answer before writing any code:
1. What are the 4 API endpoints and what does each do?
2. What is whisper_agent.py's job and which API does it call?
3. What is codex_agent.py's job and which API does it call?
4. What does pdf_agent.py do and does it use any AI?
5. Which file does Kimi build that you must NOT touch?
6. What environment variables will the backend need?
```

---

# ═══════════════════════════════════════
# OPENCODE DEEPSEEK V4 PRO — PROMPT 2 (Build Backend)
# ═══════════════════════════════════════

```
Good. Now build the complete FastAPI backend for VoiceContract.

First read CONTEXT.md from the GitHub repo to get current state.
Use @architecture, @security-auditor, and @python-patterns skills throughout.

━━━ ALL FILES TO CREATE in /backend/ ━━━

━━━ requirements.txt ━━━
Include exact pinned versions:
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
python-multipart>=0.0.12
httpx>=0.28.0
pdfkit>=1.0.0
supabase>=2.10.0
python-dotenv>=1.0.0
pydantic>=2.0.0
aiofiles>=24.0.0

━━━ main.py ━━━
Use @architecture skill for structure:
- FastAPI app with title "VoiceContract API" version "1.0.0"
- CORS: allow all origins (localhost + production Vercel URL)
- Include all 4 routers with /api prefix
- GET /health → {"status": "ok", "version": "1.0.0", "timestamp": ISO string}
- Global exception handler → {"error": message, "detail": details} with correct status codes
- Logging: INFO level, format: "%(asctime)s — %(name)s — %(levelname)s — %(message)s"
- Startup event: verify all env vars present, log which ones are missing

━━━ routers/transcribe.py ━━━
Use @security-auditor skill for validation:
POST /api/transcribe
- Accept: multipart/form-data with fields: audio_file (UploadFile), company_name (str), your_name (str)
- Validate file type: only audio/mpeg, audio/wav, audio/x-m4a, audio/mp4, video/mp4
- Validate file size: reject if > 25MB (25 * 1024 * 1024 bytes)
- Call whisper_agent.transcribe()
- Return: {"transcript": str, "duration_seconds": float, "detected_language": str}
- Error 400: wrong file type with message "Accepted formats: MP3, WAV, M4A"
- Error 413: file too large
- Error 500: transcription failed

━━━ routers/extract.py ━━━
POST /api/extract
- Accept: {"transcript": str}
- Validate: transcript not empty, minimum 50 characters
- Call kimi_agent.process_transcript() — import from agents.kimi_agent
- Return the full result from kimi_agent (terms + gaps + has_gaps + gap_count)
- Error 400: transcript too short
- Error 500: extraction failed with retry suggestion

━━━ routers/generate.py ━━━
POST /api/generate
- Accept: {"terms": dict, "gaps": list, "company_details": dict}
- company_details shape: {company_name, your_name, gst_number, address}
- Validate: terms not empty dict
- Call codex_agent.generate_contract()
- Return: {"contract": str, "word_count": int, "sections": list[str]}
- Error 400: invalid terms format
- Error 500: generation failed

━━━ routers/documents.py ━━━
POST /api/pdf
- Accept: {"contract": str, "company_details": dict}
- Call pdf_agent.create_pdf()
- Return: PDF bytes with headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="voicecontract_{timestamp}.pdf"
- Error 500: PDF generation failed

━━━ agents/whisper_agent.py ━━━
GROQ API for transcription — FREE:
- Model: "whisper-large-v3-turbo"
- Base URL: https://api.groq.com/openai/v1/audio/transcriptions
- API Key: GROQ_API_KEY env var
- Function: async def transcribe(audio_bytes: bytes, filename: str, file_content_type: str) -> dict
- Returns: {"text": str, "duration": float, "language": str}
- Use httpx async client
- Timeout: 60 seconds
- Retry: 2 attempts on failure
- Log: file size, duration, detected language

━━━ agents/codex_agent.py ━━━
OpenAI GPT-4o for contract generation:
- Model: "gpt-4o-mini" (cheapest, sufficient quality)
- API Key: OPENAI_API_KEY env var
- Load contract prompt from /prompts/contract_prompt.md at startup
- Function: async def generate_contract(terms: dict, gaps: list, company_details: dict) -> dict

CONTRACT PROMPT LOGIC:
The system prompt (in contract_prompt.md — write this too) must instruct GPT-4o to:
- You are a legal document specialist for Indian freelance contracts
- Generate a complete, professional Service Agreement
- Use Indian Contract Act 1872 as legal basis
- For each term in the input: write a properly structured legal clause
- For each gap: use the provided default_value to write the clause
- Include these sections in order:
  1. PARTIES (from company_details + client name if in terms)
  2. SCOPE OF WORK (from deliverables)
  3. TIMELINE (from timeline)
  4. PAYMENT TERMS (from price + payment_schedule)
  5. REVISION POLICY (from revisions)
  6. INTELLECTUAL PROPERTY (from ip_ownership)
  7. CONFIDENTIALITY (from confidentiality)
  8. DISPUTE RESOLUTION (from dispute_resolution)
  9. GENERAL TERMS (standard boilerplate)
  10. SIGNATURES (blank lines for both parties)
- Output: plain text contract only, no JSON wrapper, no markdown

Function returns: {"contract": str, "sections": list[str]}
- Timeout: 30 seconds
- Temperature: 0.2
- Max tokens: 2000

━━━ agents/pdf_agent.py ━━━
NO AI — just pdfkit formatting:
- Function: def create_pdf(contract: str, company_details: dict) -> bytes

PDF LAYOUT:
- Page size: A4
- Margins: 2.5cm all sides
- Header on page 1: 
  Company name (bold, 16pt)
  "SERVICE AGREEMENT" (bold, 14pt, centered)
  Date: auto-populated today's date
  Horizontal rule
- Body: contract text, 11pt, 1.5 line spacing
- Section headings: bold, 12pt, uppercase
- Footer on every page: "Generated by VoiceContract | Page X of Y | Confidential"
- Use pdfkit.from_string() with HTML input
- Build HTML string from contract text, parse section headings (ALL CAPS lines)
- Return PDF as bytes (do not save to disk)

━━━ lib/groq_client.py ━━━
Reusable Groq API client:
- async def transcribe_audio(audio_bytes, filename, content_type) -> dict
- Handles multipart upload correctly
- Error parsing with meaningful messages
- Rate limit handling: if 429, wait 10 seconds and retry once

━━━ .env.example ━━━
Create with all required variables:
GROQ_API_KEY=gsk_...
NIM_API_KEY=nvapi-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=8000

━━━ Procfile (for Railway) ━━━
web: uvicorn main:app --host 0.0.0.0 --port $PORT

━━━ QUALITY REQUIREMENTS ━━━
Use @security-auditor: validate ALL inputs, no SQL injection vectors, sanitize filenames
Use @python-patterns: type hints on every function, docstrings, no bare except
Zero hardcoded values — everything from environment variables
Every external API call: try/except with specific error messages
Logging on every route: request received, processing time, success/fail

━━━ AFTER BUILDING ━━━
1. Verify: python -m py_compile main.py && python -m py_compile routers/*.py
2. Commit: git add . && git commit -m "Phase 1C: Backend complete — DeepSeek V4 Pro"
3. Update CONTEXT.md: mark Phase 1C complete, document all API request/response formats exactly
4. Report back: list all endpoints with exact request/response schemas so Gemini CLI can wire the frontend
```

---

# ═══════════════════════════════════════
# CODEX CLI — PROMPT 1 (Understanding)
# ═══════════════════════════════════════

```
You are working on VoiceContract — a project for the Outskill x OpenAI AI Builders Hackathon.

VoiceContract converts client meeting audio into legal documents automatically.

The product pipeline:
1. Groq Whisper → transcript
2. Kimi K2.6 → extracted deal terms + gap analysis  
3. YOU → contract generation agent (codex_agent.py)
4. pdfkit → PDF

Your specific job:
- Review and improve backend/agents/codex_agent.py (built by DeepSeek)
- Write the contract generation system prompt in prompts/contract_prompt.md
- Ensure the contract generation produces legally sound, complete Indian freelance contracts
- Test the agent logic and fix any issues

The agent calls OpenAI gpt-4o-mini with a carefully engineered prompt.
The input is: deal terms JSON + company details.
The output is: complete contract text.

Read the full codebase in /backend/ before doing anything.

Confirm you understand:
1. What does codex_agent.py do?
2. What is the input format it receives?
3. What contract sections must the output include?
4. How does it handle gaps (missing deal terms)?
```

---

# ═══════════════════════════════════════
# CODEX CLI — PROMPT 2 (Improve Contract Agent)
# ═══════════════════════════════════════

```
Now improve the contract generation system.

Read /backend/agents/codex_agent.py and /prompts/contract_prompt.md.

Your tasks:

1. IMPROVE THE CONTRACT PROMPT in prompts/contract_prompt.md
   The prompt must produce contracts that:
   - Sound professional but readable (not overly archaic legal language)
   - Are specific — use exact numbers, dates, names from the input
   - Cover all 10 sections: Parties, Scope, Timeline, Payment, Revisions, IP, Confidentiality, Dispute Resolution, General Terms, Signatures
   - For null terms: use the gap defaults provided in the input, note they are standard defaults
   - Follow Indian Contract Act 1872
   - Are appropriate for Indian freelancers charging ₹10k-₹200k per project

2. IMPROVE codex_agent.py
   - Add input validation: reject if terms dict is completely empty
   - Add contract quality check: verify output has all 10 section headings
   - If sections missing: retry once with explicit instruction
   - Add word count validation: contract should be 500-2000 words
   - Improve error messages to be user-friendly

3. WRITE A TEST in backend/test_codex_agent.py
   Create a test with sample input:
   {
     "terms": {
       "deliverables": "5-page business website with contact form and admin panel",
       "price": "45000",
       "timeline": "3 weeks",
       "payment_schedule": null,
       "revisions": "2 rounds",
       "ip_ownership": null,
       "confidentiality": "client business information is confidential",
       "dispute_resolution": null
     },
     "gaps": [
       {"field": "payment_schedule", "warning": "...", "default_value": "50% advance, 50% on delivery"},
       {"field": "ip_ownership", "warning": "...", "default_value": "Client owns upon full payment"},
       {"field": "dispute_resolution", "warning": "...", "default_value": "Indian Contract Act 1872"}
     ],
     "company_details": {
       "company_name": "JPN Studio",
       "your_name": "Pradip Lalpura",
       "gst_number": "24XXXXX",
       "address": "Ahmedabad, Gujarat"
     }
   }
   Run the agent and print the contract.
   Verify all 10 sections present.
   Verify word count is reasonable.

4. RUN THE TEST
   python backend/test_codex_agent.py
   Fix any errors.
   Show the generated contract output.

5. COMMIT
   git add . && git commit -m "Phase 2: Codex contract agent improved and tested"
   Update CONTEXT.md: mark Codex phase complete, paste the sample output contract (first 200 chars)
```

---

## Build Order Summary

```
STEP 1 — Phase 0 (YOU, 15 mins)
  Create GitHub repo, folder structure, CONTEXT.md, push

STEP 2 — Phase 1 PARALLEL (fire all 3 CLIs simultaneously)
  Terminal 1: Gemini CLI → Prompt 1, then Prompt 2
  Terminal 2: OpenCode Kimi → Prompt 1, then Prompt 2
  Terminal 3: OpenCode DeepSeek → Prompt 1, then Prompt 2
  
  All three run at the same time. ~1-2 hours.

STEP 3 — Phase 1 Merge (Gemini CLI)
  Tell Gemini: "Phase 1 is complete. DeepSeek built /backend, 
  Kimi built /prompts and kimi_agent.py. Read CONTEXT.md.
  Wire the frontend API calls to match the backend endpoints exactly.
  Fix any mismatches. Run npm run build. Fix all errors. Commit."

STEP 4 — Phase 2 (Codex CLI)
  Run Codex CLI Prompt 1, then Prompt 2
  Improve and test contract generation

STEP 5 — Phase 3 (Gemini CLI)
  "Full pipeline must work end to end. 
  Start the backend: cd backend && pip install -r requirements.txt && uvicorn main:app
  Start the frontend: cd frontend && npm run dev
  Upload a test audio file. Trace through all 4 agents.
  Fix every error until the full flow works."

STEP 6 — Screenshots + Docs (Gemini CLI)
  "Apply impeccable /polish to all pages.
  Generate 5 screenshots for Wednesday submission.
  Write product_brief.md and investor_pitch.md."
```
