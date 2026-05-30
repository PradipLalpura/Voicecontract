# VOICECONTRACT: MASTER IDEATION & EXECUTION PLAN

## 1. THE PROBLEM STATEMENT
Freelancers and small agencies often agree on scope, price, and deadlines over a call. The call ends, but nobody sends a contract. Two weeks later the client says "that's not what we agreed." And there's nothing in writing. Most freelancers and small businesses lose money not because they can't do the work—but because the paperwork never happened. The gap between "we discussed it" and "we have something in writing" is a massive financial liability.

## 2. THE SOLUTION: VOICECONTRACT
VoiceContract is an AI agent powered by advanced LLMs (Codex/Llama/Whisper) that acts as an autonomous legal engine. It sits in on client meetings (live or via uploaded recording) and listens to the conversation. 

**The LangGraph Pipeline:**
1.  **Ingestion:** The agent listens to the live meeting or uploaded recording.
2.  **Cross-Check & Extraction:** A secondary AI agent cross-checks everything. If something critical is missing (like a payment schedule or revision policy), it flags it live during the meeting or asks for confirmation post-upload.
3.  **Coaching (Optional):** An optional "Negotiation Coach" agent can be enabled to guide the user during the live meeting on what to say (or not say) to close the deal favorably.
4.  **Minting:** Under 60 seconds after the call ends, VoiceContract generates actual, structured legal documents (Master Service Agreement, GST Invoice, Purchase Order). 
5.  **Customization:** The documents are formatted perfectly according to the user's specific "Brand DNA" (a pre-uploaded template or an AI-extracted style from their past documents).
6.  **Dispatch & Dual E-Sign:** The generated documents are presented for the provider to sign, then instantly dispatched via WhatsApp and Email to the client for their signature. Documents can also be downloaded.

## 3. CURRENT MVP ANALYSIS & IDENTIFIED ISSUES

Based on the original vision and the user's reported `Issues.txt`, the MVP is currently failing on multiple fronts:

**UI/UX & 3D Engine Flaws:**
*   **Hero Text:** Needs to be rewritten to explicitly state the problem/solution.
*   **3D Content Projection:** The UI projected onto the 3D laptop, mobile, and contract models in `Background3D.tsx` does not fit the screen boundaries properly. It looks broken.
*   **Contract Alignment:** The 3D contract model is positioned too high up and is cut off/not visible in the viewport.
*   **Duplicate Settings:** Clicking "Vault Settings" opens two overlapping settings modals/pages.

**Functional & Architectural Blockers:**
*   **Amigo (Voice Assistant):** The assistant is failing to connect to the "grid" (backend WebSocket/API). It is completely non-functional.
*   **Dashboard Modal Freeze:** Both "Upload Call Recording" and "Start Live Meeting" open modals that accept input, but when "Submit" is clicked, they freeze on "Initializing_Vault...". 
*   **Modal State Bleed:** Closing the Upload modal and opening the Live modal shows the exact same stuck screen with no inputs, indicating shared, corrupted React state.
*   **Missing Brand DNA:** The onboarding/dashboard process completely fails to capture the user's "Brand DNA" (company details, logo, formatting preferences) as required by the ideation.
*   **Broken Template Engine:** The promised feature of allowing users to generate a custom template or upload their own existing template for the AI to extract and use is missing/non-functional.

## 4. TASK IDEATION & ARCHITECTURAL OVERHAUL

To build the "Smartest Brain," we must discard hacky workarounds and implement robust, state-managed systems.

**A. Smart Ingestion & Cross-Check:**
The backend must handle multi-lingual audio (English, Hindi, Gujarati, Hinglish) flawlessly. We will use Whisper (large-v3) for transcription. The extraction agent must intelligently identify standard terms and aggressively flag missing ones.

**B. The Negotiation Coach:**
We will implement a true toggle for the "Coach." When active during a live session, it will push real-time WebSocket alerts to the Cockpit UI advising the user.

**C. The Template Engine & Brand DNA:**
Onboarding MUST mandate Company Name, Address, GST, and a "Template Strategy". Users can either upload a PDF (which the AI parses to learn their format) or ask the AI to generate a custom one based on their brand vibe. This must be saved to Supabase securely.

**D. The Ephemeral Dual E-Sign:**
The Vault UI must explicitly show the generated PDF (styled correctly). It must allow the Provider to sign, lock the document, and then trigger a backend dispatch (simulated WhatsApp/Email API) for the client.

## 5. PHASES OF EXECUTION

**Phase 1: 3D Engine & UI Refinement**
*   Fix the HTML projection scaling inside `Background3D.tsx` so the mock UIs fit perfectly onto the laptop, phone, and contract screens.
*   Adjust the Y-axis positioning of the Contract so it sits squarely in the center of the viewport during the hold phase.
*   Rewrite the Hero text to perfectly encapsulate the "Verbal Deals, Sealed" pitch.
*   Fix the duplicate Settings routing issue (ensure Clerk handles the route cleanly without overlapping custom UI).

**Phase 2: Database & Brand DNA Setup (Start from Scratch)**
*   Delete all existing users from Supabase to start fresh.
*   Implement the true Onboarding Wizard: Capture Company Details AND the Template Strategy (Upload existing vs. Generate custom).
*   Ensure these details are correctly written to the Supabase `users` table via the `/api/users/onboard` endpoint.

**Phase 3: Un-Freezing the Dashboard & State Isolation**
*   Fix the "Initializing_Vault..." freeze. This requires ensuring the `handleStartMeeting` function successfully communicates with the backend, creates a session, and routes the user to the `/cockpit` or `/processing` page.
*   Isolate the React state between the "Upload" and "Live" modals so they do not bleed into each other.

**Phase 4: Amigo The Voice Assistant**
*   Fix the `/api/assistant/chat` endpoint to ensure it connects correctly.
*   Ensure the frontend `AmigoOrb` component successfully sends and receives transcripts.
*   Optimize the Groq system prompt to handle multi-lingual inputs smartly.

**Phase 5: The Cockpit & Live Coaching**
*   Implement the Cockpit UI to handle the live meeting.
*   Add the visual toggle for the Negotiation Coach.

**Phase 6: The Dual E-Sign Vault**
*   Build the final review screen where the generated MSA, Invoice, and PO are displayed.
*   Implement the dual signature flow: Provider signs -> locks -> Dispatches via WhatsApp/Email.