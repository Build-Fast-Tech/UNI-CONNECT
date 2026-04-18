"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUpAction(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.fullName },
      emailRedirectTo: `${origin}/onboarding`,
    },
  });

  if (error) return { error: error.message };
  return {};
}

export async function signInAction(data: {
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) return { error: error.message };
  redirect("/feed");
}
