# VoiceContract — Shared Brain (CONTEXT.md)
> All agents read this before starting. All agents update this when done.

## What We Are Building
VoiceContract: client meeting audio → contract + invoice + PDF in 60 seconds.
Multi-agent pipeline: Groq Whisper → Gemini 2.0 Flash → GPT-4o (GitHub) → pdfkit

## Tech Stack
Frontend:      Next.js 14 + Tailwind + shadcn/ui → Vercel
Backend:       FastAPI Python → Railway
Transcription: Groq API (whisper-large-v3-turbo)
Extraction:    Gemini 2.0 Flash (strict JSON extraction)
Contract Gen:  GPT-4o via GitHub Models (Legal reasoning)
PDF:           pdfkit Python library
DB:            localStorage (MVP) / Supabase (Optional)

## API Contracts
POST /api/transcribe  → {transcript: string, duration: number, language: string}
POST /api/extract     → {terms: object, gaps: array, has_gaps: bool, gap_count: number}
POST /api/generate    → {contract: string, word_count: number}
POST /api/pdf         → PDF bytes (application/pdf)

## Environment Variables Needed
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
GITHUB_TOKEN=...
NEXT_PUBLIC_API_URL=http://localhost:8000

## Phases Completed
- [x] Phase 0: Repo + CONTEXT.md + folder structure
- [x] Phase 1: Engine Build (In Progress)
  - [x] Agent 1: Whisper (Groq)
  - [x] Agent 2: Extraction (Gemini)
  - [x] Agent 3: Contract (GPT-4o)
  - [x] Agent 4: PDF (pdfkit)
  - [x] FastAPI Routes & Security
- [x] Phase 2: Frontend Build
- [x] Phase 3: Integration & Deploy

## Decisions Made
- Shifted from NVIDIA NIM to Gemini Flash for faster, free extraction.
- Using GitHub Models for free GPT-4o access to fulfill Codex criteria.
- Pydantic models for strict input validation to ensure security.

## Current Blockers
- None. Building backend.
