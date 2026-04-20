import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase session cookie (set when user logs in)
  const hasSession = request.cookies.has("sb-mwpuwgoesgvsvknhqmor-auth-token") ||
    request.cookies.getAll().some(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  const hasOnboarded = request.cookies.has("uc_onboarded");

  const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Already logged in → skip auth pages, go to feed
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // Not logged in → can't access app pages
  const appPrefixes = ["/feed", "/profile", "/notes", "/jobs", "/chat", "/ai", "/inbox", "/cvs", "/universities"];
  const isAppRoute = appPrefixes.some((r) => pathname.startsWith(r));

  if (!hasSession && (isAppRoute || pathname.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but onboarding not done → send to onboarding
  if (hasSession && !hasOnboarded && isAppRoute) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
