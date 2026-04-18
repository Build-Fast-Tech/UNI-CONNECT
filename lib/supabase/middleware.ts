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

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAppRoute = ["/feed", "/notes", "/chat", "/jobs", "/cvs", "/ai", "/profile", "/inbox", "/universities"].some(
    p => request.nextUrl.pathname.startsWith(p)
  );

  const isAuthRoute = ["/login", "/signup", "/verify", "/onboarding"].some(
    p => request.nextUrl.pathname.startsWith(p)
  );

  if (isAppRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return supabaseResponse;
}
