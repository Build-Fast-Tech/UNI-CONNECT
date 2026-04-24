"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LS_KEY = (userId: string) => `uc_inbox_last_seen_${userId}`;

function readLastSeen(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LS_KEY(userId));
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeLastSeen(userId: string, ts: number) {
  try {
    localStorage.setItem(LS_KEY(userId), String(ts));
  } catch {}
}

// Short, non-jarring notification beep generated via Web Audio API so we don't
// need to ship a binary asset.
function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = w.AudioContext || w.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {}
}

export interface InboxNotifications {
  unreadCount: number;
  markAllRead: () => void;
}

export function useInboxNotifications(userId: string | null): InboxNotifications {
  const supabase = createClient();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const dmChannelIdsRef = useRef<Set<string>>(new Set());
  const lastSeenRef = useRef<number>(0);
  const activeChannelRef = useRef<string | null>(null);

  // Track which chat channel the user is currently viewing so we don't flag
  // those messages as unread or beep when the user is already reading.
  useEffect(() => {
    const match = pathname?.match(/^\/chat\/([^/]+)/);
    activeChannelRef.current = match ? match[1] : null;
  }, [pathname]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    lastSeenRef.current = now;
    writeLastSeen(userId, now);
    setUnreadCount(0);
  }, [userId]);

  // Clear badge automatically when user lands on inbox or a chat channel.
  useEffect(() => {
    if (!userId) return;
    const onInboxRoute =
      pathname === "/inbox" || (pathname?.startsWith("/chat/") ?? false);
    if (!onInboxRoute) return;
    const now = Date.now();
    lastSeenRef.current = now;
    writeLastSeen(userId, now);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route-driven UI sync
    setUnreadCount(0);
  }, [pathname, userId]);

  // Initial load: fetch DM channels for this user, compute unread count since
  // last-seen timestamp, then subscribe to realtime inserts.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let sub: ReturnType<typeof supabase.channel> | null = null;

    lastSeenRef.current = readLastSeen(userId) || Date.now();

    (async () => {
      const { data: dms } = await supabase
        .from("channels")
        .select("id")
        .eq("type", "dm")
        .or(`dm_user_a.eq.${userId},dm_user_b.eq.${userId}`);

      if (cancelled) return;

      const ids = (dms ?? []).map(d => d.id as string);
      dmChannelIdsRef.current = new Set(ids);

      if (ids.length > 0) {
        const sinceIso = new Date(lastSeenRef.current).toISOString();
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("channel_id", ids)
          .neq("sender_id", userId)
          .eq("is_deleted", false)
          .gt("created_at", sinceIso);
        if (!cancelled) setUnreadCount(count ?? 0);
      }

      if (cancelled) return;

      // Single broad subscription to DM messages; filter client-side by channel
      // membership in our cached set. This avoids one subscription per channel.
      sub = supabase
        .channel("inbox-notifications-" + userId)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const row = payload.new as {
              id: string;
              channel_id: string;
              sender_id: string;
              is_deleted?: boolean;
              created_at: string;
            };
            if (row.is_deleted) return;
            if (row.sender_id === userId) return;
            if (!dmChannelIdsRef.current.has(row.channel_id)) return;
            if (activeChannelRef.current === row.channel_id) return;

            playBeep();
            setUnreadCount(c => c + 1);
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "channels" },
          (payload) => {
            const row = payload.new as {
              id: string;
              type: string;
              dm_user_a: string | null;
              dm_user_b: string | null;
            };
            if (row.type !== "dm") return;
            if (row.dm_user_a === userId || row.dm_user_b === userId) {
              dmChannelIdsRef.current.add(row.id);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (sub) supabase.removeChannel(sub);
    };
    // `supabase` is created per render but behaves as a singleton client;
    // depending on it would cause the subscription to tear down/rebuild on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { unreadCount, markAllRead };
}
