# PHASE 5 — COCKPIT & LIVE COACHING
## Model: Claude Opus 4.6 (Thinking)

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phases 0-4 have been completed. This phase makes the live meeting cockpit actually work with real AI intelligence.

---

## YOUR ROLE

You are a **Real-Time Systems Architect**. The cockpit page handles live audio capture via WebSocket, real-time transcription, AI-powered commitment extraction, and negotiation coaching. This involves complex async data flows, AudioWorklet integration, and WebSocket message handling. Think carefully about every data path.

---

## MANDATORY READING BEFORE CODING

Read these files **line by line** — the WebSocket protocol is custom and complex:
1. `frontend/app/cockpit/page.tsx` (11763 bytes — cockpit UI)
2. `frontend/hooks/useLiveAudio.ts` (14122 bytes — WebSocket audio hook, CRITICAL)
3. `frontend/public/audio-processor.js` (AudioWorklet processor)
4. `backend/main.py` — specifically:
   - Lines 1-50: Imports and constants
   - Lines 50-120: `SessionRegistry`, `CaptureSession`, `AudioPacket` classes
   - Lines 120-200: `AudioAccumulator`
   - Lines 200-400: `_audio_consumer` pipeline
   - Lines 400-end: WebSocket handler `/ws/capture`
5. `backend/agents/context_agent.py` (understand what ContextAgent returns)
6. `backend/agents/strategist_agent.py` (understand what StrategistAgent returns)

---

## UNDERSTANDING THE DATA FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Cockpit + useLiveAudio)                               │
│                                                                  │
│ Microphone → AudioWorklet → PCM packets → WebSocket SEND        │
│                                                                  │
│ WebSocket RECEIVE ← JSON messages from backend:                  │
│   • {type: "transcript", data: {text: "...", channel: 1}}      │
│   • {type: "pulse", data: {kind: "SIGNAL"|"TIP", content: "..."}} │
│   • {type: "ready"}                                              │
│   • {type: "ping"}                                               │
│   • {type: "backpressure"}                                       │
│   • {type: "error", detail: "..."}                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ WebSocket
┌──────────────────────▼──────────────────────────────────────────┐
│ BACKEND (main.py WebSocket handler)                              │
│                                                                  │
│ Binary audio packets → AudioAccumulator → WhisperAgent           │
│   → transcript segment → emit to client                         │
│                                                                  │
│ Transcript delta check (>120 chars, >2s since last):             │
│   → ContextAgent (commitment extraction)                        │
│   → StrategistAgent (negotiation tips)                          │
│   → emit "pulse" messages to client                             │
└─────────────────────────────────────────────────────────────────┘
```

The backend already sends `transcript` and `pulse` messages. The frontend's `useLiveAudio` hook already receives them. The problem is that the **cockpit page** doesn't use this data properly.

---

## TASK 1: Add Suspense Boundary (PRF-4)

**File**: `frontend/app/cockpit/page.tsx`

**Problem**: Uses `useSearchParams()` without a `<Suspense>` boundary. Next.js 14 requires this.

**Fix**: Wrap the cockpit in a Suspense boundary. The standard pattern is:

```typescript
import { Suspense } from "react";

function CockpitContent() {
  // ... existing cockpit component code with useSearchParams() ...
}

export default function CockpitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-text-muted font-bold uppercase tracking-widest animate-pulse">Initializing Cockpit...</div>
    </div>}>
      <CockpitContent />
    </Suspense>
  );
}
```

---

## TASK 2: Wire Real Transcription Display

**File**: `frontend/app/cockpit/page.tsx`

**Current**: The cockpit has a transcript area but it uses hardcoded/simulated data.

**Fix**: The `useLiveAudio` hook already returns transcript data. Ensure the cockpit:

1. Receives transcript segments from the hook's callback/state
2. Appends each new segment to a running transcript display
3. Auto-scrolls to the bottom of the transcript area
4. Visually distinguishes speakers if channel info is available (Channel 1 = microphone = user, Channel 2 = system audio = client)
5. Shows timestamps for each segment

**Transcript display design**:
```jsx
<div className="flex-1 overflow-y-auto p-8 space-y-4" ref={transcriptScrollRef}>
  {transcriptSegments.map((seg, i) => (
    <div key={i} className="flex gap-4">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">
        {seg.channel === 1 ? "YOU" : "CLIENT"}
      </span>
      <p className="text-sm font-medium text-text leading-relaxed">{seg.text}</p>
    </div>
  ))}
</div>
```

---

## TASK 3: Wire Real AI Commitment Extraction

**File**: `frontend/app/cockpit/page.tsx`

**Current**: Uses simplistic keyword matching to detect terms:
```javascript
// Current broken approach:
if (transcript.includes("price") || transcript.includes("cost")) { /* mark as found */ }
```

**Fix**: The backend's `ContextAgent` sends real commitments via WebSocket `pulse` messages with `kind: "SIGNAL"`. These contain structured commitment data (type, value, confidence, legal_weight).

1. Listen for `pulse` messages from the WebSocket
2. Parse `SIGNAL` type pulses — these are commitment detections
3. Display them in the Live Auditor panel with:
   - Commitment type (Price, Scope, Timeline, Revisions, IP, etc.)
   - Extracted value/description
   - Confidence indicator (green for firm, yellow for tentative)
4. Group by commitment type — if a new commitment of the same type arrives, update the existing one

**Auditor panel design**:
```jsx
<div className="space-y-3">
  {Object.entries(commitments).map(([type, commitment]) => (
    <div key={type} className={`flex items-center justify-between p-4 rounded-2xl border ${
      commitment.legal_weight === 'firm' 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{type}</span>
        <p className="text-sm font-bold text-text mt-1">{commitment.value}</p>
      </div>
      <div className={`w-3 h-3 rounded-full ${
        commitment.legal_weight === 'firm' ? 'bg-green-500' : 'bg-yellow-400'
      }`} />
    </div>
  ))}
</div>
```

---

## TASK 4: Wire Real Negotiation Coach

**File**: `frontend/app/cockpit/page.tsx`

**Current**: Hardcoded advice triggers on keywords like "discount" or "cheap".

**Fix**: The backend's `StrategistAgent` sends coaching tips via WebSocket `pulse` messages with `kind: "TIP"`. These contain tactical negotiation advice.

1. Listen for `pulse` messages with `kind: "TIP"`
2. Display them in the Coach panel as transient cards (fade in, persist for 30 seconds, then fade out)
3. Add a visual toggle for enabling/disabling the coach (URL param `coach=true/false` from dashboard pre-flight)
4. When coach is disabled, hide the coach panel entirely

**Coach tip card**:
```jsx
<AnimatePresence>
  {coachTips.map((tip, i) => (
    <motion.div 
      key={i}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 bg-blue-50 border border-blue-200 rounded-2xl"
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
        {tip.urgency === "high" ? "⚡ URGENT" : "💡 TIP"}
      </div>
      <p className="text-sm font-bold text-text">{tip.content}</p>
    </motion.div>
  ))}
</AnimatePresence>
```

---

## TASK 5: Add "End Meeting" Button

**File**: `frontend/app/cockpit/page.tsx`

**Current**: No way to end the meeting from the cockpit.

**Fix**: Add a prominent "End_Meeting" button:
1. On click: stop audio capture (call `stopCapture()` from useLiveAudio)
2. Close the WebSocket connection
3. Navigate to `/processing?session=${sessionId}`
4. The processing page (fixed in Phase 3) will then call `POST /api/meeting/{session_id}/end`

```jsx
<button 
  onClick={handleEndMeeting}
  className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
>
  End_Meeting & Mint_Documents
</button>
```

---

## TASK 6: Expose Commitment & Coaching Data from useLiveAudio

**File**: `frontend/hooks/useLiveAudio.ts`

**Current**: The hook receives `pulse` messages from the WebSocket but may not expose them to the consuming component in a structured way.

**Fix**: Ensure the hook exposes:
```typescript
interface UseLiveAudioReturn {
  isConnected: boolean;
  isCapturing: boolean;
  error: string | null;
  startCapture: (sessionId: string) => Promise<void>;
  stopCapture: () => void;
  
  // Transcript data
  transcriptSegments: Array<{ text: string; channel: number; timestamp: number }>;
  
  // AI Intelligence data (NEW or ensure exposed)
  commitments: Array<{ type: string; value: string; confidence: number; legal_weight: string }>;
  coachTips: Array<{ kind: string; content: string; urgency: string }>;
}
```

Parse the incoming WebSocket messages:
- `{type: "transcript", data: {...}}` → append to `transcriptSegments`
- `{type: "pulse", data: {kind: "SIGNAL", ...}}` → update `commitments`
- `{type: "pulse", data: {kind: "TIP", ...}}` → append to `coachTips`

---

## VERIFICATION CHECKLIST

### Scenario: Complete Live Meeting Flow
1. Dashboard → "Start Live Meeting" → fill client details → submit
2. Cockpit loads → WebSocket connects → "Connected" indicator shows green
3. Speak into microphone → transcript appears in real-time with speaker labels
4. Say "The total cost is seventy-five thousand rupees" → after ~3 seconds, commitment card appears in auditor panel: type="price", value="₹75,000"
5. If coach is enabled, strategic tips appear occasionally
6. Click "End Meeting" → navigate to `/processing` → LangGraph pipeline runs → documents generated

### Edge Cases to Think About:
- What if WebSocket disconnects mid-meeting? → Show reconnection indicator, auto-reconnect (already in useLiveAudio)
- What if no microphone permission? → Show clear error message
- What if backend is down? → Show "Cannot connect to legal engine" with retry button
- What if transcript is empty when ending meeting? → Show warning "No transcript detected"

---

## FILES YOU WILL MODIFY

1. `frontend/app/cockpit/page.tsx` — Tasks 1-5 (main cockpit rebuild)
2. `frontend/hooks/useLiveAudio.ts` — Task 6 (expose AI data)

## CONSTRAINTS

- Do NOT change backend WebSocket protocol (it works correctly)
- Do NOT change the audio-processor.js AudioWorklet
- Do NOT change any backend agent files
- Preserve the existing WebSocket binary protocol in useLiveAudio
- Think about WebSocket reconnection edge cases
- Use existing Tailwind theme classes

## PHASE 1 CONTEXT (Read Before Coding)

- `Background3D.tsx` now exports `MicModel`, `LockModel`, `SealModel`, `Feature3DGrid`, and `Mini3D` as named exports. Do NOT import `MeshTransmissionMaterial` — it has been removed.
- The Tailwind config now includes `accent: "#00C2CC"` (teal). Use `text-accent` for accent-colored UI elements.
- The landing page `page.tsx` uses `PIN_DEPTH = 3000` for scroll sync. Do NOT change this value.
