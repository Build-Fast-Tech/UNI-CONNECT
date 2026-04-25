"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LS_KEY = (userId: string) => `uc_inbox_last_seen_${userId}`;
// No lookback on first load — only count truly new messages received after this session started

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

// ── Audio: module-scoped singleton so user-gesture resume works once per tab ─
let audioCtx: AudioContext | null = null;
let audioPrimed = false;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctx = w.AudioContext || w.webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioCtx = new Ctx();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

function primeAudio() {
  if (audioPrimed) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  ctx.resume().then(() => { audioPrimed = true; }).catch(() => {});
}

function playBeep() {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  try {
    // Resume in case the tab was inactive and the context got suspended.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
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

  // Prime the AudioContext on the first user gesture so browsers let us play
  // sound later without the autoplay block.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const unlock = () => {
      primeAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Track which chat channel the user is currently viewing so we don't flag
  // those messages as unread or beep when the user is already reading them.
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

  // Clear badge automatically when user lands on inbox, any chat channel, or /chat root.
  useEffect(() => {
    if (!userId) return;
    const onInboxRoute =
      pathname === "/inbox" ||
      pathname === "/chat" ||
      (pathname?.startsWith("/chat/") ?? false);
    if (!onInboxRoute) return;
    const now = Date.now();
    lastSeenRef.current = now;
    writeLastSeen(userId, now);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route-driven UI sync
    setUnreadCount(0);
  }, [pathname, userId]);

  // Shared count-computation used by both the initial load and the polling
  // fallback. Uses the latest lastSeenRef + DM channel set.
  const refreshCount = useCallback(async () => {
    if (!userId) return;
    const ids = [...dmChannelIdsRef.current];
    if (ids.length === 0) return;
    const sinceIso = new Date(lastSeenRef.current).toISOString();
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("channel_id", ids)
      .neq("sender_id", userId)
      .eq("is_deleted", false)
      .gt("created_at", sinceIso);
    if (typeof count === "number") setUnreadCount(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Initial load: fetch DM channels, compute unread, subscribe, and start a
  // polling safety net for environments where realtime is misconfigured.
  useEffect(() => {
    if (!userId) {
      dmChannelIdsRef.current = new Set();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on sign-out
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    let sub: ReturnType<typeof supabase.channel> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const stored = readLastSeen(userId);
    const now = Date.now();
    // If no stored timestamp (first session / cleared storage), start from NOW
    // so old messages are never counted as unread.
    lastSeenRef.current = stored > 0 ? stored : now;
    if (!stored) writeLastSeen(userId, now); // persist immediately

    (async () => {
      const { data: dms, error: dmErr } = await supabase
        .from("channels")
        .select("id")
        .eq("type", "dm")
        .or(`dm_user_a.eq.${userId},dm_user_b.eq.${userId}`);

      if (cancelled) return;
      if (dmErr) console.warn("[inbox-notifications] channel fetch failed:", dmErr.message);

      const ids = (dms ?? []).map(d => d.id as string);
      dmChannelIdsRef.current = new Set(ids);
      await refreshCount();

      if (cancelled) return;

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
              refreshCount();
            }
          },
        )
        .subscribe();

      // Safety net: re-count every 30s. Cheap (HEAD request), and protects
      // against realtime drops, replica-identity misconfig, or stale tabs.
      pollTimer = setInterval(() => {
        if (document.visibilityState === "visible") refreshCount();
      }, 30_000);
    })();

    return () => {
      cancelled = true;
      if (sub) supabase.removeChannel(sub);
      if (pollTimer) clearInterval(pollTimer);
    };
    // `supabase` is created per render but behaves as a singleton client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Also refresh when the tab becomes visible again — covers the case where
  // realtime drops while the tab is backgrounded.
  useEffect(() => {
    if (!userId) return;
    const onVis = () => {
      if (document.visibilityState === "visible") refreshCount();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [userId, refreshCount]);

  return { unreadCount, markAllRead };
}
