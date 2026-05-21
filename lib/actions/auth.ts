"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

export async function signUpAction(data: {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}): Promise<{ error?: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return { error: `Server config missing: URL=${url ? "ok" : "missing"} KEY=${key ? "ok" : "missing"}` };
    }

    const supabase = await createClient();
    // Prefer the explicit env var; fall back to the request origin.
    // Never use localhost in production — Supabase will reject the redirect.
    const origin = (await headers()).get("origin") ?? "";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (origin.startsWith("http://localhost") ? "" : origin);

    const redirectTo = siteUrl
      ? `${siteUrl}/auth/callback?next=/onboarding`
      : undefined; // let Supabase use its configured Site URL as fallback

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          ...(data.username ? { username: data.username.toLowerCase() } : {}),
        },
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return { error: "Too many sign-up attempts. Please wait a few minutes and try again." };
      }
      return { error: error.message };
    }
    redirect("/verify");
  } catch (e: unknown) {
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: (e as Error)?.message ?? String(e) };
  }
}

export async function signInAction(data: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { error: `Server config missing: URL=${url ? "ok" : "missing"} KEY=${key ? "ok" : "missing"}` };
  }

  const supabase = await createClient();

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };

  // Check if onboarding is complete
  if (signInData.user) {
    const cookieStore = await cookies();
    const alreadyOnboarded = cookieStore.get("uc_onboarded")?.value === "1";

    if (!alreadyOnboarded) {
      // First login or cookie cleared — verify onboarding via DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", signInData.user.id)
        .single();

      if (!profile?.university_id) {
        redirect("/onboarding");
      }
    }

    // Mark onboarding complete so proxy.ts stops redirecting
    cookieStore.set("uc_onboarded", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect("/feed");
}
