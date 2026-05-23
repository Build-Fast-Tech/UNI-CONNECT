import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Skip if Supabase is not configured (local dev without env)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  // IMPORTANT: Must create the response first and mutate it in setAll.
  // Do NOT recreate supabaseResponse inside setAll — that drops cookies.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Step 1: write to request so subsequent server reads see them
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: rebuild response with updated request, then set all cookies on it
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT run code between createServerClient and getUser.
  // A simple mistake can make it hard to debug issues with users being
  // randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAppRoute = [
    "/feed", "/notes", "/chat", "/jobs", "/cvs", "/ai",
    "/profile", "/inbox", "/universities", "/study", "/clubs",
    "/societies", "/calendar", "/gpa", "/coding", "/feedback",
  ].some((p) => pathname.startsWith(p));

  const isAuthRoute = ["/login", "/signup", "/verify", "/onboarding"].some(
    (p) => pathname.startsWith(p)
  );

  if (isAppRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user && !pathname.startsWith("/onboarding")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/feed";
    return NextResponse.redirect(redirectUrl);
  }

  // IMPORTANT: Must return supabaseResponse (not a new NextResponse) so that
  // the session cookies set by Supabase are forwarded to the browser.
  return supabaseResponse;
}
