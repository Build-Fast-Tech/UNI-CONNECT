"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, FlaskConical, Eye, Trophy, Cpu, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/coding/learning-hub",  label: "Learning Hub",  icon: BookOpen },
  { href: "/coding/practice",      label: "Practice Labs", icon: FlaskConical },
  { href: "/coding/dry-runs",      label: "Dry Runs",      icon: Eye },
  { href: "/coding/leaderboard",   label: "Leaderboard",   icon: Trophy },
  { href: "/coding/visual-labs",   label: "Visual Labs",   icon: Cpu },
  { href: "/coding/battle",        label: "Battle Rooms",  icon: Swords },
];

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-full">
      {/* Sub-nav */}
      <div className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 py-2 mr-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[rgb(var(--primary)/0.15)] flex items-center justify-center">
              <span className="text-sm">💻</span>
            </div>
            <span className="text-sm font-bold text-[rgb(var(--primary))]">Coding OS</span>
          </div>
          {TABS.map(tab => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px",
                  active
                    ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.05)]"
                    : "border-transparent text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted)/0.5)]"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
