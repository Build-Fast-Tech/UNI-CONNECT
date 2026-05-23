import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Eagerly-initialized browser singleton.
 *
 * WHY EAGER: calling createBrowserClient() sets up internal Supabase auth-state
 * listeners. When a fresh OAuth session cookie exists (new-user login), these
 * listeners fire SYNCHRONOUSLY and call React setState on UserProvider — while
 * Topbar or Sidebar are still in their render pass. That is exactly what React
 * error #310 ("Cannot update a component while rendering a different component")
 * prohibits.
 *
 * Initialising the singleton HERE (at module-load time, before any React render
 * starts) means the auth listeners fire once, safely, before React takes over.
 * Every subsequent createClient() call just returns the cached reference — no
 * new listeners, no state updates, no #310.
 *
 * On the server (SSR of "use client" components), typeof window === "undefined"
 * so _client stays null and we create an isolated instance per call. This is
 * safe because all actual Supabase API calls live inside useEffect callbacks
 * that never run during SSR.
 */
const _client =
  typeof window !== "undefined"
    ? createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    : null;

export function createClient() {
  if (_client) return _client;
  // Server-side fallback — isolated per call, no cookie access during SSR render.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
