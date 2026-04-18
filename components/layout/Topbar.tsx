"use client";

import { Search, Bell } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { cn } from "@/lib/utils";

export function Topbar() {
  return (
    <header className={cn(
      "h-14 flex items-center gap-4 px-4 sm:px-6",
      "border-b border-[rgb(var(--border))] bg-[rgb(var(--card)/0.8)] backdrop-blur-xl",
      "sticky top-0 z-30"
    )}>
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

      {/* Right side */}
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <button className="relative p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors">
          <Bell className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[rgb(var(--primary))] animate-pulse-badge" />
        </button>
        {/* Avatar placeholder */}
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white">
          U
        </button>
      </div>
    </header>
  );
}
