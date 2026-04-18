"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Search, Plus, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Conversation {
  channelId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  uniShort: string | null;
  lastMessage: string | null;
  lastAt: string | null;
  unread: boolean;
}

interface SearchUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  universities?: { short_name: string } | null;
}

export default function InboxPage() {
  const supabase = createClient();
  const router = useRouter();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);

      const { data: dms } = await supabase
        .from("channels")
        .select("id, dm_user_a, dm_user_b, created_at")
        .eq("type", "dm")
        .or(`dm_user_a.eq.${user.id},dm_user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!dms || dms.length === 0) { setLoading(false); return; }

      const otherIds = dms.map(d =>
        d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a
      ).filter(Boolean) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, universities:universities!university_id(short_name)")
        .in("id", otherIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      const channelIds = dms.map(d => d.id);
      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("channel_id, content, created_at")
        .in("channel_id", channelIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, { content: string | null; created_at: string }>();
      for (const m of lastMsgs ?? []) {
        if (!lastMsgMap.has(m.channel_id)) {
          lastMsgMap.set(m.channel_id, { content: m.content, created_at: m.created_at });
        }
      }

      const result: Conversation[] = dms.map(d => {
        const otherId = (d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a) ?? "";
        const p = profileMap.get(otherId);
        const last = lastMsgMap.get(d.id);
        return {
          channelId: d.id,
          userId: otherId,
          name: p?.full_name ?? "Unknown",
          avatarUrl: p?.avatar_url ?? null,
          uniShort: (p?.universities as any)?.short_name ?? null,
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? d.created_at,
          unread: false,
        };
      });

      result.sort((a, b) =>
        new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime()
      );

      setConvos(result);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, universities:universities!university_id(short_name)")
        .ilike("full_name", `%${searchQuery}%`)
        .neq("id", myId ?? "")
        .limit(8);
      setSearchResults((data as SearchUser[]) ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, myId]);

  const startDm = async (userId: string) => {
    if (!myId || starting) return;
    setStarting(userId);

    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("type", "dm")
      .or(
        `and(dm_user_a.eq.${myId},dm_user_b.eq.${userId}),and(dm_user_a.eq.${userId},dm_user_b.eq.${myId})`
      )
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
    setStarting(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Inbox</h1>
          <p className="text-[rgb(var(--muted-fg))]">Your direct messages</p>
        </div>
        <button
          onClick={() => setShowSearch(s => !s)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            showSearch
              ? "bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
              : "bg-[rgb(var(--primary))] text-white hover:opacity-90"
          )}
        >
          {showSearch ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New DM</>}
        </button>
      </motion.div>

      {/* New DM search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="theme-card p-4 space-y-3 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students by name…"
                autoFocus
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              />
            </div>

            {searching && (
              <p className="text-xs text-[rgb(var(--muted-fg))] px-1">Searching…</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map(u => {
                  const initials = u.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <button
                      key={u.id}
                      onClick={() => startDm(u.id)}
                      disabled={starting === u.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                          : <span className="text-xs font-bold text-white">{initials}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.full_name}</p>
                        {u.universities && (
                          <p className="text-xs text-[rgb(var(--muted-fg))]">
                            {(u.universities as any).short_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[rgb(var(--primary))] font-medium flex-shrink-0">
                        {starting === u.id ? "Opening…" : "Message"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-sm text-[rgb(var(--muted-fg))] px-1">No users found for &ldquo;{searchQuery}&rdquo;</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation list */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="theme-card p-4 flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-[rgb(var(--muted))]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[rgb(var(--muted))] rounded w-1/3" />
                <div className="h-3 bg-[rgb(var(--muted))] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : convos.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="theme-card p-12 text-center"
        >
          <Inbox className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="font-semibold mb-1">No messages yet</p>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Start a conversation with another student using the &ldquo;New DM&rdquo; button above.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1">
          {convos.map((c, i) => {
            const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <motion.div
                key={c.channelId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Link
                  href={`/chat/${c.channelId}`}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[rgb(var(--muted)/0.5)] transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-white">{initials}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm group-hover:text-[rgb(var(--primary))] transition-colors truncate">
                        {c.name}
                      </span>
                      {c.uniShort && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium flex-shrink-0">
                          {c.uniShort}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[rgb(var(--muted-fg))] truncate">
                      {c.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  {c.lastAt && (
                    <span className="text-[10px] text-[rgb(var(--muted-fg))] flex-shrink-0">
                      {formatRelativeTime(c.lastAt)}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
