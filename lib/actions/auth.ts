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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          ...(data.username ? { username: data.username.toLowerCase() } : {}),
        },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/feed`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return { error: "Too many sign-up attempts. Please wait a few minutes and try again." };
      }
      return { error: error.message };
    }
    return {};
  } catch (e: unknown) {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("university_id")
      .eq("id", signInData.user.id)
      .single();

    if (!profile?.university_id) {
      redirect("/onboarding");
    }

    // Mark onboarding complete so proxy.ts stops redirecting
    const cookieStore = await cookies();
    cookieStore.set("uc_onboarded", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect("/feed");
}
