# Deploy Checklist — UniConnect

The code is production-ready and the build passes. These are the final steps that
require **your** accounts/credentials and can't be done from the code alone.

## 1. Environment variables (required)
Set these in `.env.local` (local) and in your Vercel project settings (production).
Use **production** keys, never test/dev values, and never commit them.

```
NEXT_PUBLIC_SUPABASE_URL=...          # your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # Supabase anon (public) key
SUPABASE_SERVICE_ROLE_KEY=...         # server-only; never exposed to the client
GEMINI_API_KEY=...                    # server-only (AI features)
# Optional integrations:
RESEND_API_KEY=... / GMAIL_USER=... / GMAIL_APP_PASSWORD=...   # email
GIPHY_API_KEY=... or TENOR_API_KEY=...                        # chat GIFs
JUDGE0_API_KEY=... or PISTON_API_URL=...                      # code execution
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```
> Note: a local placeholder `.env.local` used for the build is intentionally **excluded**
> from this zip — add your real one.

## 2. Run database migrations (required — security-critical)
Apply all SQL in `supabase/migrations/` to your Supabase project, **including the new
`037_security_rls_hardening.sql`** (enables Row-Level Security on `audit_logs` and
`subjects`). Until this runs, those two tables are open to the public anon key.

Verify RLS afterwards: in the Supabase dashboard → Database → Tables, confirm every table
shows "RLS enabled".

## 3. Smoke-test the auth flow (required)
With real keys, test one full round-trip:
- Sign up → receive verification email → verify → land on `/onboarding`.
- Complete onboarding (university → details → profile) → land on `/feed`.
- Log out → log back in → confirm session persists on refresh.
- Try login with wrong password → friendly error (no black screen).
- Grant / deny camera + mic on the permissions prompt → app stays usable either way.

## 4. Dependencies
- `npm install --legacy-peer-deps`
- `npm audit` currently reports **2 moderate** advisories — both are `postcss` bundled
  *inside* Next.js (build-time only). Do **NOT** run `npm audit fix --force` (it downgrades
  Next 16 → 9). They clear when Next updates its bundled copy.

## 5. Build & deploy
- `npm run build` (must pass — it does today).
- Deploy to Vercel; confirm the custom domain + SSL are active.
- Confirm security headers are present on the live site (CSP, HSTS, X-Frame-Options) —
  they're configured in `next.config.ts`.

## 6. Recommended hardening (non-blocking — see SECURITY_REPORT.md)
- Move the rate limiter to Upstash/Redis for multi-replica correctness.
- Tighten CSP `script-src` with per-request nonces (test against a prod build first).
- Restrict `profiles` column exposure (email/cgpa) via a safe view.
