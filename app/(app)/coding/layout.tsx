"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, BookOpen, Cpu, Eye, FlaskConical, Swords, Trophy, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/coding/learning-hub", label: "Learn",     icon: BookOpen },
  { href: "/coding/practice",     label: "Practice",  icon: Cpu },
  { href: "/coding/dry-runs",     label: "Dry Runs",  icon: Eye },
  { href: "/coding/projects",     label: "Projects",  icon: FolderKanban },
  { href: "/coding/visual-labs",  label: "Labs",      icon: FlaskConical },
  { href: "/coding/battle",       label: "Battle",    icon: Swords },
  { href: "/coding/leaderboard",  label: "Ranks",     icon: Trophy },
];

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 py-5 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#6C3FD4,#4F46E5)", boxShadow: "0 0 20px rgba(108,63,212,0.4)" }}>
          <Code2 className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">Coding OS</h1>
          <p className="text-xs mt-0.5" style={{ color: "#6272A4" }}>Practice · Learn · Build</p>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                active
                  ? "text-white"
                  : "text-[#6272A4] hover:text-[#94A3B8] hover:bg-white/5"
              )}
              style={active ? {
                background: "linear-gradient(135deg,rgba(108,63,212,0.3),rgba(79,70,229,0.3))",
                border: "1px solid rgba(108,63,212,0.4)",
                boxShadow: "0 0 12px rgba(108,63,212,0.2)",
              } : {
                border: "1px solid transparent",
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
