import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client.
 *
 * Uses a cookie-based storage adapter (instead of the default localStorage)
 * so the PKCE code verifier is available cross-context — including:
 *  - Mobile WebViews that open a system browser for OAuth
 *  - OAuth redirects that land in a fresh tab
 *
 * Cookies are sent with every HTTP request, so the /auth/callback route
 * can always retrieve the verifier regardless of browser context.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // SameSite=Lax lets the cookie travel with top-level cross-site navigations
        // (exactly what happens during an OAuth redirect back to your site).
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour — PKCE verifier only needs to last the auth flow
        path: "/",
      },
    }
  );
}
