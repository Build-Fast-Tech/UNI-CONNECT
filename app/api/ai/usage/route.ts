import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 3;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Role-based unlimited tier (admins/moderators) mirrors can_send_ai_message.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const unlimited =
    profile?.role === "admin" || profile?.role === "moderator";

  if (unlimited) {
    return Response.json({
      limit: DAILY_LIMIT,
      used: 0,
      remaining: DAILY_LIMIT,
      unlimited: true,
    });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Count user messages in the last 24h across all of this user's conversations.
  const { data: convos } = await (supabase as any)
    .from("ai_conversations")
    .select("id")
    .eq("user_id", user.id);

  const convoIds = (convos ?? []).map((c: { id: string }) => c.id);

  let used = 0;
  if (convoIds.length > 0) {
    const { count } = await (supabase as any)
      .from("ai_messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .eq("role", "user")
      .gte("created_at", since);
    used = count ?? 0;
  }

  return Response.json({
    limit: DAILY_LIMIT,
    used,
    remaining: Math.max(0, DAILY_LIMIT - used),
    unlimited: false,
  });
}
