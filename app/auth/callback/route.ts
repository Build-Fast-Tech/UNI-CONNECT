import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") ?? "email";
  const next       = searchParams.get("next") ?? "/onboarding";
  const errorParam = searchParams.get("error");
  const errorDesc  = searchParams.get("error_description");

  // Supabase redirected here with an error (e.g. link already used / expired)
  if (errorParam) {
    const msg = errorDesc ?? errorParam;
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(msg)}`
    );
  }

  const supabase = await createClient();

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
          .single();

        const response = NextResponse.redirect(`${origin}${next}`);
        if (profile?.university_id) {
          // User already onboarded — set cookie so middleware doesn't redirect them
          response.cookies.set("uc_onboarded", "1", {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          });
        }
        return response;
      }
      return NextResponse.redirect(`${origin}${next}`);
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
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OTP verification error:", error.message);
    return NextResponse.redirect(
      `${origin}/verify?error=${encodeURIComponent(error.message)}`
    );
  }

  // No code or token — just go to verify page (shows resend option)
  return NextResponse.redirect(`${origin}/verify`);
}
