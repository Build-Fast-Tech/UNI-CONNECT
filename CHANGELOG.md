# Changelog

All notable changes from the audit, security-hardening, and landing-page redesign pass.
Content, routes, APIs, database behavior, and business logic are unchanged — only the
landing-page presentation and a set of security/quality fixes were modified.

---

## [Unreleased] — Onboarding / auth / permission stability fixes

Root-caused and fixed the "black screen / stuck loading / failed redirect" reports in the
signup → personal-info → camera → microphone flow. No content, branding, or business logic
was changed.

**Root causes found**
- `app/(auth)/onboarding/page.tsx` → `handleComplete` had no `try/catch`: any thrown error
  (lost session, slow storage upload, network blip) left `loading` stuck `true` forever —
  a frozen button with no redirect.
- `components/providers/UserProvider.tsx` had no timeout: a stalled `getUser()`/profile
  fetch on slow/lost connections could keep the app in a never-loaded state.
- `components/PermissionsModal.tsx`: a dismissed browser prompt could leave a permission
  row stuck on "Waiting…" indefinitely.
- `components/layout/LayoutErrorBoundary.tsx` fallback was a literal **black screen**
  (`background:#000`) — the exact symptom when Sidebar/Topbar crashed.
- No `loading.tsx` anywhere → blank screens during route transitions/Suspense.
- No error boundary for the `(auth)`/onboarding route group.

**Fixes**
- **Onboarding** — wrapped completion in `try/catch/finally`; `loading` is *always* cleared;
  avatar upload is best-effort (never blocks completion); lost session redirects to
  `/login?next=/onboarding`; success uses `router.replace("/feed")`; double-submit guarded;
  errors shown inline instead of a blocking `alert()`.
- **UserProvider** — added an 8s watchdog + `try/catch` so the app always reaches a rendered
  state (never an infinite spinner) even if auth/DB stalls or throws.
- **PermissionsModal** — each permission request races a 45s timeout so the UI always
  settles into a retry-able state; SSR-safe `window` guard. The modal remains fully
  dismissible ("Skip for now"), so permissions never block the app.
- **LayoutErrorBoundary** — themed, friendly fallback (uses `--bg`/`--fg`) with a Reload
  action instead of a black screen.
- **Loading states** — added `app/(app)/loading.tsx` (skeleton cards) and
  `app/(auth)/loading.tsx` (spinner) so no transition shows a blank/black screen.
- **Error boundary** — added `app/(auth)/error.tsx` (retry + "Back to login", auto-recovers
  from stale-chunk errors) covering signup/login/onboarding.

**Existing protections confirmed working:** `app/(app)/error.tsx` (chunk-error auto-reload +
retry), `app/global-error.tsx` (root fallback), route protection in `proxy.ts`/middleware,
`OnboardingGuard` (runs once via a ref; never redirects on DB error), Supabase PKCE session
persistence via cookies.

---

## [Unreleased] — Security hardening + Landing UI redesign

### 🎨 Landing page redesign (UI/UX only — content preserved)

A premium, modern SaaS-style landing page (Linear / Stripe / Notion / Vercel inspired)
was implemented **using the existing site copy verbatim**. No headings, descriptions,
button labels, routes, or links were changed.

**Added**
- `app/landing-redesign.css` — self-contained design system, fully scoped under
  `.uc-landing` so it never leaks into the authenticated app. The landing has its OWN
  light/dark theme — **LIGHT (white background) by default to match the design reference**,
  switching to dark only when the wrapper carries `.ucl-dark` (toggled locally, persisted in
  `uc-landing-theme`); this is independent of the app-wide ThemeProvider. Plus Jakarta Sans /
  Inter / JetBrains Mono typography, soft shadows, large radii (12–34px), blue accent (#335CFF).
- `components/landing/redesign/Orbital.tsx` — the hero centerpiece: a central
  "UniConnect Core" with six feature modules (AI Assistant, Community, Notes, Coding,
  Resume Builder, Career Hub) placed on an SVG orbit, animated connector dots, floating
  motion, and a mouse-parallax 3-D tilt. Positions are computed deterministically so SSR
  and client markup match (no hydration mismatch). Honors `prefers-reduced-motion`.
- `components/landing/redesign/RedesignedLanding.tsx` — the full landing in the new design:
  - Pill navbar with shrink-on-scroll, working theme toggle, and a mobile drawer.
  - Two-column hero (existing badge + "One campus. Every campus." headline + existing CTAs).
  - University marquee (existing university list).
  - Feature bento grid (existing 5 feature cards + mini-demos).
  - Dashboard showcase with animated tabs (AI / Coding / Resume / Career — existing features).
  - Social-proof + stats section (existing stats + Pakistani university badges).
  - "How it works" 3-step section (existing steps).
  - FAQ accordion (existing 6 Q&As).
  - Gradient CTA banner (existing "Ready to connect?" copy).
  - Footer (existing links + "Made with care in Pakistan 🇵🇰").
  - Scroll-reveal animations via IntersectionObserver, reduced-motion aware.

**Changed**
- `app/page.tsx` — now renders `<RedesignedLanding />`.

**Removed (per request)**
- Testimonials / "reviews" section.
- Hero "joined by students" trust line (avatar stack).
- The 3D `NexusScene` cosmic background is no longer used on the landing (the new design
  is clean/token-based), which also eliminated a console runtime error (see below).

> The previous landing components (`HeroSection`, `FeaturesSection`, `StatsSection`,
> `HowItWorks`, `TestimonialsSection`, `FAQSection`, `CTASection`, `MarketingNav`,
> `Footer`, `UniversityTicker`, `nexus/*`) remain in the repo but are no longer imported.

### 🔒 Security

**Added authentication + rate limiting + input validation to abusable API routes**
- `app/api/coding/compile/route.ts` — was **unauthenticated** (anyone could run arbitrary
  code on the compiler backend). Now requires auth, rate-limits per user (30/min),
  validates language against an allowlist, and caps code (50 KB) and stdin (20 KB).
- `app/api/coding/ai-problem/route.ts` — was unauthenticated and called the paid Gemini
  API. Now requires auth, rate-limits (6/min), guards JSON parsing, clamps all inputs.
- `app/api/ai-schedule/route.ts` — was unauthenticated **and** referenced
  `NEXT_PUBLIC_GEMINI_API_KEY` (a key name that ships to the browser bundle). Now requires
  auth, rate-limits, validates inputs, and uses only the server-side `GEMINI_API_KEY`.
- `app/api/ai/ai-schedule/route.ts` — added rate limiting + guarded parsing.
- `app/api/cv-parse/route.ts` — added rate limiting (20/hr) + guarded parsing.
- `app/api/gifs/route.ts` — now requires auth + rate-limits (proxy spends our Giphy/Tenor
  quota); fixed a `NaN` bug in the `limit` query param; replaced `any` casts with types.

**Database (Row-Level Security)**
- `supabase/migrations/037_security_rls_hardening.sql` (new) — enables RLS on two tables
  that were created without it:
  - `audit_logs` — admin-only read; client writes denied (was world-readable/writable).
  - `subjects` — public read, admin-only write (was world-writable via the anon key).

**Removed**
- `app/api/debug-env/route.ts` and `app/api/debug-profile/route.ts` — debug endpoints
  (the latter used the service-role key to write to the DB). Removed from the tree.

### 📦 Dependencies
- Ran `npm audit fix`: resolved 4 of 6 moderate advisories (`uuid`/`ws`/`svix` via `resend`).
  The 2 remaining are `postcss` bundled inside Next.js (build-time only; fixable only by a
  breaking Next downgrade, so intentionally left — see SECURITY_REPORT.md).

### 🐛 Quality / correctness fixes
- `app/layout.tsx` — removed a duplicate, shadowed `jsonLd` so the richer SEO structured
  data actually ships.
- `components/layout/Topbar.tsx` — added an `aria-label` to the global search input.
- `components/landing/HeroSection.tsx` — replaced `Math.random()` star positions with a
  deterministic seeded array (fixed a React hydration mismatch + layout shift). *(legacy
  hero, retained for reference)*
- `components/landing/nexus/NexusScene.tsx` — removed an external HDR fetch
  (`<Environment preset="city" />`) that the production CSP blocked; replaced with local
  lights. *(legacy scene, no longer used by the landing)*
- `app/globals.css` — renamed a duplicate `@keyframes shimmer-slide` (was silently
  overriding the Magic UI shimmer button); disabled smooth-scroll under
  `prefers-reduced-motion`.

### ✅ Verification
- `npx tsc --noEmit` — clean.
- `npx eslint` on all changed files — clean.
- Landing verified live in-browser: desktop, tablet (768px), and mobile (375px), in both
  light and dark themes, with zero console errors.
