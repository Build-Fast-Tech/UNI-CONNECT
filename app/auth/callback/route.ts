import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") ?? "email";
  const next       = searchParams.get("next") ?? "/onboarding";
  const errorParam = searchParams.get("error");
  const errorDesc  = searchParams.get("error_description");

  // Validate redirect against allowlist to prevent open redirect
  const allowedPaths = ["/onboarding", "/feed", "/profile", "/notes", "/chat", "/study", "/jobs", "/clubs", "/societies", "/inbox", "/calendar", "/gpa", "/coding", "/ai", "/feedback"];
  const safeNext = allowedPaths.includes(next) ? next : "/onboarding";

  // Supabase redirected here with an error (e.g. link already used / expired)
  if (errorParam) {
    const msg = errorDesc ?? errorParam;
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(msg)}`
    );
  }

  // Collect every cookie Supabase wants to write (the refreshed session) and
  // apply it to the FINAL redirect response below. This is the fix for the
  // "have to click Google/GitHub twice" bug: when the session cookies were set
  // via next/headers and we then returned a separate NextResponse.redirect, the
  // Set-Cookie headers could be dropped, so the first round-trip landed back on
  // /login unauthenticated and only the second attempt stuck.
  const cookieStore = await cookies();
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { pendingCookies.push(...cookiesToSet); },
      },
    }
  );

  // Build a redirect that is GUARANTEED to carry the freshly-set session cookies.
  const redirectWithSession = (path: string) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as never)
    );
    return res;
  };

  // PKCE flow: Supabase sends ?code=... after verifying on their server
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has completed onboarding (has university_id set)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .maybeSingle(); // maybeSingle() returns null (not an error) when no row exists yet

        const isAlreadyOnboarded = !!profile?.university_id;

        // Non-onboarded users ALWAYS go to /onboarding regardless of ?next=.
        // Onboarded users respect ?next= so they land on the page they tried
        // to access before logging in (defaults to /feed).
        const destination = isAlreadyOnboarded
          ? (safeNext !== "/onboarding" ? safeNext : "/feed")
          : "/onboarding";

        return redirectWithSession(destination);
      }
      // User object not available — fall back to safeNext
      return redirectWithSession(safeNext);
    }
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(error.message)}`
    );
  }

  // OTP / token_hash flow: link goes directly to this route with the token
  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });
    if (!error) {
      return redirectWithSession(safeNext);
    }
    console.error("OTP verification error:", error.message);
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(error.message)}`
    );
  }

  // No code or token — just go to verify page (shows resend option)
  return NextResponse.redirect(`${origin}/verify`);
}
