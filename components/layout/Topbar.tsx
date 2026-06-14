"use client";

import { Search, Bell, Menu, Plus } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn, sanitizeSearchTerm } from "@/lib/utils";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

interface Result {
  id: string;
  type: "note" | "job" | "university" | "user";
  title: string;
  sub: string;
  href: string;
  avatar_url?: string | null;
}

interface TopbarProps {
  onMenuClick?: () => void;
  unreadCount: number;
  markAllRead: () => void;
}


interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface RecentMsg {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  sender: { full_name: string; avatar_url: string | null } | null;
}

function NotificationDropdown({ userId }: { userId: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<RecentMsg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const supabase = createClient();

    (async () => {
      const [{ data: notifs }, { data: dms }] = await Promise.all([
        supabase
          .from("notifications")
          .select("id, type, payload, is_read, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("channels")
          .select("id")
          .eq("type", "dm")
          .or(`dm_user_a.eq.${userId},dm_user_b.eq.${userId}`),
      ]);

      setNotifications((notifs as Notification[]) ?? []);

      if (dms && dms.length > 0) {
        const channelIds = dms.map(c => c.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url)")
          .in("channel_id", channelIds)
          .neq("sender_id", userId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentMsgs((msgs as unknown as RecentMsg[]) ?? []);
      }

      setLoading(false);
    })();
  }, [userId]);

  const items: { id: string; type: "system" | "dm"; icon: string; primary: string; secondary: string; time: string; isNew: boolean; href?: string }[] = [];

  for (const n of notifications) {
    const p = (n.payload as Record<string, string>) || {};
    let text = p.message ?? n.type.replace(/_/g, " ");
    let href = "/inbox";
    if (n.type === "note_upvote") { text = `Upvoted your note: ${p.title ?? ""}`; href = p.note_id ? `/notes/${p.note_id}` : "/notes"; }
    if (n.type === "job_application") { text = `Application: ${p.job_title ?? ""}`; href = p.job_id ? `/jobs/${p.job_id}` : "/jobs"; }
    if (n.type === "new_follower") { text = `${p.name ?? "Someone"} followed you`; href = p.user_id ? `/profile/${p.user_id}` : "/profile"; }
    if (n.type === "comment") { text = `New comment on your post`; href = p.note_id ? `/notes/${p.note_id}` : "/feed"; }
    items.push({ id: `sys-${n.id}`, type: "system", icon: "🔔", primary: text, secondary: "", time: n.created_at, isNew: !n.is_read, href });
  }

  for (const m of recentMsgs) {
    const sender = m.sender;
    items.push({
      id: `dm-${m.id}`,
      type: "dm",
      icon: sender?.avatar_url ?? "",
      primary: sender?.full_name ?? "Someone",
      secondary: m.content ?? "",
      time: m.created_at,
      isNew: true,
      href: `/chat/${m.sender_id}`,
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const display = items.slice(0, 8);

  return (
    <div className="p-0">
      <div className="px-4 py-3 border-b border-[rgb(var(--border))]">
        <p className="font-semibold text-sm">Notifications</p>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />)}
        </div>
      ) : display.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm text-[rgb(var(--muted-fg))]">No notifications yet</p>
        </div>
      ) : (
        <div>
          {display.map(item => (
            <Link
              key={item.id}
              href={item.href ?? "/inbox"}
              className={cn(
                "flex items-start gap-3 px-4 py-3 hover:bg-[rgb(var(--muted))] transition-colors cursor-pointer",
                item.isNew && "bg-[rgb(var(--primary)/0.05)]"
              )}
            >
              {item.type === "dm" && item.icon ? (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <img src={item.icon} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-lg flex-shrink-0">{item.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  {item.type === "dm" && <span className="font-semibold">{item.primary}</span>}
                  {item.type === "dm" && <span className="text-[rgb(var(--muted-fg))]">: </span>}
                  <span className={item.type === "dm" ? "text-[rgb(var(--muted-fg))]" : ""}>{item.secondary || item.primary}</span>
                </p>
                <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">
                  {(() => {
                    const d = new Date(item.time);
                    if (isNaN(d.getTime())) return "Recent";
                    try {
                      return `${d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("en-PK", { month: "short", day: "numeric" })}`;
                    } catch {
                      return "Recent";
                    }
                  })()}
                </p>
              </div>
              {item.isNew && <span className="w-2 h-2 rounded-full bg-[rgb(var(--primary))] flex-shrink-0 mt-1.5" />}
            </Link>
          ))}
          <div className="px-4 py-3 border-t border-[rgb(var(--border))]">
            <Link href="/inbox" className="text-xs text-[rgb(var(--primary))] hover:underline">View all notifications →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Topbar({ onMenuClick, unreadCount, markAllRead }: TopbarProps) {
  const router = useRouter();
  const { userId, avatarUrl, initials, fullName } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstName = fullName.split(" ")[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const supabase = createClient();
    // Sanitize before interpolating into PostgREST filters — prevents `.or()`
    // filter-injection and wildcard injection from the search box.
    const term = sanitizeSearchTerm(q);
    const usernameQuery = (q.startsWith("@") ? q.slice(1) : q)
      .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    if (!term && !usernameQuery) { setResults([]); setOpen(false); setSearching(false); return; }

    // People search is username-only (strip @ if typed)
    const [
      { data: notes }, { data: jobs }, { data: unis }, { data: byUsername },
    ] = await Promise.all([
      supabase.from("notes").select("id, title, subject").eq("status", "published").ilike("title", `%${term}%`).limit(3),
      supabase.from("jobs").select("id, title, company_name").eq("status", "active").ilike("title", `%${term}%`).limit(2),
      supabase.from("universities").select("id, name, short_name, slug").or(`name.ilike.%${term}%,short_name.ilike.%${term}%`).limit(2),
      supabase.from("profiles").select("id, full_name, username, avatar_url")
        .ilike("username", `${usernameQuery}%`).limit(5),
    ]);

    const people = byUsername ?? [];

    const mapped: Result[] = [
      ...people.map(u => ({
        id: u.id, type: "user" as const,
        title: u.full_name,
        sub: u.username ? `@${u.username}` : "No username set",
        href: `/profile/${u.id}`,
        avatar_url: u.avatar_url,
      })),
      ...(notes || []).map(n => ({ id: n.id, type: "note" as const, title: n.title, sub: n.subject, href: `/notes/${n.id}` })),
      ...(jobs  || []).map(j => ({ id: j.id, type: "job"  as const, title: j.title, sub: j.company_name, href: `/jobs/${j.id}` })),
      ...(unis  || []).map(u => ({ id: u.id, type: "university" as const, title: u.name, sub: u.short_name, href: `/universities/${(u as any).slug}` })),
    ];

    setResults(mapped);
    setOpen(true);
    setSearching(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) { setOpen(false); router.push(`/notes?q=${encodeURIComponent(query.trim())}`); }
    if (e.key === "Escape") setOpen(false);
  };

  const TYPE_LABEL: Record<string, string> = { note: "Note", job: "Job", university: "University", user: "Person" };
  const TYPE_COLOR: Record<string, string> = {
    note: "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]",
    job: "bg-[rgb(var(--success)/0.12)] text-[rgb(var(--success))]",
    university: "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]",
    user: "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]",
  };

  return (
    <header className={cn(
      "h-14 flex items-center gap-3 px-3 sm:px-5",
      "border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.8)] backdrop-blur-xl",
      "sticky top-0 z-30"
    )}>
      {/* Mobile menu button */}
      {onMenuClick && (
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors flex-shrink-0" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile logo */}
      <Link href="/feed" className="lg:hidden font-bold text-base tracking-tight flex-shrink-0">
        Uni<span className="text-[rgb(var(--primary))]">Connect</span>
      </Link>

      {/* Desktop greeting */}
      <div className="hidden lg:flex flex-col justify-center flex-shrink-0 min-w-[180px]">
        <span className="text-sm font-semibold leading-tight text-[rgb(var(--fg))]">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </span>
        {unreadCount > 0 ? (
          <span className="text-xs text-[rgb(var(--muted-fg))] leading-tight mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs text-[rgb(var(--muted-fg))] leading-tight mt-0.5">
            You&apos;re all caught up!
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-lg min-w-0 mx-auto" ref={wrapperRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            aria-label="Search notes, jobs, people, and universities"
            placeholder="Search notes, jobs, people, universities..."
            className={cn(
              "w-full h-9 pl-9 pr-3 rounded-xl text-sm",
              "bg-[rgb(var(--muted))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
          {open && (
            <div className="absolute top-full right-0 md:left-0 md:right-0 mt-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl z-50 overflow-hidden w-[85vw] max-w-sm md:w-full">
              {searching && <p className="text-xs text-[rgb(var(--muted-fg))] px-4 py-3">Searching…</p>}
              {!searching && results.length === 0 && query.trim() && (
                <p className="text-xs text-[rgb(var(--muted-fg))] px-4 py-3">No results for &ldquo;{query}&rdquo;</p>
              )}
              {results.map(r => (
                <Link key={r.id} href={r.href} onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--muted))] transition-colors">
                  {r.type === "user" ? (
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white">
                        {r.avatar_url
                          ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                          : r.title.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0", TYPE_COLOR[r.type])}>
                      {TYPE_LABEL[r.type]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className={cn("text-xs truncate", r.type === "user" ? "text-[rgb(var(--muted-fg))] font-mono" : "text-[rgb(var(--muted-fg))]")}>{r.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        <ThemeSwitcher />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="relative p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
              onClick={() => markAllRead()}
            >
              <Bell className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
              {unreadCount > 0 && (
                <span className={cn(
                  "absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full",
                  "bg-[rgb(var(--destructive))] text-white text-[10px] font-bold",
                  "flex items-center justify-center leading-none shadow"
                )}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-80 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl overflow-hidden"
            >
              <NotificationDropdown userId={userId} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* New Post button — desktop */}
        <Link
          href="/notes/upload"
          className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>

        {/* Mobile avatar */}
        <Link href="/profile" className="lg:hidden">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
