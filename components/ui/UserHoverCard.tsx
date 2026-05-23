"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { User, MessageSquare, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  uniShort?: string | null;
  children: React.ReactNode;
  myId?: string | null;
}

export function UserHoverCard({ userId, name, avatarUrl, uniShort, children, myId }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [starting, setStarting] = useState(false);

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleMessage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!myId || starting || myId === userId) return;
    setStarting(true);

    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("type", "dm")
      .or(`and(dm_user_a.eq.${myId},dm_user_b.eq.${userId}),and(dm_user_a.eq.${userId},dm_user_b.eq.${myId})`)
      .maybeSingle();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }

    const { data: created } = await supabase
      .from("channels")
      .insert({ type: "dm", dm_user_a: myId, dm_user_b: userId })
      .select("id")
      .single();

    if (created) router.push(`/chat/${created.id}`);
    setStarting(false);
  };

  return (
    <HoverCard.Root openDelay={300} closeDelay={100}>
      <HoverCard.Trigger asChild>{children}</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={6}
          className={cn(
            "z-50 w-56 rounded-2xl border border-[rgb(var(--border))]",
            "bg-[rgb(var(--card))] shadow-xl p-3 space-y-3",
            "animate-in fade-in-0 zoom-in-95 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center">
              {avatarUrl
                ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{initials}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{name}</p>
              {uniShort && (
                <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> {uniShort}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => router.push(`/profile/${userId}`)}
              className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Profile
            </button>
            {myId && myId !== userId && (
              <button
                onClick={handleMessage}
                disabled={starting}
                className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {starting ? "…" : "Message"}
              </button>
            )}
          </div>
          <HoverCard.Arrow className="fill-[rgb(var(--card))]" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
