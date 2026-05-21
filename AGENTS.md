# UniConnect

## Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, `cva` + `cn()` pattern (see `components/ui/button.tsx`)
- **Auth**: Supabase `@supabase/ssr` — PKCE flow via cookies (browser client) & `exchangeCodeForSession` (server)
- **Database**: Supabase Postgres with 36 migrations in `supabase/migrations/`
- **Deploy**: Vercel (auto-deploys from `master` branch)
- **APK**: Companion Capacitor project at `abdullahxf90/UniConnect-Official-APK` (separate private repo)

## Key commands
- `npm run dev` — dev server on `localhost:3000`
- `npm run build` — production build (requires Supabase env vars)
- `npm run lint` — ESLint (Next.js + TypeScript config)

## Project structure
```
app/                  # Next.js App Router
  (app)/              # Authenticated routes (feed, notes, chat, jobs, etc.) — wrapped in AppShell
  (auth)/             # Unauthenticated routes (login, signup, onboarding, verify)
  auth/callback/      # OAuth + email link callback handler
  api/                # Route handlers (ai, coding, cv-parse, employer, etc.)
  page.tsx            # Landing page (mostly lazy-loaded sections)
  layout.tsx          # Root layout — ThemeProvider, SmoothScroll, fonts
components/
  layout/             # AppShell, Sidebar, Topbar, Footer, MarketingNav
  chat/               # ChannelSidebar, ChatShell, CameraModal
  landing/            # Landing page sections (Hero, Features, FAQ, etc.)
  ui/                 # button, ScrollReveal, ThemeSwitcher, UserHoverCard, UsernameSetupModal
  providers/          # UserProvider (auth context), ThemeProvider, SmoothScrollProvider
lib/
  supabase/           # client.ts (browser), server.ts (server), middleware.ts (defined but NOT wired)
  actions/auth.ts     # Server actions: signUpAction, signInAction
  hooks/              # useAcademic, useInboxNotifications, useSyncedTimer, useTimer
  channelUnread.ts    # localStorage-based per-channel read tracking
  rate-limit.ts       # In-memory sliding-window rate limiter (single-replica only)
  utils.ts            # cn(), formatRelativeTime(), formatting helpers
  coding/problems.ts  # Coding challenge problem bank
types/database.ts     # Generated Supabase database types (636 lines)
```

## Auth flow
- **OAuth** (Google/GitHub): `signInWithOAuth()` → Supabase PKCE → `/auth/callback` → `exchangeCodeForSession(code)` → cookie-based session
- **Email/password**: `signInAction()` server action → on success, checks `uc_onboarded` cookie or DB → redirects to `/feed` or `/onboarding`
- **Middleware**: `proxy.ts` (Next.js 16 proxy convention) imports `updateSession()` from `lib/supabase/middleware.ts`. Protects app routes redirecting unauthenticated to `/login`, and redirects authenticated away from auth routes to `/feed`. Onboarding is excluded from redirect.

## Styling conventions
- Theme variables use `rgb(var(--name))` pattern, defined in `globals.css` as raw RGB values
- Two themes: `dark` (pure black bg) and `light` (warm brass #A57841)
- Use existing CSS variables instead of hardcoded colors:
  - `--bg`, `--fg`, `--muted`, `--muted-fg`, `--primary`, `--primary-fg`, `--border`, `--card`, `--ring`, `--destructive`, `--success`

## Noteworthy
- `legacy-peer-deps=true` in `.npmrc`
- Node 22 required (`.nvmrc`)
- CSP headers set in `next.config.ts` for Supabase, Google Fonts, Gemini API, Giphy
- `lucide-react` is tree-shaken via `modularizeImports` in `next.config.ts`
- Channel unread tracking uses `localStorage` (`uc_channel_last_read_{userId}`)
- Inbox notification tracking uses `localStorage` (`uc_inbox_last_seen_{userId}`)
- Realtime subscriptions used for chat messages, presence, notifications
- `/api/debug-env` exists (dev-only, returns Supabase URL/key status and session info)
- Permissions modal (`PermissionsModal.tsx`) handles camera/mic/notification permission requests with localStorage flag
- Rate limiting is in-memory (`Map`) — not safe across multiple Vercel replicas

## Testing
- No test framework is configured
- Build with `npm run build` (will fail locally without Supabase env vars — expected)

## Upstream
- **Vercel**: https://uniconnect-official.vercel.app (auto-deploys from `abdullahxf90/UniConnect` master)
- **APK repo**: https://github.com/abdullahxf90/UniConnect-Official-APK (private, GitHub Actions builds APK on push)
