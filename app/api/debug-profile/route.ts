import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Get current user
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not logged in", userError: userError?.message });
  }

  // Use service role to bypass RLS and check raw DB state
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, bio")
    .eq("id", user.id)
    .single();

  // Try a direct upsert with service role
  const { error: upsertError } = await admin
    .from("profiles")
    .upsert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? "Test" }, { onConflict: "id" });

  // Now try reading with anon key (normal user)
  const { data: rlsProfile, error: rlsError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .single();

  // Test UPDATE via RLS
  const { error: updateTestError } = await supabase
    .from("profiles")
    .update({ bio: "__diagnostic_test__" })
    .eq("id", user.id);

  return Response.json({
    user_id: user.id,
    db_profile: profile ?? null,
    db_error: profileError?.message ?? null,
    read_with_rls: rlsProfile ?? null,
    rls_read_error: rlsError?.message ?? null,
    update_via_rls: updateTestError ? "BLOCKED: " + updateTestError.message : "success",
  });
}
