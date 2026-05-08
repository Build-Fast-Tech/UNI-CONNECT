"use client";

import { Search, Bell, Menu, Plus, Command as CommandIcon } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { Pill } from "@/components/ui/Pill";
import { Kbd } from "@/components/ui/Kbd";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";
import { useInboxNotifications } from "@/lib/hooks/useInboxNotifications";
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
}

interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

function NotificationDropdown({ userId }: { userId: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, type, payload, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setNotifications((data as Notification[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  function notifIcon(type: string) {
    const icons: Record<string, string> = {
      message: "✦", job_application: "✦", note_upvote: "✦",
      follow: "✦", system: "✦",
    };
    return icons[type] ?? "✦";
  }

  function notifText(n: Notification): string {
    const p = n.payload as Record<string, string>;
    if (n.type === "message") return p.message ?? "You have a new message";
    if (n.type === "note_upvote") return `Someone upvoted your note: ${p.title ?? ""}`;
    if (n.type === "job_application") return `Application update: ${p.job_title ?? ""}`;
    return p.message ?? n.type.replace(/_/g, " ");
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-[rgb(var(--line))] flex items-center justify-between">
        <p className="font-display text-[15px] tracking-tight text-[rgb(var(--fg))]">Notifications</p>
        <span className="eyebrow">Last 5</span>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="font-display italic text-2xl text-[rgb(var(--fg-3))] mb-1">All clear.</p>
          <p className="text-xs text-[rgb(var(--fg-3))]">No notifications yet.</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 hover:bg-[rgb(var(--bg-sunk))] transition-colors",
                !n.is_read && "bg-[rgb(var(--primary)/0.04)]"
              )}
            >
              <span className="text-[rgb(var(--accent))] flex-shrink-0 mt-0.5">{notifIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug text-[rgb(var(--fg))]">{notifText(n)}</p>
                <p className="text-[10px] text-[rgb(var(--fg-3))] mt-0.5 font-mono tracking-tight">
                  {new Date(n.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {new Date(n.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                </p>
              </div>
              {!n.is_read && (
                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
          <div className="px-4 py-3 border-t border-[rgb(var(--line))]">
            <Link href="/inbox" className="text-xs text-[rgb(var(--primary))] link-grow">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { userId, avatarUrl, initials, fullName } = useCurrentUser();
  const { unreadCount, markAllRead } = useInboxNotifications(userId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // ⌘K / Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const supabase = createClient();
    const usernameQuery = q.startsWith("@") ? q.slice(1) : q;

    const [
      { data: notes }, { data: jobs }, { data: unis }, { data: byUsername },
    ] = await Promise.all([
      supabase.from("notes").select("id, title, subject").eq("status", "published").ilike("title", `%${q}%`).limit(3),
      supabase.from("jobs").select("id, title, company_name").eq("status", "active").ilike("title", `%${q}%`).limit(2),
      supabase.from("universities").select("id, name, short_name, slug").or(`name.ilike.%${q}%,short_name.ilike.%${q}%`).limit(2),
      supabase.from("profiles").select("id, full_name, username, avatar_url")
        .ilike("username", `${usernameQuery}%`).limit(5),
    ]);

    const people = byUsername ?? [];

    const mapped: Result[] = [
      ...people.map(u => ({
        id: u.id, type: "user" as const,
        title: u.full_name,
        sub: u.username ? `@${u.username}` : "no username",
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
    debounceRef.current = setTimeout(() => runSearch(q), 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/notes?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const TYPE_LABEL: Record<string, string> = {
    note: "Note", job: "Job", university: "University", user: "Person",
  };
  const TYPE_PILL: Record<string, "hue-a" | "hue-b" | "primary" | "hue-e"> = {
    note: "hue-a", job: "hue-b", university: "primary", user: "hue-e",
  };

  return (
    <header
      className={cn(
        "h-14 flex items-center gap-3 px-3 sm:px-5",
        "border-b border-[rgb(var(--line))] bg-[rgb(var(--bg)/0.80)] backdrop-blur-xl",
        "sticky top-0 z-30"
      )}
    >
      {/* Mobile menu */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 rounded-full flex items-center justify-center hover:bg-[rgb(var(--bg-sunk))] transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
      )}

      {/* Mobile logo */}
      <Link
        href="/feed"
        className="lg:hidden flex items-center gap-2 flex-shrink-0"
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-[12px] font-display">
          U
          <span className="absolute -right-0.5 -bottom-0.5 h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))] border-2 border-[rgb(var(--bg))]" />
        </span>
        <span className="font-display text-[16px] leading-none mt-0.5 hidden sm:block">UniConnect</span>
      </Link>

      {/* Greeting (desktop) */}
      <div className="hidden lg:flex flex-col justify-center flex-shrink-0 min-w-[200px]">
        <span className="text-sm font-medium leading-tight tracking-tight text-[rgb(var(--fg))]">
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </span>
        <span className="text-[11px] text-[rgb(var(--fg-3))] font-mono leading-tight mt-0.5 tracking-tight">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All caught up"}
        </span>
      </div>

      {/* Command palette skin search */}
      <div className="flex-1 max-w-[520px] min-w-0 mx-auto" ref={wrapperRef}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--fg-3))]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder="Search notes, jobs, people, universities…"
            className={cn(
              "w-full h-10 pl-10 pr-20 rounded-full text-sm",
              "bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--fg-3))]",
              "focus:outline-none focus:border-[rgb(var(--ring))] focus:bg-[rgb(var(--bg-elev))]",
              "focus:shadow-[0_0_0_4px_rgb(var(--ring)/0.10)] transition-[border-color,box-shadow,background-color]"
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[rgb(var(--line))] bg-[rgb(var(--bg-overlay))] shadow-[var(--shadow-lg)] z-50 overflow-hidden">
              {searching && (
                <p className="text-xs text-[rgb(var(--fg-3))] px-4 py-3 font-mono tracking-wide">
                  Searching…
                </p>
              )}
              {!searching && results.length === 0 && query.trim() && (
                <p className="text-xs text-[rgb(var(--fg-3))] px-4 py-4">
                  No results for &ldquo;<span className="text-[rgb(var(--fg))]">{query}</span>&rdquo;
                </p>
              )}
              {results.map(r => (
                <Link
                  key={r.id}
                  href={r.href}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--bg-sunk))] transition-colors"
                >
                  {r.type === "user" ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[rgb(var(--hue-e)/0.14)] text-[rgb(var(--hue-e))] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {r.avatar_url
                        ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                        : r.title.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <Pill tone={TYPE_PILL[r.type]} size="xs" shape="square">
                      {TYPE_LABEL[r.type]}
                    </Pill>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[rgb(var(--fg))] truncate tracking-tight">{r.title}</p>
                    <p className={cn(
                      "text-[11px] truncate",
                      r.type === "user"
                        ? "text-[rgb(var(--hue-e))] font-mono tracking-tight"
                        : "text-[rgb(var(--fg-3))]"
                    )}>
                      {r.sub}
                    </p>
                  </div>
                </Link>
              ))}
              {results.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[rgb(var(--line))] flex items-center justify-between text-[11px] text-[rgb(var(--fg-3))] font-mono">
                  <span className="flex items-center gap-1.5">
                    <CommandIcon className="w-3 h-3" />
                    Press Enter to open library
                  </span>
                  <Kbd>Esc</Kbd>
                </div>
              )}
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
              className="relative h-9 w-9 rounded-full border border-[rgb(var(--line))] bg-[rgb(var(--bg-elev))] flex items-center justify-center text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sunk))] transition-colors"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
              onClick={() => markAllRead()}
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.6} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[rgb(var(--destructive))] text-white text-[9px] font-semibold flex items-center justify-center leading-none border-2 border-[rgb(var(--bg))]">
                  {unreadCount > 99 ? "99" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={10}
              className="z-50 w-[340px] rounded-2xl border border-[rgb(var(--line))] bg-[rgb(var(--bg-overlay))] shadow-[var(--shadow-lg)] overflow-hidden"
            >
              <NotificationDropdown userId={userId} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* New post CTA — desktop */}
        <Link
          href="/notes/upload"
          className="hidden lg:inline-flex items-center gap-1.5 h-9 pl-3.5 pr-4 rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-[13px] font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New
        </Link>

        {/* Mobile avatar */}
        <Link href="/profile" className="lg:hidden">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[rgb(var(--primary)/0.14)] text-[rgb(var(--primary))] flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
