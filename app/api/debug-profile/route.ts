import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

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

  // Write a timestamped value then read it back immediately
  const testValue = "test_" + Date.now();
  const { error: updateTestError } = await supabase
    .from("profiles")
    .update({ bio: testValue })
    .eq("id", user.id);

  const { data: afterUpdate } = await supabase
    .from("profiles")
    .select("bio, avatar_url, linkedin, github")
    .eq("id", user.id)
    .single();

  return Response.json({
    user_id: user.id,
    full_name: rlsProfile?.full_name,
    update_error: updateTestError?.message ?? null,
    wrote_value: testValue,
    read_back_bio: afterUpdate?.bio,
    save_works: afterUpdate?.bio === testValue,
    avatar_url: afterUpdate?.avatar_url,
  });
}
