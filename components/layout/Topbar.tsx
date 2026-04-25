"use client";

import { Search, Bell, Menu, Plus } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";
import { useInboxNotifications } from "@/lib/hooks/useInboxNotifications";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Result {
  id: string;
  type: "note" | "job" | "university";
  title: string;
  sub: string;
  href: string;
}

interface TopbarProps {
  onMenuClick?: () => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
    const [{ data: notes }, { data: jobs }, { data: unis }] = await Promise.all([
      supabase.from("notes").select("id, title, subject").eq("status", "published").ilike("title", `%${q}%`).limit(4),
      supabase.from("jobs").select("id, title, company_name").eq("status", "active").ilike("title", `%${q}%`).limit(3),
      supabase.from("universities").select("id, name, short_name, slug").or(`name.ilike.%${q}%,short_name.ilike.%${q}%`).limit(3),
    ]);

    const mapped: Result[] = [
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

  const TYPE_LABEL: Record<string, string> = { note: "Note", job: "Job", university: "University" };
  const TYPE_COLOR: Record<string, string> = {
    note: "bg-blue-500/10 text-blue-500",
    job: "bg-green-500/10 text-green-600",
    university: "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]",
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
            placeholder="Search notes, jobs, people, universities..."
            className={cn(
              "w-full h-9 pl-9 pr-3 rounded-xl text-sm",
              "bg-[rgb(var(--muted))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl z-50 overflow-hidden">
              {searching && <p className="text-xs text-[rgb(var(--muted-fg))] px-4 py-3">Searching…</p>}
              {!searching && results.length === 0 && query.trim() && (
                <p className="text-xs text-[rgb(var(--muted-fg))] px-4 py-3">No results for &ldquo;{query}&rdquo;</p>
              )}
              {results.map(r => (
                <Link key={r.id} href={r.href} onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--muted))] transition-colors">
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0", TYPE_COLOR[r.type])}>
                    {TYPE_LABEL[r.type]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-[rgb(var(--muted-fg))] truncate">{r.sub}</p>
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
        <Link
          href="/inbox"
          onClick={() => markAllRead()}
          className="relative p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
          aria-label={unreadCount > 0 ? `Inbox (${unreadCount} unread)` : "Inbox"}
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
        </Link>

        {/* New Post button — desktop */}
        <Link
          href="/notes/upload"
          className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
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
