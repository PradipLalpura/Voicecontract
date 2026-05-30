# VoiceContract: Genesis Rebirth — Implementation Plan

Comprehensive overhaul of VoiceContract to transform the broken MVP into a working, polished, production-grade legal engine. Based on exhaustive analysis of **every file** in both frontend (20+ files) and backend (25+ files).

## User Review Required

> [!IMPORTANT]
> **Supabase Credentials Missing**: The `.env` file does NOT contain `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`. This means all database operations currently return `None`. I need these credentials to enable persistence. **Please provide them or confirm if we should use in-memory/mock storage for now.**

> [!WARNING]
> **API Keys in Source Control**: The `.env` file contains live API keys (Groq, Gemini, GitHub PAT, Clerk) committed to the repo. These should be rotated after the buildathon.

> [!CAUTION]
> **CLERK_SECRET_KEY Exposed to Browser**: In `next.config.mjs`, the `CLERK_SECRET_KEY` is mapped to the `env:{}` object (not `serverRuntimeConfig`), making it accessible in client-side JavaScript. This is a critical security vulnerability that I will fix immediately.

## Open Questions

> [!IMPORTANT]
> 1. **Supabase Access**: Do you have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values? Without them, all deal persistence, user profiles, and document storage will be non-functional.
> 2. **Clerk Webhook**: Is the Clerk webhook for user sync (`/api/webhooks/clerk`) configured in the Clerk dashboard? If not, user creation won't be synced to Supabase.
> 3. **Aesthetic Direction**: The current theme is "Titanium & Frost" (Enterprise Light). The screenshots show a clean light UI with blue accents. Should I maintain this exact palette, or refine it toward a more "Apple-grade" premium feel?
> 4. **Flash Version**: There's a `Voicecontract flash.zip` (309MB) in the parent folder. Should I extract and reference anything from it, or is the current `Voicecontract/` the single source of truth?

---

## Proposed Changes

### Phase 0 — Critical Security & Infrastructure Fixes
*Fix showstopper security bugs and missing dependencies that block everything else.*

---

#### [MODIFY] [next.config.mjs](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/next.config.mjs)
- **Remove** `CLERK_SECRET_KEY` from the `env:{}` block (it must ONLY be in `serverRuntimeConfig` or environment variables, never exposed to client)
- **Remove** `NEXT_PUBLIC_CAPTURE_SHARED_SECRET` from client exposure — this HMAC secret should stay server-side only
- Keep only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_CAPTURE_WS_HOST` as public env vars

#### [MODIFY] [requirements.txt](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/requirements.txt)
- Add all missing dependencies: `supabase`, `svix`, `cryptography`, `reportlab`, `PyJWT`, `python-dotenv`, `langchain-groq`, `langchain-openai`, `langgraph`, `openai`, `httpx`

#### [MODIFY] [jwt_auth.py](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/auth/jwt_auth.py)
- Enable JWT signature verification (at minimum verify the `exp` claim properly)
- Keep the dev bypass token for local development

#### [MODIFY] [useLiveAudio.ts](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/hooks/useLiveAudio.ts)
- Move HMAC computation to a server-side Next.js route handler so the shared secret is never in the browser
- Create a new `/api/ws-token` API route that generates a time-limited HMAC token

#### [NEW] [app/api/ws-token/route.ts](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/api/ws-token/route.ts)
- Server-side API route that computes the HMAC-SHA256 auth token for WebSocket connection
- Uses `CAPTURE_SHARED_SECRET` from server env (never sent to browser)

---

### Phase 1 — 3D Engine & UI Refinement
*Fix the visual engine so devices look pixel-perfect and scroll animations are buttery smooth.*

---

#### [MODIFY] [Background3D.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/components/Background3D.tsx)

**A. Device Projection Fix (HTML Content Fitting)**
- Recalibrate `distanceFactor` on all three `<Html>` components (Laptop, Phone, Contract) for pixel-perfect content fitting
- Adjust the `transform`, `scale`, and `position` props so the Dashboard UI fills the laptop screen edge-to-edge
- Fix the phone UI to fit within the phone model bezel
- Fix the contract content to be centered within the floating document

**B. Contract Y-Position**
- Lower the `RealisticContract` group's Y-position from its current elevated position to viewport center
- Make it the visual centerpiece when the scroll animation holds

**C. Performance Optimizations**
- Fix `CrashProofWave`: Stop creating new `THREE.BufferAttribute` every frame — reuse the attribute and set `needsUpdate = true`
- Remove `MeshTransmissionMaterial` with `samples={16}` — replace with a lighter glass material (MeshPhysicalMaterial with transmission)
- Add device capability detection: fall back to static images on mobile/low-GPU devices

**D. Scroll Animation (ScrollTrigger Sequence)**
- **Scroll Down**: Devices slide upward smoothly → converge toward center → fly backward into Z-axis → fade out to clear the section
- **Scroll Up**: Perfect reversal of the above sequence (devices fly forward from Z, separate, slide down to original positions)
- Use GSAP ScrollTrigger with `scrub: true` for buttery-smooth frame-linked animation
- Implement proper pin/unpin so the 3D section stays fixed during the animation range

#### [MODIFY] [page.tsx (landing)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/page.tsx)
- Reduce Mini3D instances from 3 separate WebGL contexts to 1 shared context (or replace with SVG/CSS icons)
- Fix "Get_Started" button that bypasses auth — should require sign-in
- Refine hero text to the "Verbal Deals, Sealed" pitch

#### [MODIFY] [settings page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/settings/%5B%5B...rest%5D%5D/page.tsx)
- **Replace** the broken static settings page with the working `temp.tsx` implementation
- Wire the save button to `POST /api/users/onboard`
- Wire the profile fetch to `GET /api/users/me`
- Eliminate the duplicate settings problem (single settings page, Clerk UserProfile in a tab/section)

#### [DELETE] [temp.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/settings/temp.tsx)
- Content moved into the main settings page above

---

### Phase 2 — Brand DNA & Onboarding Architecture
*Capture company identity at login time, not during meeting pre-flight.*

---

#### [MODIFY] [IdentityWizard.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/components/IdentityWizard.tsx)
- Fix Step 1: Store the selected brand accent color in wizard state
- Fix Step 3 (Template Strategy): Actually upload the Brand DNA PDF / existing MSA file
  - For "AI_Generate": Send brand vibe data to backend for neural template generation
  - For "Extract_Existing": Upload PDF to backend for AI parsing & style extraction
- Add proper form validation (company name, address, GST are required)
- Send ALL collected data to `POST /api/users/onboard` (including template strategy, brand_accent, uploaded file reference)

#### [MODIFY] [onboarding page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/onboarding/page.tsx)
- Add redirect logic: if user already completed onboarding, skip to dashboard
- Replace `alert()` with proper toast notifications

#### [MODIFY] [users.py (backend)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/routers/users.py)
- Expand `POST /api/users/onboard` to accept template_strategy, brand_accent_color, and brand_dna_filename
- Fix deprecated `.dict()` → `.model_dump()`

#### [MODIFY] [dashboard page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/dashboard/page.tsx)
- **Remove** company identity fields (Logo, Company Name, GST, Address) from the pre-flight modal
- Pre-flight should ONLY collect: Client Name, Client Company, Client Contact (email/WhatsApp), Document Types (MSA/Invoice/PO), Coach toggle
- Fetch the user's Brand DNA from backend on load to confirm identity is set up

---

### Phase 3 — Dashboard State Isolation & Un-Freezing
*Fix the "Initializing_Vault" freeze and modal state bleed.*

---

#### [MODIFY] [dashboard page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/dashboard/page.tsx)

**A. Fix Audio Upload Input (CRITICAL BUG)**
- The `audioInputRef` is created but the `<input type="file" ref={audioInputRef}>` element is **never rendered** in JSX
- Add the hidden file input element to the component's return JSX
- Wire `handleAudioSelected` to actually process the uploaded file

**B. Fix Modal State Bleed**
- Isolate Live Meeting and Upload Recording into completely separate state objects
- When opening Upload modal: reset ALL live-meeting-specific state
- When opening Live modal: reset ALL upload-specific state
- Create a `resetModalState()` helper that clears everything

**C. Fix "Initializing_Vault" Freeze**
- Add `try/catch/finally` blocks around the API call in `handleStartMeeting`
- The `finally` block must ALWAYS reset `isInitializing` to `false` — currently if the API call fails or returns an unexpected response, the loading state is never cleared
- Add proper error display (toast notification, not console.error)

**D. Fix the Live button mode bug**
- Line 304: Change `onClick={() => setShowPreFlight(true)}` to use the `openPreFlight("live")` function that properly sets mode

**E. Wire the processing flow**
- After successful `POST /api/dashboard/deals/draft`, navigate to `/cockpit?session_id={id}` (for live) or `/processing?session_id={id}` (for upload)
- Add the "Audit_Assets" onClick handler on session rows (navigate to `/review/{session_id}`)

#### [MODIFY] [processing page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/processing/page.tsx)
- Replace fake timed animation with real backend polling
- Call `POST /api/meeting/{session_id}/end` to trigger the LangGraph pipeline
- Poll for completion or use a WebSocket for real-time agent status updates
- Show actual agent names and statuses as they complete

#### [NEW] [backend/routers/upload.py](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/routers/upload.py)
- New endpoint: `POST /api/upload/recording` — accepts audio file upload
- Processes through WhisperAgent for transcription
- Feeds transcript through ContextAgent for term extraction
- Returns session_id for tracking
- Registers the upload in the SessionRegistry so `/api/meeting/{session_id}/end` can generate documents

#### [MODIFY] [main.py (backend)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/main.py)
- Register the new `upload` router
- Fix the redundant audio consumer logic (dead `elif` branch at lines 428-431)

---

### Phase 4 — Amigo Voice Assistant
*Fix the Orb ↔ Backend Grid connection and make Amigo actually smart.*

---

#### [MODIFY] [VoiceAssistantOrb.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/components/VoiceAssistantOrb.tsx)
- Fix API URL construction (currently may mismatch protocol/host)
- Add conversation history: maintain a `messages[]` array in state, send full history with each request
- Add browser detection for SpeechRecognition — show "Voice input not supported" message on Firefox/Safari
- Add visible loading state while waiting for API response
- Add error handling with user-visible feedback
- Only show the Orb on authenticated pages (not the landing page)
- Connect the canvas waveform to actual audio data from SpeechRecognition

#### [MODIFY] [assistant.py (backend)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/routers/assistant.py)
- Accept a `messages[]` array for conversation history (not just single message)
- Cache the `ChatGroq` client instead of creating new one per request
- Increase `max_tokens` from 150 to 512 for richer responses
- Enhance the system prompt to be a true legal domain expert:
  - Explain contract terms, negotiation strategies, Indian Contract Act concepts
  - Provide contextual help based on what page the user is on
  - Multi-lingual support (English, Hindi, Gujarati, Hinglish)

#### [MODIFY] [layout.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/layout.tsx)
- Conditionally render `VoiceAssistantOrb` only for authenticated users (wrap in Clerk's `<SignedIn>`)

---

### Phase 5 — Cockpit & Live Coaching
*Make the live meeting interception actually work with real AI intelligence.*

---

#### [MODIFY] [cockpit page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/cockpit/page.tsx)
- **Add `<Suspense>` boundary** around `useSearchParams()` (Next.js 14 requirement)
- Replace hardcoded keyword-based term detection with real data from `ContextAgent` (arrives via WebSocket `transcript` and `pulse` events)
- Replace hardcoded coach advice with real `StrategistAgent` tips (arrives via WebSocket `pulse` events with `kind: "TIP"`)
- Add a visual toggle for the Negotiation Coach (when disabled, don't show strategist tips)
- Display real-time commitments as detected by the backend
- Add "End Meeting" button that triggers `POST /api/meeting/{session_id}/end` and navigates to processing
- Add real audio level visualization using AudioContext analyser node data

#### [MODIFY] [useLiveAudio.ts](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/hooks/useLiveAudio.ts)
- Expose commitment data and strategist tips from WebSocket events to the consuming component
- Add `audioLevel` output for visualization
- Fix: Clear `pendingRef` buffer on successful reconnection

---

### Phase 6 — E-Sign Vault & Document Dispatch
*Wire the sign page to real backend-generated documents and implement the dual-sign flow.*

---

#### [MODIFY] [review page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/review/%5Bsession_id%5D/page.tsx)
- Replace hardcoded terms with real data fetched from backend (`GET /api/dashboard/deals` or a new review endpoint)
- Add ability to edit/confirm terms before minting
- "Mint Documents" should trigger `POST /api/meeting/{session_id}/end` (if not already triggered) and navigate to `/sign/{session_id}`

#### [MODIFY] [sign page](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/sign/%5Bsession_id%5D/page.tsx)
- Fetch REAL documents from backend (MSA, Invoice, PO) using session_id
- Extract signature vector data (x, y, timestamp strokes) from the canvas
- Wire "Sign & Lock" button to `POST /api/signature/execute` with the biometric signature data
- Wire "Download" to receive the actual password-protected PDF from the backend response
- Wire "Dispatch to Client" to `POST /api/dispatch/send` (even if currently stubbed on backend)
- Fix the `isDispatching`/`isProcessing` naming confusion

#### [MODIFY] [SuccessHandshake.tsx](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/components/animations/SuccessHandshake.tsx)
- Wire "Download_Package" button to trigger PDF download
- Wire "Return_to_Dashboard" button to navigate to `/dashboard`
- Update CSS classes to use current theme tokens

#### [MODIFY] [dispatch.py (backend)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/routers/dispatch.py)
- Implement simulated email dispatch (log with realistic format, store dispatch record)
- Implement simulated WhatsApp dispatch (same approach)
- Return proper tracking information

---

### Cross-Cutting Improvements (Applied Throughout All Phases)

#### [MODIFY] [useSafeUser.ts](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/hooks/useSafeUser.ts)
- Fix Rules of Hooks violation — always call `useUser()` but conditionally use its result

#### [MODIFY] [globals.css](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/frontend/app/globals.css)
- Add toast notification styles
- Add skeleton loading styles
- Add smooth scroll behavior
- Ensure "Titanium & Frost" premium feel with refined spacing and typography

#### [MODIFY] [dashboard.py (backend)](file:///c:/Users/Admin/Desktop/JPN%20STUDIO/ANTARIK/Outskill%20X%20Openai%20buildathon/Voicecontract/backend/routers/dashboard.py)
- Fix deprecated `.dict()` → `.model_dump()`
- Calculate real `conversion_rate` instead of hardcoded 72.5
- Remove dev fallback mock data

#### Clean up unused dependencies
- Remove `@supabase/supabase-js` from frontend `package.json` (not used; backend handles DB)
- Remove `framer-motion-3d` from frontend `package.json` (never imported)

---

## Verification Plan

### Automated Tests
After each phase, verify:

```bash
# Backend: Start the server and check health
cd Voicecontract && python run.py
# Test: GET http://localhost:8000/healthz → should return 200 with agent status

# Frontend: Build check (catches TypeScript & import errors)
cd Voicecontract/frontend && npm run build
# Must complete with zero errors

# Frontend: Dev server
cd Voicecontract/frontend && npm run dev
# Must load without console errors
```

### Manual Verification (Using Playwright MCP Browser)
For each phase, I will use the Playwright browser tool to:

1. **Phase 0**: Verify `CLERK_SECRET_KEY` is NOT visible in page source or network requests
2. **Phase 1**: Screenshot the landing page to verify 3D device fitting, scroll the page to verify animation smoothness, verify settings page loads without duplication
3. **Phase 2**: Walk through the onboarding wizard, verify Brand DNA is captured and persisted
4. **Phase 3**: Open Dashboard → click "Start Live Meeting" → verify modal opens without freeze → fill details → verify navigation to cockpit. Repeat for "Upload Recording". Verify no state bleed between modals.
5. **Phase 4**: Click the Amigo orb → type a message → verify response appears → verify conversation history persists within session
6. **Phase 5**: Enter cockpit → verify audio capture starts → verify transcription appears → verify AI coaching tips appear
7. **Phase 6**: Navigate to sign page with a real session → verify documents are populated → sign → verify PDF download → verify dispatch
