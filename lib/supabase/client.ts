import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      `Supabase env vars missing. URL=${url ?? "undefined"} KEY=${key ? "[set]" : "undefined"}`
    );
  }
  client = createSupabaseClient<Database>(url, key);
  return client;
}
