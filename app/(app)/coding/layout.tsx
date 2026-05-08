"use client";

import Link from "next/link";
import { Code2, ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/button";

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md mx-auto px-6">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))",
            boxShadow: "0 0 40px rgb(var(--primary) / 0.40)",
          }}
        >
          <Code2 className="w-9 h-9" style={{ color: "rgb(var(--primary-fg))" }} />
        </div>

        <Pill tone="primary" size="md" className="mb-4 uppercase tracking-widest font-semibold">
          Coming soon
        </Pill>

        <h1 className="font-display text-[40px] leading-tight tracking-tight text-[rgb(var(--fg))] mt-3 mb-3">
          Coding OS.
        </h1>
        <p className="text-sm leading-relaxed mb-8 text-[rgb(var(--fg-2))]">
          We&apos;re building something powerful — a full in-browser coding environment with an IDE,
          dry runs, visual labs, battle rooms, and a global leaderboard. Stay tuned.
        </p>

        <div className="space-y-2.5 mb-8 text-left">
          {[
            { label: "Learning Hub",  done: true  },
            { label: "Practice Labs", done: false },
            { label: "Dry Runs",      done: false },
            { label: "Visual Labs",   done: false },
            { label: "Battle Rooms",  done: false },
            { label: "Leaderboard",   done: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                  item.done
                    ? "bg-[rgb(var(--positive)/0.14)] border border-[rgb(var(--positive)/0.40)]"
                    : "bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))]"
                }`}
              >
                {item.done && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--positive))]" />
                )}
              </span>
              <span className={`text-sm ${item.done ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg-3))]"}`}>
                {item.label}
              </span>
              {item.done && (
                <span className="text-[10px] font-semibold uppercase tracking-widest ml-auto text-[rgb(var(--positive))]">
                  Ready
                </span>
              )}
            </div>
          ))}
        </div>

        <Link href="/feed">
          <Button variant="outline" size="md" shape="pill">
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Button>
        </Link>
      </div>
    </div>
  );
}
