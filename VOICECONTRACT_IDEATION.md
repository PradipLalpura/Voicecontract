# VoiceContract — Complete Project Ideation
> Outskill x OpenAI AI Builders Hackathon | Cohort 01
> Builder: Pradip Lalpura | JPN Studio / Antarik

---

## 1. The Problem

Every day, millions of freelancers, agency owners, and small business operators across India get on client calls. They discuss scope, price, timeline, revisions, and payment terms. The call ends. Everyone feels good. And then nothing gets written down.

Three weeks later:
- Client says "that's not what we agreed"
- Payment gets delayed because "we never set a schedule"
- Scope creeps because "you said you'd handle this"
- Work gets used without credit because IP was never discussed

This is not a rare edge case. It is the default experience for India's 63 million freelancers and the majority of its 63 million SMBs. They lose money not because they can't do the work — but because the agreement never became a document.

The tools that exist today don't solve this:
- DocuSign / PandaDoc → you still have to write the contract yourself
- ChatGPT → you still have to describe everything manually
- Notion AI → document editing, not agreement generation
- Meeting recorders → give you a transcript, not a contract

**Nobody has connected the pipeline: spoken agreement → structured legal documents → ready to sign. That is VoiceContract.**

---

## 2. What VoiceContract Is

VoiceContract is an AI agent system that listens to a client meeting, understands everything that was verbally agreed upon, and automatically generates a contract, GST invoice, and purchase order — all formatted to your company's standards — within 60 seconds of the call ending.

It is not a transcription tool. It is not a template filler. It is a multi-agent pipeline that converts spoken intent into legally structured documentation with zero manual effort.

**One-line pitch:**
> "Client call ends. Your contract, invoice, and PO are already drafted and ready to send."



### Production Flow (Friday)
```
Everything above PLUS:
→ Bot joins Google Meet / Zoom call live (no upload needed)
→ Generates GST Invoice alongside contract
→ Generates Purchase Order alongside contract
→ Company template customization (logo, colors, format)
→ Digital signature flow for both parties
→ Share link sent automatically after call
→ Supabase storage — all documents saved per user
→ Dashboard to manage all contracts and their status
→ Email notification to client with signing link
```


## 6. The 8 Deal Terms VoiceContract Extracts

Every client meeting, when done properly, should cover these 8 things. VoiceContract finds them all — or tells you which ones you forgot to discuss.

| # | Term | What it captures |
|---|------|-----------------|
| 1 | Deliverables | What exactly is being built / delivered |
| 2 | Project Price | Total amount agreed upon |
| 3 | Timeline | Start date, end date, milestones |
| 4 | Payment Schedule | Advance %, milestone payments, final payment |
| 5 | Revision Policy | How many revisions, what counts as a revision |
| 6 | IP Ownership | Who owns the final work |
| 7 | Confidentiality | What cannot be shared publicly |
| 8 | Dispute Resolution | What happens if things go wrong |

---

## 7. The Gap Alert System — The Killer Feature

Before generating any document, VoiceContract shows:

```
⚠️  Gap Alert — 3 terms were not discussed in your call

  ❌  Payment schedule — you agreed on ₹50,000 total but 
      never discussed when payments happen.
      → Using default: 50% advance, 50% on delivery

  ❌  IP ownership — who owns the final deliverable was 
      never mentioned.
      → Using default: client owns upon full payment

  ❌  Revision policy — number of included revisions 
      was never agreed.
      → Using default: 2 rounds of revisions included

  [Accept All Defaults]  [Review Each One]
```

This moment — where AI catches what two humans forgot to discuss — is the demo's wow moment. The contract is more complete than the humans who made it.

---

## 8. Target User

**Primary:** Indian freelancers and agency owners doing client onboarding calls
- Web developers, designers, copywriters, marketers
- Agency owners (like Pradip at JPN Studio / Antarik)
- Solo consultants and coaches
- Anyone who closes deals on calls but loses money on paperwork

**Secondary (production roadmap):**
- SMBs doing vendor onboarding calls
- Hiring managers doing candidate offer calls
- Real estate agents closing deals verbally
- Any Indian business where verbal agreement is the norm

**Market size:** India has 63 million registered freelancers. If even 1% use VoiceContract at ₹299/month → ₹18.8 crore MRR.

---

## 9. Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** — utility styling
- **Impeccable design skill** — production-grade UI quality
- **shadcn/ui** — component library
- **Deployed:** Vercel

### Backend
- **FastAPI** (Python) — API layer
- **pdfkit** — PDF generation
- **Supabase** — auth + document storage
- **Deployed:** Railway

### Infrastructure
- **GitHub** — source control + CI/CD + shared brain (CONTEXT.md)
- **GitHub Actions** — auto-deploy on push
- **Vercel** — frontend hosting (free tier)
- **Railway** — backend hosting (free tier)

### Cost to build and demo
**₹0** — all free tiers and hackathon API credits

---

## 10. Scoring Breakdown — How We Win

| Criteria | Points | Our Score Strategy |
|---|---|---|
| Technical execution | 25 | Multi-agent pipeline. Real transcription. Real PDF output. Working end to end. |
| Usefulness | 25 | 63M freelancers. Real pain. Immediate value. Every judge has felt this. |
| Creativity & originality | 20 | Nobody has built spoken-agreement → auto-legal-docs pipeline. Verified. |
| Codex usage | 20 | Codex does contract clause generation — the hardest, most visible step. |
| Presentation clarity | 10 | 4-minute demo. One flow. Dramatic Gap Alert moment. |
| **Total** | **100** | **Target: 90+** |


*VoiceContract — The meeting ends. The paperwork is already done.*
*Built by Pradip Lalpura | JPN Studio | Ahmedabad, Gujarat*
