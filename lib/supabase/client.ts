import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Module-level singleton browser Supabase client.
 *
 * CRITICAL: Every call to createBrowserClient() sets up internal auth-state
 * listeners. Calling it during a React render phase (even inside useMemo)
 * triggers state updates on other components mid-render → React error #310
 * "Cannot update a component while rendering a different component."
 *
 * The fix: create ONE client at module load time. All components share this
 * single instance. It is only ever initialised once per page load.
 *
 * Do NOT add cookieOptions — it would affect the auth session cookie and
 * could cause users to be unexpectedly logged out.
 */
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
