import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps the user logged in
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify");

  const isAppRoute = !isAuthRoute &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    pathname !== "/";

  // Not logged in → send to login
  if (!user && isAppRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in + auth route → send to feed
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Logged in but onboarding incomplete → send to onboarding
  if (user && isAppRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("university_id")
      .eq("id", user.id)
      .single();

    if (!profile?.university_id) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
