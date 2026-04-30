"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, FlaskConical, Eye, Trophy, Cpu, Swords, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/coding/learning-hub",  label: "Learning Hub",  icon: BookOpen },
  { href: "/coding/practice",      label: "Practice",      icon: FlaskConical },
  { href: "/coding/dry-runs",      label: "Dry Runs",      icon: Eye },
  { href: "/coding/leaderboard",   label: "Leaderboard",   icon: Trophy },
  { href: "/coding/visual-labs",   label: "Visual Labs",   icon: Cpu },
  { href: "/coding/battle",        label: "Battle",        icon: Swords },
];

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-full -m-4 md:-m-6">
      {/* Command-center header */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{
          background: "linear-gradient(180deg, #1A0B2E 0%, #130921 100%)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* Brand strip */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6C3FD4,#4F46E5)", boxShadow: "0 0 16px rgba(108,63,212,0.5)" }}>
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: "#fff", letterSpacing: "0.04em" }}>
              CODING<span style={{ color: "#BD93F9" }}>_OS</span>
            </span>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-end gap-0 px-5 overflow-x-auto scrollbar-none mt-1">
          {TABS.map(tab => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all relative",
                  "border-b-2 -mb-px",
                  active
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-300"
                )}
                style={active ? {
                  borderBottomColor: "#BD93F9",
                  textShadow: "0 0 20px rgba(189,147,249,0.8)",
                } : { borderBottomColor: "transparent" }}
              >
                {active && (
                  <span className="absolute inset-0 rounded-t-lg"
                    style={{ background: "rgba(108,63,212,0.12)" }} />
                )}
                <tab.icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content area with purple atmosphere */}
      <div className="flex-1 p-4 md:p-6"
        style={{ background: "linear-gradient(160deg, #0F051D 0%, #130821 40%, #0D0619 100%)" }}>
        {children}
      </div>
    </div>
  );
}
