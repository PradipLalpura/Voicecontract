# VoiceContract — Build Workflow & Parallel Execution Plan
> Outskill x OpenAI AI Builders Hackathon | Builder: Pradip Lalpura
> Last updated: Phase 0 | 26 May 2026

---

## The System — 3 Workers, 1 Brain, Parallel Execution

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   GEMINI CLI    │   │  OPENCODE #1    │   │  OPENCODE #2    │
│  Gemini 2.5 Pro │   │   Kimi K2.6     │   │ DeepSeek V4 Pro │
│                 │   │                 │   │                 │
│  Frontend       │   │  Agent Prompts  │   │  Backend APIs   │
│  Orchestrator   │   │  kimi_agent.py  │   │  FastAPI        │
│  Integration    │   │  Extraction     │   │  PDF + DB       │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                         GITHUB REPO
                        (shared brain)
                         CONTEXT.md
```

---

## Skills Installation — Do This First

### For Gemini CLI
```bash
npx antigravity-awesome-skills --gemini
# Installs to ~/.gemini/skills/
# Also install impeccable:
# Follow https://github.com/pbakaus/impeccable for gemini setup
```

### For OpenCode (both instances)
```bash
npx antigravity-awesome-skills --path .agents/skills
# Installs to .agents/skills/ in project root
# Both OpenCode instances share this
```

### Skills to use per agent:
- Gemini CLI: `@architecture` `@frontend-design` `@api-design-principles` `@doc-coauthoring` + impeccable `/craft` `/polish`
- Kimi OpenCode: `@brainstorming` `@prompt-engineer` `@api-design-principles` `@rag-engineer`
- DeepSeek OpenCode: `@architecture` `@api-design-principles` `@security-auditor` `@python-patterns` `@docker-expert`

---

## Folder Structure — Who Owns What

```
voicecontract/                    ← GitHub repo root
├── frontend/                     ← GEMINI CLI OWNS THIS
│   ├── app/
│   │   ├── page.tsx              ← Upload page
│   │   ├── processing/page.tsx   ← Agent status page
│   │   └── result/page.tsx       ← Contract + download
│   ├── components/
│   │   ├── AudioUploader.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── GapAlert.tsx
│   │   ├── ContractPreview.tsx
│   │   └── CompanyForm.tsx
│   └── lib/api.ts
│
├── backend/                      ← DEEPSEEK OWNS THIS
│   ├── main.py
│   ├── routers/
│   │   ├── transcribe.py
│   │   ├── extract.py
│   │   ├── generate.py
│   │   └── documents.py
│   ├── agents/
│   │   ├── whisper_agent.py      ← calls Groq API
│   │   ├── kimi_agent.py         ← KIMI WRITES THIS
│   │   ├── codex_agent.py        ← calls OpenAI GPT-4o
│   │   └── pdf_agent.py          ← pdfkit, no AI
│   ├── lib/
│   │   └── groq_client.py
│   └── requirements.txt
│
├── prompts/                      ← KIMI OWNS THIS
│   ├── extraction_prompt.md
│   ├── gap_analysis_prompt.md
│   └── contract_prompt.md
│
├── CONTEXT.md                    ← SHARED BRAIN — all read/write
├── IDEATION.md                   ← Reference
└── WORKFLOW.md                   ← This file

```

---

## CONTEXT.md — Shared Brain Template

Copy this exactly into your CONTEXT.md in the repo root:

```markdown
# VoiceContract — Shared Brain (CONTEXT.md)
> All agents read this before starting. All agents update this when done.

## What We Are Building
VoiceContract: client meeting audio → contract + invoice + PDF in 60 seconds.
Multi-agent pipeline: Groq Whisper → Kimi K2.6 → GPT-4o (Codex) → pdfkit

## Tech Stack
Frontend:      Next.js 14 + Tailwind + shadcn/ui → Vercel
Backend:       FastAPI Python → Railway
Transcription: Groq API (whisper-large-v3-turbo) FREE
Extraction:    Kimi K2.6 via NVIDIA NIM (moonshotai/kimi-k2-instruct) FREE
Contract Gen:  OpenAI GPT-4o via API ($5 free credits)
PDF:           pdfkit Python library FREE
DB:            Supabase FREE

## API Contracts
POST /api/transcribe  → {transcript: string, duration: number}
POST /api/extract     → {terms: object, gaps: array, has_gaps: bool}
POST /api/generate    → {contract: string}
POST /api/pdf         → PDF bytes

## Environment Variables Needed
GROQ_API_KEY=gsk_...
NIM_API_KEY=nvapi-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000

## Phases Completed
- [ ] Phase 0: Repo + CONTEXT.md + folder structure
- [ ] Phase 1A: Frontend shell (Gemini)
- [ ] Phase 1B: Agent prompts (Kimi)
- [ ] Phase 1C: Backend structure (DeepSeek)
- [ ] Phase 2: Integration — full pipeline working
- [ ] Phase 3: Company format + Gap Alert UI
- [ ] Phase 4: MVP polish + screenshots
- [ ] Phase 5: Deploy

## Decisions Made
[Updated after each phase]

## Current Blockers
[Updated in real time]
```

---

## Phase 0 — Setup (You Do This Now, 10 mins)

```bash
# 1. Create GitHub repo named "voicecontract" — public
# Go to github.com → New repository → voicecontract → public → Create

# 2. Clone locally
git clone https://github.com/YOUR_USERNAME/voicecontract
cd voicecontract

# 3. Create folder structure
mkdir -p frontend backend/routers backend/agents backend/lib prompts outputs

# 4. Create .env.example
cat > .env.example << 'EOF'
GROQ_API_KEY=gsk_...
NIM_API_KEY=nvapi-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000
PORT=8000
EOF

# 5. Create .gitignore
cat > .gitignore << 'EOF'
.env
.env.local
node_modules/
__pycache__/
.next/
*.pyc
.venv/
venv/
EOF

# 6. Create empty CONTEXT.md (paste the template above)
touch CONTEXT.md

# 7. Install skills for OpenCode
npx antigravity-awesome-skills --path .agents/skills

# 8. First commit
git add .
git commit -m "Phase 0: VoiceContract initialized"
git push origin main
```

---

## MCP Setup

### Gemini CLI (~/.gemini/settings.json)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/full/path/to/voicecontract"]
    }
  }
}
```

### OpenCode (~/.opencode/config.json OR project .opencode/config.json)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/full/path/to/voicecontract"]
    }
  }
}
```

---

## Daily Build Schedule

```
TODAY 26 May — 3:30 PM onwards
  3:30 PM  Phase 0: repo + structure done (you)
  4:00 PM  All 3 CLIs fire simultaneously (Phase 1 parallel)
  6:30 PM  Gemini CLI merges all outputs
  7:00 PM  Phase 2: full pipeline wiring
  9:00 PM  Phase 3: company format + gap alert
  10:30 PM Phase 4: UI polish + screenshots
  11:30 PM All 4 Wednesday docs written

TOMORROW 27 May — morning
  9:00 AM  Final bug fixes
  10:00 AM Practice demo once
  Show time
```

---

## Emergency Protocols

```
NIM is slow/down      → Use Groq for Kimi too (Groq has Llama 70B free)
OpenAI credits gone   → Use Groq Llama 3.3 70B as contract agent (free)
Railway deploy fails  → Run backend locally, expose via ngrok for demo
Vercel deploy fails   → Run frontend locally on localhost:3000 for demo
Wednesday deadline    → Ship frontend-only with mocked responses if needed
```
