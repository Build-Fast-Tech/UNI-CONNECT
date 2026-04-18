import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase env vars missing — URL: ${url ? "ok" : "MISSING"}, KEY: ${key ? "ok" : "MISSING"}`
    );
  }

  return createSupabaseClient<Database>(url, key);
}
