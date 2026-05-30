# PHASE 2 — BRAND DNA & ONBOARDING ARCHITECTURE
## Model: Gemini 3.1 High

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. Phases 0-1 have been completed. This phase wires the onboarding wizard to actually capture and persist Brand DNA.

---

## YOUR ROLE

You are a **Full-Stack Feature Engineer**. Your job is to make the onboarding wizard actually functional — capturing company identity, template strategy, and Brand DNA at login time (not during meeting pre-flight). Move fast, write clean code.

---

## MANDATORY READING BEFORE CODING

Read these files in FULL:
1. `frontend/components/IdentityWizard.tsx` (12929 bytes, 4-step wizard)
2. `frontend/app/onboarding/page.tsx` (4124 bytes)
3. `frontend/app/dashboard/page.tsx` (22909 bytes — understand the pre-flight modal)
4. `backend/routers/users.py` (50 lines)
5. `backend/database/migrations/01_genesis_schema.sql` (understand the `users` table schema)

---

## TASK 1: Wire IdentityWizard to Actually Save Data

**File**: `frontend/components/IdentityWizard.tsx`

**Current state**: The wizard has 4 steps but multiple fields are broken:
- Step 1: Brand accent color selector → selected color is NEVER stored in state
- Step 3 (Template Strategy): File upload for Brand DNA / existing MSA → File object stored but NEVER uploaded
- The `onComplete` callback only sends: `company_name`, `gst_number`, `address`
- Template strategy choice (AI Generate vs Extract Existing) is NOT sent

**Fix**:
1. Add state for `brandAccent` (string hex color) and track the selected color
2. Add state for `templateStrategy` (`"ai_generate" | "extract_existing"`)
3. Add state for `brandDnaFile` and `existingMsaFile` (File objects from uploads)
4. On the final step "Confirm & Launch", the `onComplete` callback should send ALL data:
```typescript
onComplete({
  company_name: companyName,
  gst_number: gstNumber,
  address: fullAddress,
  brand_accent: brandAccent,
  template_strategy: templateStrategy,
  brand_dna_filename: brandDnaFile?.name || "",
  existing_msa_filename: existingMsaFile?.name || "",
});
```

5. Add basic validation:
   - Company name is required
   - GST number should be 15 characters (Indian GSTIN format) — show warning if not, but don't block
   - Address is required
   - Step 3 must have a strategy selected

---

## TASK 2: Wire Onboarding Page to Backend

**File**: `frontend/app/onboarding/page.tsx`

**Current state**: Calls `POST /api/users/onboard` but only sends basic fields. Uses `alert()` for errors.

**Fix**:
1. Send the full data object from IdentityWizard to `POST /api/users/onboard`
2. Replace all `alert()` calls with inline status messages (a `<div>` with success/error text styled appropriately)
3. After successful onboarding:
   - Set `localStorage.setItem('onboardingComplete', 'true')`
   - Set Clerk `unsafeMetadata.onboardingComplete = true`
   - Navigate to `/dashboard`
4. Add a redirect check: if user already completed onboarding (`unsafeMetadata.onboardingComplete` is truthy), skip to `/dashboard`

---

## TASK 3: Expand Backend Onboarding Endpoint

**File**: `backend/routers/users.py`

**Current endpoint** (`POST /api/users/onboard`):
```python
@router.post("/onboard")
async def onboard_user(payload: dict = Body(...), token_data: dict = Depends(verify_token)):
    user_id = token_data.get("sub", "unknown")
    if supabase_admin:
        supabase_admin.table("users").upsert({
            "id": user_id,
            **payload.dict()
        }).execute()
    return {"status": "ok", "message": "Identity secured."}
```

**Issues**:
- `payload.dict()` — `payload` is a raw `dict`, not a Pydantic model. `.dict()` doesn't exist on plain dicts
- No validation of incoming fields
- No support for new Brand DNA fields

**Fix**:
1. Create a proper Pydantic model:
```python
from pydantic import BaseModel
from typing import Optional

class OnboardPayload(BaseModel):
    company_name: str
    gst_number: Optional[str] = ""
    address: Optional[str] = ""
    brand_accent: Optional[str] = "#2563EB"
    template_strategy: Optional[str] = "ai_generate"
    brand_dna_filename: Optional[str] = ""
    existing_msa_filename: Optional[str] = ""
```

2. Update the endpoint to use this model:
```python
@router.post("/onboard")
async def onboard_user(payload: OnboardPayload, token_data: dict = Depends(verify_token)):
    user_id = token_data.get("sub", "unknown")
    if supabase_admin:
        supabase_admin.table("users").upsert({
            "id": user_id,
            **payload.model_dump()
        }).execute()
    return {"status": "ok", "message": "Identity secured."}
```

3. Also fix the `GET /api/users/me` endpoint — ensure it returns all Brand DNA fields

---

## TASK 4: Simplify Dashboard Pre-Flight Modal

**File**: `frontend/app/dashboard/page.tsx`

**Current state**: The pre-flight modal collects BOTH user identity (logo, company) AND client details. Per the product vision, Brand DNA should be captured at onboarding — pre-flight should ONLY ask for client info.

**Fix**:
1. Remove from the pre-flight modal:
   - Client Logo upload (the USER's logo is from onboarding; client logo can stay if useful)
   - Any fields that duplicate onboarding data
   
2. The pre-flight modal should collect ONLY:
   - Client Full Name (required)
   - Client Company/Entity (required)
   - Client Address
   - Client Email
   - Client WhatsApp
   - Document types to mint (MSA/Invoice/PO checkboxes)
   - Negotiation Coach toggle

3. On dashboard load, fetch the user's profile via `GET /api/users/me` to verify onboarding is complete. If profile is missing `company_name`, redirect to `/onboarding`.

---

## TASK 5: Add Profile Fetch to Dashboard

**File**: `frontend/app/dashboard/page.tsx`

Add an API call on mount:
```typescript
// Fetch user profile to verify onboarding and get Brand DNA
const profileRes = await fetch(`${apiUrl}/api/users/me`, { headers });
if (profileRes.ok) {
  const profile = await profileRes.json();
  if (!profile.company_name) {
    router.push('/onboarding');
    return;
  }
  // Store profile in state for later use (e.g., display company name in header)
}
```

---

## VERIFICATION CHECKLIST

1. **Build**: `cd frontend && npm run build` — zero errors
2. **Onboarding flow**:
   - Navigate to `/onboarding`
   - Step 1: Enter company name, select accent color → color is stored
   - Step 2: Enter address, GST number
   - Step 3: Choose "AI Generate" or "Extract Existing" → upload file if applicable
   - Step 4: Confirm → data sent to backend → redirect to dashboard
3. **Backend**: Check that `POST /api/users/onboard` accepts all new fields without error
4. **Dashboard**: After onboarding, the pre-flight modal should NOT ask for company identity — only client details
5. **Re-onboarding prevention**: Navigating to `/onboarding` after completing it should redirect to `/dashboard`

---

## FILES YOU WILL MODIFY

1. `frontend/components/IdentityWizard.tsx` — Wire all fields, add validation (Task 1)
2. `frontend/app/onboarding/page.tsx` — Wire to backend, remove alerts (Task 2)
3. `backend/routers/users.py` — Expand onboarding model and endpoint (Task 3)
4. `frontend/app/dashboard/page.tsx` — Simplify pre-flight, add profile check (Tasks 4, 5)

## CONSTRAINTS

- Do NOT touch 3D/animation code
- Do NOT change the settings page
- Do NOT change the cockpit, processing, review, or sign pages
- Keep the existing "Titanium & Frost" styling
- Replace ALL `alert()` with inline UI messages
- Use existing Tailwind classes from the project's theme

## PHASE 1 CONTEXT (Read Before Coding)

- `Background3D.tsx` now exports `MicModel`, `LockModel`, `SealModel`, `Feature3DGrid`, and `Mini3D` as named exports. Do NOT import `MeshTransmissionMaterial` — it has been removed.
- The Tailwind config now includes `accent: "#00C2CC"` (teal). CSS utilities `.shimmer`, `.float-gentle`, `.text-gradient`, `.card-glow`, `.reveal-on-scroll` are available in `globals.css`.
- The landing page `page.tsx` uses `PIN_DEPTH = 3000` for scroll sync. Do NOT change this value.
