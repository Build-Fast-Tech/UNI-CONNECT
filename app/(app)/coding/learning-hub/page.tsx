"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Flame, Lock, ArrowRight, Star, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TRACKS, PROBLEMS, type Track } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

const DIFF_COLOR = {
  easy:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  medium: "text-yellow-400  bg-yellow-400/10  border-yellow-400/20",
  hard:   "text-red-400    bg-red-400/10     border-red-400/20",
};

export default function LearningHubPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [dryRuns, setDryRuns] = useState(0);
  const [activeTrack, setActiveTrack] = useState<Track>("fundamentals");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_submissions").select("problem_id").eq("user_id", user.id).eq("status", "accepted")
        .then(({ data }: any) => setSolved(new Set((data || []).map((d: any) => d.problem_id))));
      (supabase as any).from("coding_dry_runs").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_correct", true)
        .then(({ count }: any) => setDryRuns(count || 0));
    });
  }, []);

  const trackProblems = PROBLEMS.filter(p => p.track === activeTrack);
  const easy   = trackProblems.filter(p => p.difficulty === "easy");
  const medium = trackProblems.filter(p => p.difficulty === "medium");
  const hard   = trackProblems.filter(p => p.difficulty === "hard");

  const trackSolved = (track: Track) => PROBLEMS.filter(p => p.track === track && solved.has(p.id)).length;
  const trackTotal  = (track: Track) => PROBLEMS.filter(p => p.track === track).length;

  const totalSolved = PROBLEMS.filter(p => solved.has(p.id)).length;
  const totalPoints = PROBLEMS.filter(p => solved.has(p.id)).reduce((s, p) => s + p.points, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Problems Solved", value: totalSolved, total: PROBLEMS.length, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Dry Runs Done",   value: dryRuns,     total: null,            icon: Flame,       color: "text-orange-400" },
          { label: "Total Points",    value: totalPoints, total: null,            icon: Star,        color: "text-yellow-400" },
          { label: "Active Streak",   value: "🔥 Keep going!", total: null,       icon: Zap,         color: "text-[rgb(var(--fg))]" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="theme-card p-4 flex items-center gap-3">
            <s.icon className={cn("w-8 h-8 shrink-0", s.color)} />
            <div>
              <p className="text-xl font-bold">{s.value}{s.total ? `/${s.total}` : ""}</p>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Track selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TRACKS.map((track, i) => {
          const s = trackSolved(track.id);
          const t = trackTotal(track.id);
          const pct = t ? Math.round((s / t) * 100) : 0;
          const isActive = activeTrack === track.id;
          return (
            <motion.button key={track.id} onClick={() => setActiveTrack(track.id)}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={cn(
                "text-left p-5 rounded-2xl border transition-all duration-200 bg-gradient-to-br",
                track.color, isActive ? `${track.borderColor} border-2 shadow-lg scale-[1.02]` : "border-[rgb(var(--border))] hover:scale-[1.01]"
              )}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{track.icon}</span>
                {isActive && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]">Active</span>}
              </div>
              <h3 className="font-bold text-base mb-1">{track.label}</h3>
              <p className="text-xs text-[rgb(var(--muted-fg))] mb-3">{track.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {track.topics.map(tp => (
                  <span key={tp} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">{tp}</span>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={track.accentColor}>{s}/{t} solved</span>
                  <span className="text-[rgb(var(--muted-fg))]">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", track.color.replace("/20", ""))}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Problem list */}
      <div className="theme-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[rgb(var(--primary))]" />
            <h2 className="font-bold">{TRACKS.find(t => t.id === activeTrack)?.label}</h2>
            <span className="text-xs text-[rgb(var(--muted-fg))]">({trackProblems.length} problems)</span>
          </div>
          <Link href={`/coding/practice?track=${activeTrack}`}
            className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline">
            Practice All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {[{ label: "Easy", items: easy }, { label: "Medium", items: medium }, { label: "Hard", items: hard }].map(section => (
          <div key={section.label}>
            <div className="px-6 py-2 bg-[rgb(var(--muted)/0.3)] border-b border-[rgb(var(--border))]">
              <span className={cn("text-xs font-bold uppercase tracking-wider", DIFF_COLOR[section.label.toLowerCase() as keyof typeof DIFF_COLOR].split(" ")[0])}>
                {section.label} — {section.items.filter(p => solved.has(p.id)).length}/{section.items.length}
              </span>
            </div>
            <div className="divide-y divide-[rgb(var(--border))]">
              {section.items.map((p, idx) => {
                const isSolved = solved.has(p.id);
                return (
                  <Link key={p.id} href={`/coding/practice/${p.id}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-[rgb(var(--muted)/0.3)] transition-colors group">
                    <span className="text-[rgb(var(--muted-fg))] text-xs w-6 text-right">{idx + 1}</span>
                    {isSolved
                      ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <div className="w-4 h-4 rounded-full border border-[rgb(var(--border))] shrink-0" />}
                    <span className={cn("flex-1 text-sm font-medium", isSolved && "text-[rgb(var(--muted-fg))]")}>{p.title}</span>
                    <div className="flex items-center gap-2">
                      {p.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="hidden sm:block text-[10px] px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">{tag}</span>
                      ))}
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", DIFF_COLOR[p.difficulty])}>
                        {p.difficulty}
                      </span>
                      <span className="text-xs text-[rgb(var(--muted-fg))]">{p.points}pts</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
