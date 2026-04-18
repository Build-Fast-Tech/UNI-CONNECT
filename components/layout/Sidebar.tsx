"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, Briefcase,
  FileUser, Bot, User, Inbox, GraduationCap, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/feed",          icon: LayoutDashboard, label: "Feed" },
  { href: "/universities",  icon: GraduationCap,   label: "Universities" },
  { href: "/chat",           icon: MessageSquare,   label: "Chat" },
  { href: "/notes",         icon: FileText,        label: "Notes" },
  { href: "/jobs",          icon: Briefcase,       label: "Jobs" },
  { href: "/cvs",           icon: FileUser,        label: "CVs" },
  { href: "/ai",            icon: Bot,             label: "AI" },
  { href: "/inbox",         icon: Inbox,           label: "Inbox" },
];

const BOTTOM_ITEMS = [
  { href: "/profile",           icon: User,     label: "Profile" },
  { href: "/profile/settings",  icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4">
      {/* Logo */}
      <div className="px-4 mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-xl tracking-tight">
            Uni<span className="text-[rgb(var(--primary))]">Connect</span>
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                active
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-[rgb(var(--primary)/0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10", active && "text-[rgb(var(--primary))]")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-2 pt-2 border-t border-[rgb(var(--border))] space-y-0.5 mt-2">
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
