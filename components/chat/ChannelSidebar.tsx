"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Building2, Plus, User, X, Pin, PinOff, Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";

type ChannelKind = "global" | "university" | "branch" | "dm";

interface Channel {
  id: string;
  kind: ChannelKind;
  name: string;
  meta?: string;
  avatarChar?: string;
  lastMessage: string | null;
  lastAt: string | null;
  partnerId?: string; // DM partner's userId
}

interface ChannelSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const PINS_KEY = (uid: string) => `uc_pinned_chats_${uid}`;

function readPins(uid: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(PINS_KEY(uid));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function writePins(uid: string, pins: Set<string>) {
  try { localStorage.setItem(PINS_KEY(uid), JSON.stringify([...pins])); } catch {}
}

function StatusDot({ online, isDm }: { online: boolean; isDm: boolean }) {
  if (!isDm) return null;
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[rgb(var(--card))]",
        online ? "bg-blue-500 shadow-[0_0_6px_1px_rgba(59,130,246,0.8)]" : "bg-black"
      )}
    />
  );
}

function ChannelRow({
  channel, icon, active, pinned, onPinToggle, onLinkClick, isOnline,
}: {
  channel: Channel; icon: React.ReactNode; active: boolean; pinned: boolean;
  onPinToggle: (id: string) => void; onLinkClick?: () => void; isOnline?: boolean;
}) {
  const isDm = channel.kind === "dm";
  return (
    <div className={cn("group relative", pinned && "bg-[rgb(var(--primary)/0.04)] rounded-xl")}>
      <Link
        href={`/chat/${channel.id}`}
        onClick={onLinkClick}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
          active
            ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]"
            : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]",
        )}
      >
        {/* Icon with online/offline dot for DMs */}
        <span className="flex-shrink-0 relative">
          {icon}
          <StatusDot online={!!isOnline} isDm={isDm} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="truncate">{channel.name}</span>
            {pinned && <Pin className="w-3 h-3 flex-shrink-0 fill-current opacity-70" />}
          </div>
          {channel.lastMessage && (
            <p className="text-[11px] opacity-70 truncate leading-tight">{channel.lastMessage}</p>
          )}
        </div>
        {channel.lastAt && (
          <span className="text-[10px] opacity-60 flex-shrink-0">{formatRelativeTime(channel.lastAt)}</span>
        )}
      </Link>

      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onPinToggle(channel.id); }}
        title={pinned ? "Unpin" : "Pin"}
        aria-label={pinned ? "Unpin chat" : "Pin chat"}
        className={cn(
          "absolute right-1 top-1.5 p-1 rounded-md transition-opacity",
          pinned
            ? "opacity-90 text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.12)]"
            : "opacity-0 group-hover:opacity-80 text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]",
        )}
      >
        {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
      </button>
    </div>
  );
}

interface UserSearchResult {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
}

function UserSearch({ onLinkClick, myId }: { onLinkClick?: () => void; myId: string | null }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (v: string) => {
    const clean = v.replace(/^@/, "");
    setQuery(clean);
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!clean.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .ilike("username", `${clean.trim()}%`)
        .neq("id", myId ?? "")
        .limit(6);
      setResults((data as UserSearchResult[]) ?? []);
      setOpen(true);
      setSearching(false);
    }, 300);
  };

  const openDm = async (partnerId: string) => {
    if (!myId) return;
    setOpen(false);
    setQuery("");
    setResults([]);

    // Find or create DM channel
    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("type", "dm")
      .or(`and(dm_user_a.eq.${myId},dm_user_b.eq.${partnerId}),and(dm_user_a.eq.${partnerId},dm_user_b.eq.${myId})`)
      .single();

    let channelId = existing?.id;
    if (!channelId) {
      const { data: created } = await supabase
        .from("channels")
        .insert({ type: "dm", dm_user_a: myId, dm_user_b: partnerId })
        .select("id")
        .single();
      channelId = created?.id;
    }
    if (!channelId) return;
    if (onLinkClick) onLinkClick();
    window.location.href = `/chat/${channelId}`;
  };

  return (
    <div className="px-2 mb-2 relative" ref={wrapRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search by username"
          className="w-full h-8 pl-8 pr-3 rounded-lg text-xs bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ring))]"
        />
        {searching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-[rgb(var(--muted-fg))]" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-2 right-2 top-full mt-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl z-50 overflow-hidden">
          {results.map(u => (
            <button key={u.id} onClick={() => openDm(u.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[rgb(var(--muted))] transition-colors text-left">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{u.full_name}</p>
                {u.username && <p className="text-[10px] text-[rgb(var(--primary))] font-mono truncate">@{u.username}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query && !searching && results.length === 0 && (
        <div className="absolute left-2 right-2 top-full mt-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl z-50 px-3 py-2.5">
          <p className="text-xs text-[rgb(var(--muted-fg))]">No user found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function ChannelList({
  globalChannel, uniChannels, dmChannels, pins, onTogglePin, onLinkClick,
  showCloseButton, onClose, onlineUsers, myId,
}: {
  globalChannel: Channel | null; uniChannels: Channel[]; dmChannels: Channel[];
  pins: Set<string>; onTogglePin: (id: string) => void; onLinkClick?: () => void;
  showCloseButton?: boolean; onClose?: () => void; onlineUsers: Set<string>; myId: string | null;
}) {
  const pathname = usePathname();
  const activeId = pathname?.match(/^\/chat\/([^/]+)/)?.[1] ?? null;

  const sortFn = (a: Channel, b: Channel) => {
    const pa = pins.has(a.id) ? 1 : 0;
    const pb = pins.has(b.id) ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime();
  };

  const dmsSorted  = [...dmChannels].sort(sortFn);
  const unisSorted = [...uniChannels].sort(sortFn);

  const iconFor = (ch: Channel): React.ReactNode => {
    if (ch.kind === "global") return <Globe className="w-4 h-4" />;
    if (ch.kind === "university" || ch.kind === "branch") return <Building2 className="w-4 h-4" />;
    return (
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-[8px] font-bold text-white">
        {ch.avatarChar ?? <User className="w-3 h-3" />}
      </div>
    );
  };

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">Channels</p>
        {showCloseButton && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors" aria-label="Close channels">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {globalChannel && (
          <ChannelRow
            channel={globalChannel} icon={iconFor(globalChannel)}
            active={activeId === globalChannel.id} pinned={pins.has(globalChannel.id)}
            onPinToggle={onTogglePin} onLinkClick={onLinkClick}
          />
        )}

        {unisSorted.length > 0 && (
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))] px-3 mb-1">My University</p>
            {unisSorted.map(ch => (
              <ChannelRow key={ch.id} channel={ch} icon={iconFor(ch)}
                active={activeId === ch.id} pinned={pins.has(ch.id)}
                onPinToggle={onTogglePin} onLinkClick={onLinkClick} />
            ))}
          </div>
        )}

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">Direct Messages</p>
          </div>

          {/* Search by username */}
          <UserSearch onLinkClick={onLinkClick} myId={myId} />

          {dmsSorted.length === 0 && (
            <p className="text-xs text-[rgb(var(--muted-fg))] px-3 py-1.5">No conversations yet</p>
          )}

          {dmsSorted.map(ch => (
            <ChannelRow
              key={ch.id} channel={ch} icon={iconFor(ch)}
              active={activeId === ch.id} pinned={pins.has(ch.id)}
              onPinToggle={onTogglePin} onLinkClick={onLinkClick}
              isOnline={ch.partnerId ? onlineUsers.has(ch.partnerId) : false}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function ChannelSidebar({ mobileOpen = false, onClose }: ChannelSidebarProps) {
  const supabase = createClient();
  const [myId, setMyId]                   = useState<string | null>(null);
  const [globalChannel, setGlobalChannel] = useState<Channel | null>(null);
  const [uniChannels, setUniChannels]     = useState<Channel[]>([]);
  const [dmChannels, setDmChannels]       = useState<Channel[]>([]);
  const [pins, setPins]                   = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers]     = useState<Set<string>>(new Set());

  const togglePin = useCallback((channelId: string) => {
    if (!myId) return;
    setPins(prev => {
      const next = new Set(prev);
      next.has(channelId) ? next.delete(channelId) : next.add(channelId);
      writePins(myId, next);
      return next;
    });
  }, [myId]);

  const fetchLastMessages = useCallback(async (channelIds: string[]) => {
    if (channelIds.length === 0) return new Map<string, { content: string | null; created_at: string }>();
    const { data } = await supabase
      .from("messages")
      .select("channel_id, content, created_at")
      .in("channel_id", channelIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    const map = new Map<string, { content: string | null; created_at: string }>();
    for (const m of data ?? []) {
      if (!map.has(m.channel_id)) map.set(m.channel_id, { content: m.content, created_at: m.created_at });
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load channels
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);
      setPins(readPins(user.id));

      const { data: global } = await supabase.from("channels").select("id, type, name").eq("type", "global").single();
      const { data: profile } = await supabase.from("profiles").select("university_id, universities(short_name)").eq("id", user.id).single();

      let uniChannel: { id: string; name: string | null } | null = null;
      if (profile?.university_id) {
        let { data: existing } = await supabase.from("channels").select("id, name").eq("type", "university").eq("university_id", profile.university_id).single();
        if (!existing) {
          const uniName = (profile.universities as unknown as { short_name?: string } | null)?.short_name ?? "University";
          const { data: created } = await supabase.from("channels").insert({ type: "university", university_id: profile.university_id, name: `${uniName} General` }).select("id, name").single();
          existing = created;
        }
        uniChannel = existing;
      }

      const { data: dms } = await supabase.from("channels").select("id, type, dm_user_a, dm_user_b").eq("type", "dm").or(`dm_user_a.eq.${user.id},dm_user_b.eq.${user.id}`).limit(30);

      const dmIds = (dms ?? []).map(d => d.id);
      const channelIds = [...(global ? [global.id] : []), ...(uniChannel ? [uniChannel.id] : []), ...dmIds];
      const lastMsgMap = await fetchLastMessages(channelIds);

      if (global) {
        const last = lastMsgMap.get(global.id);
        setGlobalChannel({ id: global.id, kind: "global", name: global.name ?? "All-Pakistan Chat", lastMessage: last?.content ?? null, lastAt: last?.created_at ?? null });
      }

      if (uniChannel) {
        const uniShort = (profile?.universities as unknown as { short_name?: string } | null)?.short_name ?? "";
        const last = lastMsgMap.get(uniChannel.id);
        setUniChannels([{ id: uniChannel.id, kind: "university", name: uniChannel.name ?? "University", meta: uniShort, lastMessage: last?.content ?? null, lastAt: last?.created_at ?? null }]);
      }

      if (dms && dms.length > 0) {
        const otherIds = dms.map(d => d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a).filter(Boolean) as string[];
        const { data: dmProfiles } = await supabase.from("profiles").select("id, full_name").in("id", otherIds);
        const profileMap = new Map(dmProfiles?.map(p => [p.id, p]) ?? []);

        setDmChannels(dms.map(d => {
          const otherId = (d.dm_user_a === user.id ? d.dm_user_b : d.dm_user_a) ?? "";
          const otherProfile = profileMap.get(otherId);
          const last = lastMsgMap.get(d.id);
          return { id: d.id, kind: "dm", name: otherProfile?.full_name ?? "Unknown", avatarChar: otherProfile?.full_name?.charAt(0).toUpperCase() ?? "?", lastMessage: last?.content ?? null, lastAt: last?.created_at ?? null, partnerId: otherId };
        }));
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global presence — track who is online across the whole app
  useEffect(() => {
    if (!myId) return;
    const pres = supabase.channel("presence:app", {
      config: { presence: { key: myId } },
    });
    pres
      .on("presence", { event: "sync" }, () => {
        const state = pres.presenceState<{ userId: string }>();
        const ids = new Set(
          Object.values(state).map(subs => (subs[0] as { userId?: string })?.userId).filter((id): id is string => !!id)
        );
        setOnlineUsers(ids);
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await pres.track({ userId: myId });
        }
      });
    return () => { supabase.removeChannel(pres); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  // Realtime: bump channel previews on new message
  useEffect(() => {
    if (!myId) return;
    const allIds = new Set<string>([
      ...(globalChannel ? [globalChannel.id] : []),
      ...uniChannels.map(c => c.id),
      ...dmChannels.map(c => c.id),
    ]);
    if (allIds.size === 0) return;

    const sub = supabase
      .channel(`sidebar-preview-${myId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new as { channel_id: string; content: string | null; created_at: string; is_deleted?: boolean };
        if (row.is_deleted || !allIds.has(row.channel_id)) return;
        const apply = <T extends { id: string; lastMessage: string | null; lastAt: string | null }>(c: T) =>
          c.id === row.channel_id ? { ...c, lastMessage: row.content, lastAt: row.created_at } : c;
        setGlobalChannel(prev => prev ? apply(prev) : prev);
        setUniChannels(prev => prev.map(apply));
        setDmChannels(prev => prev.map(apply));
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, globalChannel?.id, uniChannels.length, dmChannels.length]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const listProps = useMemo(() => ({
    globalChannel, uniChannels, dmChannels, pins, onTogglePin: togglePin, onlineUsers, myId,
  }), [globalChannel, uniChannels, dmChannels, pins, togglePin, onlineUsers, myId]);

  return (
    <>
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-[rgb(var(--border))] flex-col overflow-hidden bg-[rgb(var(--card))]">
        <ChannelList {...listProps} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
            <motion.div
              className="fixed top-0 left-0 bottom-0 w-72 z-50 md:hidden flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <ChannelList {...listProps} onLinkClick={onClose} showCloseButton onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
