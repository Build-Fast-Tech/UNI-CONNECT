import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client.
 *
 * @supabase/ssr's createBrowserClient already stores the PKCE code verifier
 * in cookies (not localStorage), so it works correctly across browser contexts
 * including mobile WebViews and OAuth redirects in new tabs.
 *
 * Do NOT add cookieOptions here — it would affect the auth session cookie too
 * and could cause users to be unexpectedly logged out.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
