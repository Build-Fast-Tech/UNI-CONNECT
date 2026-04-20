import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let sessionInfo = null;
  let profilesTest = null;

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    sessionInfo = { user_id: user?.id ?? null, error: userError?.message ?? null };

    const { data, error } = await supabase.from("profiles").select("count");
    profilesTest = { ok: !error, error: error?.message ?? null, count: data };
  } catch (e: any) {
    sessionInfo = { error: e?.message };
  }

  return Response.json({
    url_ok: url?.startsWith("https://"),
    key_ok: !!key,
    session: sessionInfo,
    profiles_table: profilesTest,
  });
}
