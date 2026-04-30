"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, CheckCircle, ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ALL_PROBLEMS, TRACKS, type Track, type Difficulty } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

const DIFF_STYLE: Record<string, React.CSSProperties> = {
  easy:   { color: "#50FA7B", background: "rgba(80,250,123,0.08)",   border: "1px solid rgba(80,250,123,0.25)"  },
  medium: { color: "#FFB86C", background: "rgba(255,184,108,0.08)",  border: "1px solid rgba(255,184,108,0.25)" },
  hard:   { color: "#FF5555", background: "rgba(255,85,85,0.08)",    border: "1px solid rgba(255,85,85,0.25)"   },
};

const TRACK_STYLE: Record<string, { color: string; bg: string }> = {
  fundamentals: { color: "#8BE9FD", bg: "rgba(139,233,253,0.08)" },
  oop:          { color: "#BD93F9", bg: "rgba(189,147,249,0.08)" },
  dsa:          { color: "#50FA7B", bg: "rgba(80,250,123,0.08)"  },
};

function PracticeContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [solved, setSolved]           = useState<Set<string>>(new Set());
  const [search, setSearch]           = useState("");
  const [trackFilter, setTrackFilter] = useState<Track | "">(searchParams.get("track") as Track || "");
  const [diffFilter, setDiffFilter]   = useState<Difficulty | "">("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from("coding_submissions").select("problem_id").eq("user_id", user.id).eq("status", "accepted")
        .then(({ data }: any) => setSolved(new Set((data || []).map((d: any) => d.problem_id))));
    });
  }, []);

  const filtered = ALL_PROBLEMS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.tags.some(t => t.includes(q));
    return matchSearch && (!trackFilter || p.track === trackFilter) && (!diffFilter || p.difficulty === diffFilter);
  });

  const counts = {
    easy:   filtered.filter(p => p.difficulty === "easy").length,
    medium: filtered.filter(p => p.difficulty === "medium").length,
    hard:   filtered.filter(p => p.difficulty === "hard").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6" style={{ color: "#BD93F9" }} />
          Practice Labs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
          {filtered.length} problems · {solved.size} solved · {ALL_PROBLEMS.length} total
        </p>
      </div>

      {/* Track cards */}
      <div className="grid grid-cols-3 gap-3">
        {TRACKS.map(t => {
          const total   = ALL_PROBLEMS.filter(p => p.track === t.id).length;
          const solvedN = ALL_PROBLEMS.filter(p => p.track === t.id && solved.has(p.id)).length;
          const pct     = total ? Math.round((solvedN / total) * 100) : 0;
          const isActive = trackFilter === t.id;
          const ts = TRACK_STYLE[t.id];
          return (
            <button key={t.id} onClick={() => setTrackFilter(isActive ? "" : t.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: isActive ? ts.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? ts.color + "50" : "rgba(255,255,255,0.07)"}`,
                boxShadow: isActive ? `0 0 24px ${ts.color}20` : "none",
              }}>
              <div className="text-xl mb-1">{t.icon}</div>
              <p className="text-xs font-semibold mb-1" style={{ color: isActive ? ts.color : "#E2E8F0" }}>
                {t.label.split(" ")[0]}
              </p>
              <p className="text-[10px] mb-2" style={{ color: "#94A3B8" }}>{solvedN}/{total}</p>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ts.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + difficulty filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6272A4" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search problems or tags…"
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm focus:outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0" }} />
        </div>
        {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
          <button key={d} onClick={() => setDiffFilter(diffFilter === d ? "" : d)}
            className="px-3 h-9 rounded-lg text-xs font-semibold transition-all"
            style={diffFilter === d
              ? DIFF_STYLE[d]
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
            {d.charAt(0).toUpperCase() + d.slice(1)} ({counts[d]})
          </button>
        ))}
      </div>

      {/* Problem table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        {/* Column headers */}
        <div className="grid grid-cols-[28px_36px_1fr_80px_80px_64px] items-center gap-3 px-5 py-2.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(108,63,212,0.06)" }}>
          {["#", "✓", "Title", "Track", "Difficulty", "Points"].map(h => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6272A4" }}>{h}</span>
          ))}
        </div>

        <div>
          {filtered.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "#4a4070" }}>No problems match your filters.</p>
          )}
          {filtered.map((p, i) => {
            const isSolved = solved.has(p.id);
            const ts = TRACK_STYLE[p.track];
            return (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.012, 0.25) }}>
                <Link href={`/coding/practice/${p.id}`}
                  className="grid grid-cols-[28px_36px_1fr_80px_80px_64px] items-center gap-3 px-5 py-3 group transition-all block"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(108,63,212,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span className="text-xs font-mono" style={{ color: "#4a4070" }}>{i + 1}</span>
                  <div className="flex justify-center">
                    {isSolved
                      ? <CheckCircle className="w-4 h-4" style={{ color: "#50FA7B" }} />
                      : <div className="w-4 h-4 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.12)" }} />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate transition-colors"
                      style={{ color: isSolved ? "#6272A4" : "#E2E8F0" }}>
                      {p.title}
                    </span>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {p.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.04)", color: "#6272A4" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-center"
                    style={{ color: ts.color, background: ts.bg }}>
                    {p.track === "fundamentals" ? "Fund." : p.track.toUpperCase()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-center"
                    style={DIFF_STYLE[p.difficulty]}>
                    {p.difficulty}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold" style={{ color: "#FFB86C" }}>{p.points}</span>
                    <span className="text-[10px]" style={{ color: "#6272A4" }}>pts</span>
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#BD93F9" }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return <Suspense><PracticeContent /></Suspense>;
}
