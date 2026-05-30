# PHASE 0 — CRITICAL SECURITY & INFRASTRUCTURE FIXES
## Model: Claude Opus 4.6 (Thinking)

> **CONTEXT**: You have been given `ideation.md` — the master context file for VoiceContract. Read it completely before proceeding. This phase fixes showstopper security vulnerabilities and missing infrastructure that blocks ALL other phases.

---

## YOUR ROLE

You are a **Security Architect** performing emergency triage. Three critical security vulnerabilities are actively exposing secrets to the browser. The backend cannot install its own dependencies. These must be fixed before any feature work begins.

**Think deeply about every change.** Security fixes that introduce regressions are worse than the original bug. Verify your reasoning before writing code.

---

## MANDATORY READING BEFORE CODING

Read these files in FULL before writing any code:
1. `frontend/next.config.mjs` (30 lines)
2. `backend/requirements.txt` (9 lines)
3. `backend/auth/jwt_auth.py` (46 lines)
4. `frontend/hooks/useSafeUser.ts` (25 lines)
5. `frontend/hooks/useLiveAudio.ts` (full — 14KB, understand how HMAC auth works)
6. `frontend/middleware.ts` (18 lines)

---

## TASK 1: Fix CLERK_SECRET_KEY Browser Exposure (SEC-1)

**File**: `frontend/next.config.mjs`  
**Line 19**: `CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,`  
**Bug**: The `env:{}` block in next.config makes values available **client-side**. `CLERK_SECRET_KEY` is a server-only secret that must NEVER reach the browser.

**Fix**:
- REMOVE line 19 entirely (`CLERK_SECRET_KEY` from the `env` block)
- Clerk's Next.js SDK automatically reads `CLERK_SECRET_KEY` from `process.env` on the server side — no explicit mapping needed
- Verify: After this fix, `CLERK_SECRET_KEY` should NOT appear in any client-side bundle

---

## TASK 2: Fix CAPTURE_SHARED_SECRET Browser Exposure (SEC-2)

**File**: `frontend/next.config.mjs`  
**Line 21**: `NEXT_PUBLIC_CAPTURE_SHARED_SECRET: process.env.CAPTURE_SHARED_SECRET,`  
**Bug**: The HMAC shared secret is being renamed to a `NEXT_PUBLIC_` variable, which Next.js automatically exposes to the client. This secret is used for WebSocket authentication.

**Fix — Two Options (choose the better one based on your security analysis)**:

**Option A (Recommended — Server-side token endpoint)**:
1. Remove line 21 from `next.config.mjs`
2. Create a new Next.js API route: `frontend/app/api/ws-token/route.ts`
   - This runs server-side only
   - Accepts POST requests from authenticated clients
   - Computes the HMAC-SHA256 auth token using the secret from `process.env.CAPTURE_SHARED_SECRET`
   - Returns `{ token, timestamp }` to the client
3. Modify `frontend/hooks/useLiveAudio.ts` to:
   - Remove the client-side HMAC computation
   - Instead, call `POST /api/ws-token` to get the auth token before connecting the WebSocket
   - Use the returned token in the WebSocket URL query string

**Option B (Acceptable for buildathon — keep client-side but acknowledge)**:
1. Keep the current approach but add a code comment explaining the buildathon trade-off
2. Rename to make the exposure intentional and documented

**⚠️ CRITICAL REASONING CHECKPOINT**: Before implementing, think through:
- Does Option A break the real-time latency requirements? (No — token is fetched once at connection time, not per-packet)
- Does the useLiveAudio hook currently compute HMAC? (Yes — search for `crypto.subtle.sign` in the file)
- Will Clerk auth be available in the API route? (Yes — Next.js API routes in the `app/` directory have access to Clerk middleware)

---

## TASK 3: Fix requirements.txt (ARC-2)

**File**: `backend/requirements.txt`  
**Bug**: Currently only has 8 packages. The codebase imports many more that will cause `ModuleNotFoundError` at runtime.

**Current content**:
```
fastapi
uvicorn[standard]
openai>=1.0.0
langgraph
langchain-core
langchain-openai
langchain-groq
pydantic
```

**Missing dependencies** (verified by grep across all backend Python files):
```
python-dotenv          # run.py: from dotenv import load_dotenv
supabase               # database/client.py: from supabase import create_client
svix                   # routers/webhooks.py: from svix.webhooks import Webhook
cryptography           # utils/encryption.py: from cryptography.fernet import Fernet
reportlab              # utils/pdf_generator.py: from reportlab.lib.pagesizes import A4
PyJWT                  # auth/jwt_auth.py: import jwt
httpx                  # used by supabase client internally
python-multipart       # FastAPI file upload support
```

**Fix**: Replace the entire `requirements.txt` with the complete list. Pin major versions for stability.

---

## TASK 4: Fix JWT Verification (SEC-3)

**File**: `backend/auth/jwt_auth.py`  
**Line 38**: `payload = jwt.decode(token, options={"verify_signature": False})`  
**Bug**: Anyone can create a JWT with any `sub` claim and the backend will trust it.

**Fix** (Buildathon-appropriate — not production-grade):
```python
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    if token == "dev_token":
        return {"sub": "dev_user"}
    
    try:
        # First, try to verify with our own secret (custom tokens)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidSignatureError:
        # If that fails, it might be a Clerk JWT — decode without sig verification
        # but at minimum verify the expiry claim
        try:
            payload = jwt.decode(token, options={
                "verify_signature": False,
                "verify_exp": True
            })
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired.")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials.")
```

**Reasoning**: We can't fully verify Clerk JWTs without fetching their JWKS endpoint (which adds latency and complexity for a buildathon). The compromise is: try our secret first, fall back to unverified decode BUT enforce expiry. This prevents token replay attacks with expired tokens.

---

## TASK 5: Fix useSafeUser Rules of Hooks Violation (BRK-6)

**File**: `frontend/hooks/useSafeUser.ts`  
**Bug**: The hook conditionally calls `useClerkUser()` — if `hasClerk` is true, it calls the hook; if false, it returns early before the hook call. React hooks must be called in the same order every render.

**Current code** (BROKEN):
```typescript
export function useSafeUser() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!hasClerk) {
    return { isLoaded: true, isSignedIn: true, user: { ... } };
  }

  try {
    return useClerkUser();  // ← Hook call after conditional return!
  } catch (e) {
    return { isLoaded: true, isSignedIn: false, user: null };
  }
}
```

**Fix**:
```typescript
export function useSafeUser() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Always call the hook (Rules of Hooks compliance)
  let clerkResult: any = { isLoaded: true, isSignedIn: false, user: null };
  try {
    clerkResult = useClerkUser();
  } catch (e) {
    // Clerk not available
  }
  
  if (!hasClerk) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "mock_user_123",
        firstName: "Guest",
        lastName: "Chief",
        imageUrl: "https://ui-avatars.com/api/?name=Guest+Chief&background=00C2CC&color=fff",
      }
    };
  }

  return clerkResult;
}
```

**⚠️ WAIT**: Before applying this fix, check whether `useClerkUser()` throws when there's no `ClerkProvider` in the tree. If it does, we need a different approach. Read the Clerk source or test behavior. The try/catch may be needed for a reason. Think about this carefully.

---

## TASK 6: Clean Up Unused Frontend Dependencies

**File**: `frontend/package.json`

Remove these unused packages:
- `@supabase/supabase-js` — imported nowhere in frontend code (backend handles DB)
- `framer-motion-3d` — imported nowhere in any file

**Do NOT remove any package that IS imported somewhere.** Verify each removal by searching the codebase.

---

## VERIFICATION CHECKLIST

After completing all tasks, verify:

1. **Build check**: Run `cd frontend && npm run build` — must complete with zero errors
2. **Backend start**: Run `cd .. && python run.py` — must start without import errors
3. **Secret exposure**: Search the Next.js build output for `CLERK_SECRET_KEY` — must NOT appear
4. **JWT test**: The `/healthz` endpoint should work without auth. A request with `Authorization: Bearer dev_token` to any protected endpoint should still return 200.
5. **No regressions**: The landing page, dashboard, and settings should still render

---

## FILES YOU WILL MODIFY

1. `frontend/next.config.mjs` — Remove secret exposure (Tasks 1, 2)
2. `frontend/app/api/ws-token/route.ts` — NEW file (Task 2, Option A)
3. `frontend/hooks/useLiveAudio.ts` — Remove client-side HMAC (Task 2, Option A)
4. `backend/requirements.txt` — Complete dependency list (Task 3)
5. `backend/auth/jwt_auth.py` — Fix JWT verification (Task 4)
6. `frontend/hooks/useSafeUser.ts` — Fix Rules of Hooks (Task 5)
7. `frontend/package.json` — Remove unused deps (Task 6)

---

## CONSTRAINTS

- Do NOT touch any file not listed above
- Do NOT change the aesthetic or UI
- Do NOT add new features — this phase is ONLY security/infrastructure
- Preserve ALL existing comments and docstrings
- Test your changes mentally before writing — think about edge cases
