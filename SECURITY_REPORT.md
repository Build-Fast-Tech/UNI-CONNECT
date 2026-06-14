# Security Report — UniConnect

Scope: full review of API routes, authentication/authorization, Supabase Row-Level
Security (38 migrations), storage policies, secrets handling, XSS/SSRF/open-redirect
surfaces, security headers/CSP, and the new landing-page code.

Overall: the codebase was already security-conscious (CSP, security headers, HTML-escaped
emails, open-redirect allowlist, ownership checks, a sliding-window rate limiter). The
issues below were the real gaps; all have been fixed.

---

## 1. Vulnerabilities found & fixed

### 1.1 Unauthenticated remote code execution farm — **Critical**
- **Where:** `app/api/coding/compile/route.ts`
- **Issue:** No auth, no rate limit, no size/language validation. Anyone on the internet
  could POST arbitrary source to be executed on the Piston/Judge0 backend, unlimited.
- **Impact:** Free compute for attackers, quota/cost exhaustion, large-payload abuse
  against the upstream compiler under our credentials.
- **Fix:** Require an authenticated user; per-user rate limit (30/min); language allowlist
  (`cpp/c/python/java`); 50 KB code + 20 KB stdin caps; guarded JSON parsing.

### 1.2 Unauthenticated paid-AI endpoints — **High**
- **Where:** `app/api/coding/ai-problem/route.ts`, `app/api/ai-schedule/route.ts`
- **Issue:** No auth / no rate limit; each call hits the paid Gemini API. Unguarded
  `req.json()` could crash the route.
- **Impact:** Anyone could drain the Gemini quota / run up the bill; DoS via malformed body.
- **Fix:** Require auth; per-user rate limits (6/min); guarded parsing; clamped inputs.

### 1.3 Client-exposed API-key footgun — **High**
- **Where:** `app/api/ai-schedule/route.ts`
- **Issue:** Fell back to `process.env.NEXT_PUBLIC_GEMINI_API_KEY`. The `NEXT_PUBLIC_`
  prefix causes Next.js to inline the value into the browser bundle — if a deployer ever
  set it (the name invites it), the Gemini key would leak to every visitor.
- **Fix:** Removed the fallback; the route uses only the server-side `GEMINI_API_KEY`.

### 1.4 Tables without Row-Level Security — **High**
- **Where:** `audit_logs`, `subjects` (created in `001_initial_schema.sql`, never had RLS).
- **Issue:** In Supabase, a `public` table with RLS **disabled** is fully readable and
  writable by anyone holding the anon key (which ships in the browser). So the admin audit
  trail was readable/forgeable, and the subjects catalogue was vandalizable.
- **Fix:** `supabase/migrations/037_security_rls_hardening.sql` —
  - `audit_logs`: RLS on, admin-only read, client writes denied.
  - `subjects`: RLS on, public read, admin-only write.
  - Idempotent and only tightens access — safe to run on the live DB.

### 1.5 Unauthenticated quota-spending proxy + bug — **Medium**
- **Where:** `app/api/gifs/route.ts`
- **Issue:** No auth/rate limit (spends our Giphy/Tenor quota); `parseInt` of the `limit`
  param could become `NaN` and be forwarded upstream.
- **Fix:** Require auth; per-user rate limit (40/min); sanitized `q`/`type`; robust `limit`
  clamp (1–24, default 9).

### 1.6 Unmetered authenticated AI/file route — **Medium**
- **Where:** `app/api/cv-parse/route.ts`
- **Issue:** Auth + ownership were enforced, but no rate limit on a route that downloads a
  file and runs a paid Gemini call.
- **Fix:** Added a per-user rate limit (20/hr) + guarded parsing.

### 1.7 Service-role debug endpoints in the tree — **Medium**
- **Where:** `app/api/debug-env/route.ts`, `app/api/debug-profile/route.ts`
- **Issue:** Diagnostic routes (gated by `NODE_ENV`), but `debug-profile` used the
  **service-role key to write to the DB**. Such routes should not exist in the committed
  codebase.
- **Fix:** Both endpoints removed.

### 1.8 Production CSP blocked an external asset (availability) — **Low/UX**
- **Where:** `components/landing/nexus/NexusScene.tsx` (legacy 3D background)
- **Issue:** `<Environment preset="city" />` fetched an HDR from an external CDN that the
  production `connect-src` correctly blocks → runtime error in the 3D scene.
- **Fix:** Removed the external dependency (local lights instead). The redesigned landing
  no longer uses this scene at all.

---

## 2. Reviewed — no change required (already secure)

- **No committed secrets / no `.env` files** in the repository.
- **XSS:** all email templates HTML-escape user input; the code-syntax `highlight()`
  helpers escape `&<>` before adding markup; every `dangerouslySetInnerHTML` is static
  JSON-LD. No injectable sinks. The redesigned landing renders only static, escaped text.
- **Open redirect:** `app/auth/callback/route.ts` validates `next` against an allowlist.
- **Storage:** CV objects are owner-only at the storage layer; uploads scoped to the user's
  own folder; avatars/notes are intentionally public-read.
- **RLS (rest of schema):** `profiles` is restricted to authenticated; `messages` is gated
  by channel membership; `cvs` by ownership/employer role; `reactions`/`poll_votes` were
  already fixed (migration 035). Reports/notifications are insert/own-read only.
- **Security headers / CSP:** present in `next.config.ts` — `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod),
  and a CSP with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`.
- **Auth:** Supabase PKCE flow; `getUser()` used for server-side verification.

---

## 3. Recommendations (not blocking; require infra or product decisions)

1. **CSP `script-src` still allows `'unsafe-inline'`/`'unsafe-eval'`.** Tightening it
   properly needs per-request **nonces** wired through middleware and must be tested against
   a production build (a wrong CSP white-screens the live site). Highest-value next step.
2. **Rate limiter is in-memory** (`lib/rate-limit.ts`) — correct per instance, but resets
   across Vercel replicas. Move to **Upstash/Redis** for multi-replica correctness.
3. **`profiles` is readable by any authenticated user**, including `email`/`cgpa`. Consider
   a public **view** exposing only safe columns and revoking direct table `select`.
4. **`employer_applications` allows anonymous insert** (needed for the public application
   form). Route-level rate limiting helps, but a determined actor can hit Supabase REST
   directly — consider routing inserts through a server action with the service role.
5. **Dependency hygiene:** `npm audit fix` was run — resolved 4 of 6 moderate advisories
   (`uuid`/`ws`/`svix` pulled in via `resend`). The remaining **2 moderate advisories are
   `postcss` bundled *inside* Next.js** (`next/node_modules/postcss`): a build-time CSS
   stringify XSS that is not a runtime vector for this app, and is only fixable by
   `npm audit fix --force` which downgrades Next 16 → 9 (a breaking regression — do NOT run).
   These clear automatically when Next bumps its bundled `postcss`. Keep `npm audit` in CI.

---

_Last updated: 2026-06-14_
