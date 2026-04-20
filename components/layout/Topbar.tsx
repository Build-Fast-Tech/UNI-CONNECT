"use client";

import { Search, Bell } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Topbar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setAvatarUrl(data.avatar_url);
        setInitials(
          data.full_name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        );
      }
    })();
  }, []);

  return (
    <header className={cn(
      "h-14 flex items-center gap-4 px-4 sm:px-6",
      "border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.8)] backdrop-blur-xl",
      "sticky top-0 z-30"
    )}>
      {/* Left: avatar + bell */}
      <div className="flex items-center gap-2">
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
        </Link>
        <Link href="/inbox" className="relative p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors">
          <Bell className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
        </Link>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            type="search"
            placeholder="Search notes, jobs, students…"
            className={cn(
              "w-full h-9 pl-9 pr-4 rounded-xl text-sm",
              "bg-[rgb(var(--muted))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
            )}
          />
        </div>
      </div>

      {/* Right: theme switcher */}
      <ThemeSwitcher />
    </header>
  );
}
