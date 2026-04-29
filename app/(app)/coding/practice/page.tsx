"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, CheckCircle, Filter, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PROBLEMS, TRACKS, type Track, type Difficulty } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

const DIFF_BADGE = {
  easy:   "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  medium: "text-yellow-400  bg-yellow-400/10  border border-yellow-400/20",
  hard:   "text-red-400    bg-red-400/10    border border-red-400/20",
};

function PracticeContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<Track | "">(searchParams.get("track") as Track || "");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "">("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      (supabase as any).from("coding_submissions").select("problem_id").eq("user_id", user.id).eq("status", "accepted")
        .then(({ data }: any) => setSolved(new Set((data || []).map((d: any) => d.problem_id))));
    });
  }, []);

  const filtered = PROBLEMS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.tags.some(t => t.includes(q));
    const matchTrack  = !trackFilter || p.track === trackFilter;
    const matchDiff   = !diffFilter  || p.difficulty === diffFilter;
    return matchSearch && matchTrack && matchDiff;
  });

  const counts = { easy: filtered.filter(p => p.difficulty==="easy").length,
                   medium: filtered.filter(p => p.difficulty==="medium").length,
                   hard: filtered.filter(p => p.difficulty==="hard").length };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice Labs</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">{filtered.length} problems · {solved.size} solved</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
        </div>
        <select value={trackFilter} onChange={e => setTrackFilter(e.target.value as Track | "")}
          className="h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
          <option value="">All Tracks</option>
          {TRACKS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value as Difficulty | "")}
          className="h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
          <option value="">All Difficulties</option>
          <option value="easy">Easy ({counts.easy})</option>
          <option value="medium">Medium ({counts.medium})</option>
          <option value="hard">Hard ({counts.hard})</option>
        </select>
      </div>

      {/* Track summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {TRACKS.map(t => {
          const total   = PROBLEMS.filter(p => p.track === t.id).length;
          const solvedN = PROBLEMS.filter(p => p.track === t.id && solved.has(p.id)).length;
          return (
            <button key={t.id} onClick={() => setTrackFilter(trackFilter === t.id ? "" : t.id)}
              className={cn("p-3 rounded-xl border text-left transition-all bg-gradient-to-br", t.color,
                trackFilter === t.id ? `${t.borderColor} border-2` : "border-[rgb(var(--border))]")}>
              <div className="flex items-center gap-2 mb-1">
                <span>{t.icon}</span>
                <span className={cn("text-xs font-semibold", t.accentColor)}>{t.label.split(" ")[0]}</span>
              </div>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{solvedN}/{total} solved</p>
            </button>
          );
        })}
      </div>

      {/* Problem table */}
      <div className="theme-card overflow-hidden">
        <div className="divide-y divide-[rgb(var(--border))]">
          {filtered.length === 0 && (
            <p className="text-center py-12 text-[rgb(var(--muted-fg))]">No problems match your filters.</p>
          )}
          {filtered.map((p, i) => {
            const isSolved = solved.has(p.id);
            const track = TRACKS.find(t => t.id === p.track);
            return (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Link href={`/coding/practice/${p.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgb(var(--muted)/0.3)] transition-colors group">
                  <span className="text-xs text-[rgb(var(--muted-fg))] w-7 text-right shrink-0">{i + 1}</span>
                  {isSolved
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border border-[rgb(var(--border))] shrink-0" />}
                  <span className={cn("flex-1 text-sm font-medium min-w-0 truncate", isSolved && "text-[rgb(var(--muted-fg))]")}>{p.title}</span>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded", track?.accentColor, "bg-[rgb(var(--muted))]")}>{track?.label.split(" ")[0]}</span>
                    {p.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">{tag}</span>
                    ))}
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0", DIFF_BADGE[p.difficulty])}>{p.difficulty}</span>
                  <span className="text-xs text-[rgb(var(--muted-fg))] shrink-0">{p.points}pts</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
