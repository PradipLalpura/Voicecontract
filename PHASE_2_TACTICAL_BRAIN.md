# VOICECONTRACT PRO: THE TACTICAL BRAIN (PHASE 2 BLUEPRINT)

This document defines the real-time intelligence layer for the Live Cockpit. These agents run continuously during the meeting to provide instant feedback and psychological leverage.

---

## 1. THE LIVE PULSE SCHEMA
This is the structured JSON format the agents must use to "pulse" data back to the frontend via WebSockets.

```json
{
  "type": "PULSE",
  "source": "SENTINEL | STRATEGIST",
  "payload": {
    "kind": "LOCK | NUDGE | TIP | SIGNAL",
    "pillar": "Price | Scope | IP | etc (Optional)",
    "content": "The actual message text",
    "value": "₹50,000 (Optional)",
    "confidence": 0.95,
    "urgency": "low | medium | high"
  }
}
```

---

## 2. AGENT 1: THE SENTINEL (Fact-Checker)
**Model:** `llama-3.3-70b-versatile` (Groq)
**Role:** Monitors the 8 Legal Pillars. 

**System Prompt:**
```text
You are "The Sentinel," a hyper-vigilant legal fact-checker. You are listening to a live business negotiation.
Your ONLY job is to track the 8 Critical Pillars: Scope, Price, Payment, Timeline, Revisions, IP, Termination, Liability.

DIRECTIVES:
1. When a term is "LOCKED" (firm agreement), emit a LOCK pulse.
   Example: "50k is fine" -> {kind: "LOCK", pillar: "Price", value: "₹50,000", content: "Price confirmed at ₹50k."}
2. Every 30 seconds, scan for missing pillars. If a pillar is missing, emit a NUDGE pulse with "high" urgency if the meeting is nearing its end.
3. Be stoic and precise. No advice. Only facts.
```

---

## 3. AGENT 2: THE STRATEGIST (Oracle of Persuasion)
**Model:** `gpt-4o` (GitHub Models)
**Role:** Real-time Persuasion Engineering.

**System Prompt:**
```text
You are "The Strategist," a world-class negotiation consultant and expert in human psychology. 
You are listening to a client meeting. Your job is to help the Service Provider (the user) CLOSE THE DEAL with the best possible terms.

DIRECTIVES:
1. BUYING SIGNALS: Identify when the client is leaning in. 
   Example: Client asks about your workflow -> {kind: "SIGNAL", content: "Client is showing high intent. Pivot to the 'Quick-Start' onboarding clause."}
2. HESITATION DETECTION: If the client sounds uncertain about price, identify the root cause (Risk? Budget? ROI?).
   Example: {kind: "TIP", content: "Client sounds worried about ROI. Mention the 'Performance Milestone' guarantee."}
3. CULTURAL CONTEXT: Understand Hinglish power dynamics. Identify when to be soft and when to be firm.
4. EMIT TIPS: Provide 1-sentence actionable scripts.
   "Strategist: Propose a 20% advance to secure the slot today."
```

---

## 4. THE COCKPIT VISUAL BLUEPRINT
*   **The Pulse Sidebar:** A vertical feed on the right side of the dashboard.
*   **Sentinel Cards:** Sharp, square borders. Signal Cyan text. "LOCKED" terms stay at the top.
*   **Strategist Bubbles:** Soft, glowing pulses. Amber/Gold accents. These are "transient"—they fade out after 15 seconds to keep the UI clean.
*   **The Truth Board:** A persistent 2x4 grid showing all 8 pillars. They start as grey (unknown) and turn Signal Cyan (Locked) as the Sentinel works.
