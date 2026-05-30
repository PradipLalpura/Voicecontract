# PHASE 6 — E-SIGN VAULT & DOCUMENT DISPATCH
## Model: Gemini 3.1 Pro Preview

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phases 0-5 have been completed. This is the FINAL phase — wiring the review/sign/dispatch pages to real backend data.

---

## YOUR ROLE

You are a **Full-Stack Integration Engineer** completing the final mile. The review page shows hardcoded terms, the sign page shows hardcoded documents, signatures are drawn but never sent, downloads are fake `window.print()`, and dispatch is simulated. You will wire everything to the real backend.

**This phase touches 5+ files across frontend and backend. Keep the full cross-file context in mind.**

---

## MANDATORY READING BEFORE CODING

Read these files in FULL:
1. `frontend/app/review/[session_id]/page.tsx` (6086 bytes — term review before minting)
2. `frontend/app/sign/[session_id]/page.tsx` (12633 bytes — e-sign vault)
3. `frontend/components/animations/SuccessHandshake.tsx` (2870 bytes)
4. `backend/routers/sessions.py` (115 lines — POST /api/meeting/{session_id}/end)
5. `backend/routers/signature.py` (119 lines — POST /api/signature/execute)
6. `backend/routers/dispatch.py` (60 lines — POST /api/dispatch/send)
7. `backend/agents/langgraph_firm.py` (425 lines — understand the output format)
8. `backend/routers/dashboard.py` (146 lines — GET /api/dashboard/deals)

---

## TASK 1: Wire Review Page to Real Data

**File**: `frontend/app/review/[session_id]/page.tsx`

**Current**: Terms are hardcoded static mock data:
```typescript
const [terms, setTerms] = useState([
  { key: "scope", label: "Scope of Work", value: "Full-stack web development..." },
  // ... more hardcoded terms
]);
```

**Fix**:
1. On mount, fetch the deal data using the session_id:
```typescript
const fetchDealData = async () => {
  const token = hasClerk ? await getToken() : "dev_token";
  const res = await fetch(`${apiUrl}/api/dashboard/deals`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    const deals = await res.json();
    const deal = deals.find((d: any) => d.id === sessionId || d.session_id === sessionId);
    if (deal?.committed_terms) {
      setTerms(deal.committed_terms.map((t: any) => ({
        key: t.type,
        label: t.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: t.value,
        editable: true
      })));
    }
  }
};
```

2. Make terms editable — user can modify extracted values before minting
3. "Mint Documents" button should:
   - Collect the confirmed/edited terms
   - Navigate to `/sign/${sessionId}` 
   - Pass confirmed terms via URL state or localStorage (since there's no state management)

---

## TASK 2: Wire Sign Page to Real Documents

**File**: `frontend/app/sign/[session_id]/page.tsx`

**Current**: All document content is hardcoded strings:
```typescript
const msaContent = "MASTER SERVICE AGREEMENT\n\nThis Master Service Agreement...";
const invoiceContent = "INVOICE\n\nInvoice Number: VC-2026-001...";
```

**Fix**:
1. On mount, fetch the real documents from the backend:
```typescript
const fetchDocuments = async () => {
  const token = hasClerk ? await getToken() : "dev_token";
  const res = await fetch(`${apiUrl}/api/dashboard/deals`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    const deals = await res.json();
    const deal = deals.find((d: any) => d.id === sessionId || d.session_id === sessionId);
    if (deal) {
      setMsaContent(deal.msa_text || "Document pending generation...");
      setInvoiceContent(deal.invoice_text || "Invoice pending generation...");
      setPoContent(deal.po_text || "Purchase Order pending generation...");
      setDealData(deal);
    }
  }
};
```

2. Display the real document content in the document viewer tabs
3. Format the document text with proper line breaks and section headers

---

## TASK 3: Extract & Send Signature Data

**File**: `frontend/app/sign/[session_id]/page.tsx`

**Current**: The canvas draws a signature but the vector data is NEVER extracted or transmitted.

**Fix**:
1. Track signature strokes as vector data:
```typescript
interface SignaturePoint {
  x: number;
  y: number;
  timestamp: number;
}

const [signatureStrokes, setSignatureStrokes] = useState<SignaturePoint[][]>([]);
const [currentStroke, setCurrentStroke] = useState<SignaturePoint[]>([]);

// On mouse/touch move while drawing:
const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDrawing) return;
  const rect = canvasRef.current!.getBoundingClientRect();
  const point = {
    x: (e.clientX - rect.left) / rect.width,  // Normalize to 0-1
    y: (e.clientY - rect.top) / rect.height,
    timestamp: Date.now()
  };
  setCurrentStroke(prev => [...prev, point]);
  // Also draw on canvas...
};

// On mouse/touch up:
const handleStrokeEnd = () => {
  setIsDrawing(false);
  if (currentStroke.length > 0) {
    setSignatureStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke([]);
  }
};
```

2. On "Sign & Lock" button click, send the signature to the backend:
```typescript
const handleSign = async () => {
  if (signatureStrokes.length === 0) {
    setError("Please sign the document first");
    return;
  }
  
  setIsSigning(true);
  try {
    const token = hasClerk ? await getToken() : "dev_token";
    const res = await fetch(`${apiUrl}/api/signature/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        signature_vectors: signatureStrokes,
        signer_role: "provider"
      })
    });
    
    if (!res.ok) throw new Error("Signature execution failed");
    
    // The response is a PDF blob
    const blob = await res.blob();
    setSignedPdfBlob(blob);
    setIsSigned(true);
  } catch (error: any) {
    setError(error.message);
  } finally {
    setIsSigning(false);
  }
};
```

---

## TASK 4: Real PDF Download

**File**: `frontend/app/sign/[session_id]/page.tsx`

**Current**: `window.print()` — not a real download.

**Fix**:
```typescript
const handleDownload = () => {
  if (!signedPdfBlob) return;
  
  const url = URL.createObjectURL(signedPdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `VoiceContract_${sessionId}_signed.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## TASK 5: Wire Dispatch to Client

**File**: `frontend/app/sign/[session_id]/page.tsx`

**Current**: Simulated with a `setTimeout` only.

**Fix**:
```typescript
const handleDispatch = async () => {
  setIsDispatching(true);
  try {
    const token = hasClerk ? await getToken() : "dev_token";
    const res = await fetch(`${apiUrl}/api/dispatch/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        channels: {
          email: dealData?.client_email || "",
          whatsapp: dealData?.client_whatsapp || ""
        }
      })
    });
    
    if (!res.ok) throw new Error("Dispatch failed");
    const data = await res.json();
    
    setIsDispatched(true);
    // Show success state with tracking ID
    setTrackingId(data.tracking_id);
  } catch (error: any) {
    setError(error.message || "Failed to dispatch documents");
  } finally {
    setIsDispatching(false);
  }
};
```

---

## TASK 6: Fix SuccessHandshake Component

**File**: `frontend/components/animations/SuccessHandshake.tsx`

**Current**: "Download_Package" and "Return_to_Dashboard" buttons have no onClick handlers. Uses old dark-theme CSS classes.

**Fix**:
1. Add `onDownload` and `onReturn` callback props:
```typescript
interface SuccessHandshakeProps {
  onDownload: () => void;
  onReturn: () => void;
  trackingId?: string;
}
```

2. Wire buttons:
```jsx
<button onClick={onDownload} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors">
  Download_Package
</button>
<button onClick={onReturn} className="px-8 py-4 border-2 border-text text-text rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-text hover:text-white transition-colors">
  Return_to_Dashboard
</button>
```

3. Replace old CSS classes (`glass-morphism`, `signal`, `void`, `shadow-premium`) with current Tailwind theme tokens:
   - `glass-morphism` → `glass-morphism-light` (defined in `globals.css`) or `bg-white/80 backdrop-blur-xl border border-border/50`
   - `signal` → `text-accent` (Phase 1 added `accent: #00C2CC` to the Tailwind config — use it for highlights)
   - `void` → `text-text`
   - `shadow-premium` → `shadow-apple-lg` or `shadow-2xl`
   - For gradient accents, use the `.text-gradient` class (defined in `globals.css`) which blends `#2563EB → #00C2CC`

---

## TASK 7: Improve Backend Dispatch Stub

**File**: `backend/routers/dispatch.py`

**Current**: Both email and WhatsApp functions are stubs that just log and return `True`.

**Fix**: Make them realistic stubs that:
1. Log the dispatch attempt with details
2. Store a dispatch record (in memory dict if Supabase is unavailable)
3. Return a proper tracking ID and timestamp
4. Simulate a realistic response structure

```python
import uuid
from datetime import datetime

# In-memory dispatch log
_dispatch_log = {}

async def _simulate_email_dispatch(session_id: str, recipient: str):
    tracking = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"
    _dispatch_log[tracking] = {
        "channel": "email",
        "session_id": session_id,
        "recipient": recipient,
        "status": "queued",
        "timestamp": datetime.utcnow().isoformat()
    }
    return tracking

async def _simulate_whatsapp_dispatch(session_id: str, recipient: str):
    tracking = f"WA-{uuid.uuid4().hex[:8].upper()}"
    _dispatch_log[tracking] = {
        "channel": "whatsapp",
        "session_id": session_id,
        "recipient": recipient,
        "status": "queued",
        "timestamp": datetime.utcnow().isoformat()
    }
    return tracking

@router.post("/send")
async def dispatch_documents(payload: dict = Body(...), token_data: dict = Depends(verify_token)):
    session_id = payload.get("session_id", "")
    channels = payload.get("channels", {})
    
    results = {}
    if channels.get("email"):
        results["email"] = await _simulate_email_dispatch(session_id, channels["email"])
    if channels.get("whatsapp"):
        results["whatsapp"] = await _simulate_whatsapp_dispatch(session_id, channels["whatsapp"])
    
    tracking_id = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    return {
        "status": "dispatched",
        "tracking_id": tracking_id,
        "channels": results,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## TASK 8: Add Deal Data Fetch Endpoint (if needed)

**File**: `backend/routers/dashboard.py`

Check if the existing `GET /api/dashboard/deals` endpoint returns enough data for the review and sign pages. It should include:
- `msa_text` — the generated MSA document text
- `invoice_text` — invoice content
- `po_text` — purchase order content
- `committed_terms` — extracted commitments
- `client_email`, `client_whatsapp` — for dispatch

If these fields are missing from the response, add them. The data comes from the `deals` and `documents` tables in Supabase.

---

## VERIFICATION CHECKLIST

### Complete End-to-End Flow:
1. Dashboard → Start Meeting → Cockpit → End Meeting → Processing
2. Processing completes → Review page loads with REAL extracted terms
3. User edits terms if needed → clicks "Mint Documents"
4. Sign page loads with REAL MSA, Invoice, PO content in tabs
5. User draws signature on canvas → clicks "Sign & Lock"
6. Backend generates password-protected PDF → download button works
7. User clicks "Dispatch to Client" → simulated email/WhatsApp sent
8. Success screen shows → tracking ID displayed
9. "Download Package" downloads the PDF
10. "Return to Dashboard" navigates back

### Edge Cases:
- No documents generated yet → show "Pending generation" message
- Empty signature → show "Please sign first" error
- Backend down during signing → show error, allow retry
- Dispatch with no email/WhatsApp → show "No contact info" warning

---

## FILES YOU WILL MODIFY

1. `frontend/app/review/[session_id]/page.tsx` — Task 1 (real terms)
2. `frontend/app/sign/[session_id]/page.tsx` — Tasks 2-5 (real documents, signatures, download, dispatch)
3. `frontend/components/animations/SuccessHandshake.tsx` — Task 6 (wire buttons, fix CSS)
4. `backend/routers/dispatch.py` — Task 7 (improved stubs)
5. `backend/routers/dashboard.py` — Task 8 (ensure complete data)

## CONSTRAINTS

- Do NOT change the backend document generation pipeline (langgraph_firm.py)
- Do NOT change the WebSocket protocol
- Do NOT change the cockpit or dashboard
- Keep the "Titanium & Frost" styling
- Use the existing Tailwind theme tokens
- Maintain the dual e-sign concept (provider signs first → then dispatch to client)

## PHASE 1 CONTEXT (Read Before Coding)

- `Background3D.tsx` now exports `MicModel`, `LockModel`, `SealModel`, `Feature3DGrid`, and `Mini3D` as named exports. Do NOT import `MeshTransmissionMaterial` — it has been removed.
- The Tailwind config now includes `accent: "#00C2CC"` (teal). Use `text-accent` for accent highlights instead of `text-primary`.
- CSS utilities `.text-gradient`, `.card-glow`, `.glass-morphism-light` are available in `globals.css`. Use them instead of inventing new classes.
- The landing page `page.tsx` uses `PIN_DEPTH = 3000` for scroll sync. Do NOT change this value.
