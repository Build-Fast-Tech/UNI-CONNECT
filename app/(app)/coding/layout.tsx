"use client";

import Link from "next/link";
import { Code2, ArrowLeft } from "lucide-react";

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#6C3FD4,#4F46E5)", boxShadow: "0 0 40px rgba(108,63,212,0.4)" }}>
          <Code2 className="w-9 h-9 text-white" />
        </div>

        {/* Badge */}
        <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
          style={{ background: "rgba(108,63,212,0.15)", color: "#BD93F9", border: "1px solid rgba(108,63,212,0.3)" }}>
          Coming Soon
        </span>

        <h1 className="text-3xl font-bold text-white mb-3">Coding OS</h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#94A3B8" }}>
          We're building something powerful — a full in-browser coding environment with an IDE, dry runs, visual labs, battle rooms, and a global leaderboard. Stay tuned.
        </p>

        {/* Progress indicators */}
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
              <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: item.done ? "rgba(80,250,123,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${item.done ? "rgba(80,250,123,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                {item.done && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#50FA7B" }} />}
              </div>
              <span className="text-sm" style={{ color: item.done ? "#E2E8F0" : "#6272A4" }}>{item.label}</span>
              {item.done && <span className="text-[10px] font-semibold ml-auto" style={{ color: "#50FA7B" }}>Ready</span>}
            </div>
          ))}
        </div>

        <Link href="/feed"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#E2E8F0" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>
    </div>
  );
}
