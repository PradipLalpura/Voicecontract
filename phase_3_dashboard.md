# PHASE 3 — DASHBOARD STATE ISOLATION & UN-FREEZING
## Model: Claude Opus 4.6 (Thinking)

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phases 0-2 have been completed. This phase fixes the most complex bugs — state management issues causing modal freezes and state bleed.

---

## YOUR ROLE

You are a **React State Architecture Debugger**. The dashboard has 15+ useState hooks with no centralized state management. Two modals share corrupted state. API calls freeze the UI. You must surgically isolate, fix, and verify every state transition.

**Think deeply about every state change.** Trace the state flow from user click → state update → render → API call → response → state update → render. Identify every path where state can become stale, corrupted, or stuck.

---

## MANDATORY READING BEFORE CODING

Read these files in FULL — understand every line:
1. `frontend/app/dashboard/page.tsx` (408 lines, 22.9KB — THE critical file)
2. `frontend/app/processing/page.tsx` (understand current fake flow)
3. `frontend/app/cockpit/page.tsx` (understand where live meeting navigates to)
4. `backend/routers/dashboard.py` (understand what the API returns)
5. `backend/routers/sessions.py` (understand POST /api/meeting/{session_id}/end)
6. `backend/main.py` — lines 1-50 (understand session registry and how sessions are created)

---

## BUG ANALYSIS (Trace the failure paths)

### Bug 1: "Start Live Meeting" doesn't reset state (BRK-1)

**Code** (line 304):
```jsx
<motion.button 
  onClick={() => setShowPreFlight(true)}
  ...
```

**Expected**: Should call `openPreFlight("live")` which resets ALL fields  
**Actual**: Directly sets `showPreFlight = true` without resetting fields or setting `ingestionMode`  

**Consequence**: If user previously opened Upload modal, the `ingestionMode` is still "upload". If user filled fields in Upload modal and closed it, those values persist when opening Live modal.

### Bug 2: Audio file input never rendered (BRK-2)

**Code** (line 61):
```typescript
const audioInputRef = useRef<HTMLInputElement>(null);
```

**Code** (line 114-116):
```typescript
if (ingestionMode === "upload") {
   audioInputRef.current?.click();  // ← This ref points to NOTHING
   return;
}
```

**The `<input type="file" ref={audioInputRef}>` element is NEVER rendered in the JSX.** The ref is always `null`. Clicking the submit button in Upload mode does absolutely nothing.

### Bug 3: "Initializing_Vault" freeze (BRK-3)

**Code** (lines 119-153):
```typescript
setIsStarting(true);
try {
  // ... API call ...
  if (res.ok) {
    const data = await res.json();
    router.push(`/cockpit?session=${data.id}`);
  }
  // ← NO else block — if res is not OK, isStarting stays true forever
} catch (error) {
  console.error(error);
  setIsStarting(false);  // ← Only resets on catch, not on non-OK response
}
// ← NO finally block
```

**Failure paths that cause freeze**:
1. API returns 4xx/5xx → `res.ok` is false → falls through → `isStarting` never reset
2. API returns 200 but `data.id` is undefined → `router.push` may or may not work → `isStarting` never reset
3. Network timeout → caught by catch → `isStarting` reset (this path actually works)
4. `getToken()` throws → caught by catch → `isStarting` reset (this path works too)

**The freeze happens on path 1**: Backend returns an error response but doesn't throw.

---

## TASK 1: Fix "Start Live Meeting" Button (BRK-1)

**File**: `frontend/app/dashboard/page.tsx`, line 304

**Change**:
```jsx
// BEFORE (broken):
onClick={() => setShowPreFlight(true)}

// AFTER (fixed):
onClick={() => openPreFlight("live")}
```

This ensures the `openPreFlight` function is called, which:
- Sets `ingestionMode` to "live"
- Resets ALL form fields to defaults
- Then shows the modal

---

## TASK 2: Add Hidden Audio File Input (BRK-2)

**File**: `frontend/app/dashboard/page.tsx`

**Add the hidden input element inside the return JSX** (anywhere inside the main `<div>`):

```jsx
{/* Hidden audio file input for Upload mode */}
<input 
  ref={audioInputRef}
  type="file"
  accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
  className="hidden"
  onChange={handleAudioSelected}
/>
```

**Placement**: Add it right after the `<AnimatePresence>` block (line 268) and before the header (line 270). It must be INSIDE the component's return statement but hidden via className.

---

## TASK 3: Fix "Initializing_Vault" Freeze (BRK-3)

**File**: `frontend/app/dashboard/page.tsx`, `handleStartMeeting` function (lines 109-153)

**Rewrite the function with proper error handling**:

```typescript
const handleStartMeeting = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!clientName || !clientCompany) return;
  
  if (ingestionMode === "upload") {
    audioInputRef.current?.click();
    return;
  }

  setIsStarting(true);
  try {
    const token = hasClerk ? await getToken() : "dev_token";
    const logoUrl = logoFile ? "uploaded_logo_placeholder" : "";

    const res = await fetch(`${apiUrl}/api/dashboard/deals/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        client_name: clientName,
        client_company: clientCompany,
        client_address: clientAddress,
        client_email: clientEmail,
        client_whatsapp: clientWhatsapp,
        client_logo: logoUrl,
        documents: { msa: docMsa, invoice: docInvoice, po: docPo },
        use_coach: enableCoach
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Server error" }));
      throw new Error(errorData.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.id) {
      throw new Error("No session ID returned from server");
    }

    setShowPreFlight(false);
    router.push(`/cockpit?session=${data.id}`);
  } catch (error: any) {
    console.error("Meeting start failed:", error);
    setStartError(error.message || "Failed to start meeting. Check your connection.");
  } finally {
    setIsStarting(false);  // ← ALWAYS reset, no matter what
  }
};
```

**Also add**:
1. A new state variable: `const [startError, setStartError] = useState<string>("");`
2. Clear the error when opening the modal: add `setStartError("")` in `openPreFlight()`
3. Display the error in the modal UI (below the submit button):
```jsx
{startError && (
  <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-bold">
    {startError}
  </div>
)}
```

---

## TASK 4: Fix Upload Flow

**File**: `frontend/app/dashboard/page.tsx`, `handleAudioSelected` function (lines 155-161)

**Current (broken)**:
```typescript
const handleAudioSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
       alert("Uploading audio: " + e.target.files[0].name + " (Async processing started)");
       setShowPreFlight(false);
       setTimeout(() => router.push(`/processing?session=upload-${Date.now()}`), 1000);
    }
};
```

**Fix**: Create a real upload flow:
```typescript
const handleAudioSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsStarting(true);
  setStartError("");
  try {
    const token = hasClerk ? await getToken() : "dev_token";
    
    // First create a draft deal
    const draftRes = await fetch(`${apiUrl}/api/dashboard/deals/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        client_name: clientName,
        client_company: clientCompany,
        client_address: clientAddress,
        client_email: clientEmail,
        client_whatsapp: clientWhatsapp,
        documents: { msa: docMsa, invoice: docInvoice, po: docPo },
        use_coach: false
      })
    });

    if (!draftRes.ok) throw new Error("Failed to create session");
    const draftData = await draftRes.json();

    // Then upload the audio file
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("session_id", draftData.id);

    const uploadRes = await fetch(`${apiUrl}/api/upload/recording`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!uploadRes.ok) throw new Error("Failed to upload recording");

    setShowPreFlight(false);
    router.push(`/processing?session=${draftData.id}`);
  } catch (error: any) {
    console.error("Upload failed:", error);
    setStartError(error.message || "Upload failed");
  } finally {
    setIsStarting(false);
  }
};
```

**⚠️ NOTE**: This requires the backend `POST /api/upload/recording` endpoint to exist. If it doesn't exist yet (it's created in a later integration), gracefully fall back to the simulated flow with a TODO comment.

---

## TASK 5: Wire "Audit_Assets" Button

**File**: `frontend/app/dashboard/page.tsx`, line 395

**Current (broken)**: No `onClick` handler
```jsx
<button className="...">Audit_Assets</button>
```

**Fix**:
```jsx
<button 
  onClick={() => router.push(`/review/${session.id}`)}
  className="px-6 py-2 border-2 border-text text-text rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-text hover:text-white transition-all opacity-0 group-hover:opacity-100"
>
  Audit_Assets
</button>
```

---

## TASK 6: Wire Processing Page to Backend

**File**: `frontend/app/processing/page.tsx`

**Current state**: Entirely fake. Shows hardcoded timed animation logs, then redirects to `/review/[session_id]` after a timer.

**Fix**: Make it call the real backend:
1. On mount, extract `session_id` from URL search params
2. Call `POST /api/meeting/${session_id}/end` to trigger the LangGraph pipeline
3. Show real progress:
   - "Analyzing transcript..." → when request starts
   - "Extracting commitments..." → after 2s
   - "Drafting documents..." → after 5s  
   - "Running adversarial review..." → after 8s
   - "Generating invoice & PO..." → after 12s
   - "Complete!" → when API returns 200
4. On success, navigate to `/review/${session_id}`
5. On failure, show error with "Return to Dashboard" button
6. Add `<Suspense>` boundary around the page if using `useSearchParams()`

**⚠️ IMPORTANT**: The `POST /api/meeting/{session_id}/end` call can take 30-60 seconds because it runs through 5 LangGraph nodes. Use `signal: AbortSignal.timeout(120000)` or similar to prevent premature timeout. Do NOT use polling — it's a single long-running request.

---

## TASK 7: Create Backend Upload Endpoint

**File**: `backend/routers/upload.py` (NEW)

Create a new endpoint that handles audio file uploads:

```python
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from backend.auth.jwt_auth import verify_token
from backend.agents.whisper_agent import WhisperAgent
from backend.agents.context_agent import ContextAgent
import tempfile
import os

router = APIRouter(prefix="/api/upload", tags=["upload"])
whisper = WhisperAgent()
context = ContextAgent()

@router.post("/recording")
async def upload_recording(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    token_data: dict = Depends(verify_token)
):
    """
    Upload an audio recording for offline processing.
    Transcribes the audio and extracts commitments.
    """
    # Validate file type
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/x-wav"]
    if audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {audio.content_type}")
    
    # Read audio data
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")
    
    # Transcribe
    transcript = await whisper.transcribe(audio_bytes, sample_rate=16000)
    if not transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio")
    
    # Extract commitments
    commitments = await context.analyze(transcript, [])
    
    return {
        "session_id": session_id,
        "transcript": transcript,
        "commitments": [c.dict() if hasattr(c, 'dict') else c for c in commitments],
        "status": "transcribed"
    }
```

**Also**: Register this router in `backend/main.py`:
```python
from backend.routers import upload
app.include_router(upload.router)
```

---

## VERIFICATION CHECKLIST

After completing all tasks, trace these scenarios mentally and then test:

### Scenario 1: Live Meeting (Happy Path)
1. Click "Start Live Meeting" → modal opens with EMPTY fields ✓
2. Fill client name + company → click "Start_Legal_Interception"
3. Button shows "Initializing_Vault..." → API call → navigates to `/cockpit?session=xxx`
4. If backend is down → error message appears → button returns to normal

### Scenario 2: Upload Recording (Happy Path)
1. Click "Upload Call Recording" → modal opens with EMPTY fields ✓
2. Fill client name + company → click "Start_Legal_Interception"
3. File picker opens → select audio file → upload starts → navigates to `/processing`

### Scenario 3: State Bleed Prevention
1. Click "Upload Call Recording" → fill "John" in client name → close modal
2. Click "Start Live Meeting" → client name field should be EMPTY (not "John") ✓
3. `ingestionMode` should be "live" ✓

### Scenario 4: Freeze Prevention
1. Turn off backend (kill python process)
2. Click "Start Live Meeting" → fill fields → click submit
3. Button shows "Initializing_Vault..." briefly → error message appears → button resets ✓
4. Button is clickable again ✓

---

## FILES YOU WILL MODIFY

1. `frontend/app/dashboard/page.tsx` — Tasks 1-5 (main bugfix file)
2. `frontend/app/processing/page.tsx` — Task 6 (wire to backend)
3. `backend/routers/upload.py` — NEW file (Task 7)
4. `backend/main.py` — Register upload router (Task 7)

## CONSTRAINTS

- Do NOT change 3D/animation code
- Do NOT change the onboarding wizard
- Do NOT change the cockpit page (that's Phase 5)
- Do NOT change the settings page (fixed in Phase 1)
- Think about EVERY edge case before writing code
- Use the existing Tailwind theme classes

## PHASE 1 CONTEXT (Read Before Coding)

- `Background3D.tsx` now exports `MicModel`, `LockModel`, `SealModel`, `Feature3DGrid`, and `Mini3D` as named exports. Do NOT import `MeshTransmissionMaterial` — it has been removed.
- The Tailwind config now includes `accent: "#00C2CC"` (teal). CSS utilities `.shimmer`, `.float-gentle`, `.text-gradient`, `.card-glow`, `.reveal-on-scroll` are available in `globals.css`.
- The settings page `[[...rest]]/page.tsx` now uses `useAuth()` + `getToken()` from Clerk for API calls. Use the same auth pattern.
