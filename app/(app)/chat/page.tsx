import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { MessageSquare } from "lucide-react";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("channels")
    .select("id")
    .eq("type", "global")
    .single();

  if (data?.id) {
    redirect(`/chat/${data.id}`);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[rgb(var(--muted-fg))]">
      <MessageSquare className="w-10 h-10 opacity-40" />
      <p className="text-sm">No channels available yet</p>
    </div>
  );
}
