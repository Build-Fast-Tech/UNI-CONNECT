"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Search, GraduationCap, Flame, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PROBLEMS } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

interface LeaderEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  university_id: string | null;
  university_name: string | null;
  total_points: number;
  problems_solved: number;
  dry_run_correct: number;
}

const RANK_ICON = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
};

const TIER_BADGE = (pts: number) => {
  if (pts >= 500) return { label: "Legend",   color: "bg-amber-400/20 text-amber-300 border-amber-400/30" };
  if (pts >= 300) return { label: "Master",   color: "bg-purple-400/20 text-purple-300 border-purple-400/30" };
  if (pts >= 150) return { label: "Expert",   color: "bg-blue-400/20 text-blue-300 border-blue-400/30" };
  if (pts >= 50)  return { label: "Adept",    color: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" };
  return                  { label: "Novice",  color: "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] border-[rgb(var(--border))]" };
};

export default function LeaderboardPage() {
  const supabase = createClient();
  const [board, setBoard]           = useState<LeaderEntry[]>([]);
  const [filtered, setFiltered]     = useState<LeaderEntry[]>([]);
  const [universities, setUniversities] = useState<{ id: string; name: string; short_name: string }[]>([]);
  const [uniFilter, setUniFilter]   = useState("");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [myId, setMyId]             = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyId(user?.id ?? null));
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data || []));

    // Get all accepted submissions grouped by user
    Promise.all([
      (supabase as any).from("coding_submissions").select("user_id, problem_id, points_earned").eq("status", "accepted"),
      (supabase as any).from("coding_dry_runs").select("user_id, points_earned").eq("is_correct", true),
      supabase.from("profiles").select("id, full_name, avatar_url, university_id, universities(name)"),
    ]).then(([{ data: subs }, { data: drs }, { data: profiles }]) => {
      const subData = subs || [];
      const drData  = drs  || [];
      const profData = profiles || [];

      // Aggregate per user
      const userMap: Record<string, LeaderEntry> = {};
      profData.forEach((p: any) => {
        userMap[p.id] = {
          user_id: p.id,
          full_name: p.full_name || "Anonymous",
          avatar_url: p.avatar_url,
          university_id: p.university_id,
          university_name: p.universities?.name ?? null,
          total_points: 0,
          problems_solved: 0,
          dry_run_correct: 0,
        };
      });

      // Count unique accepted problems + points from subs
      const userProblems: Record<string, Set<string>> = {};
      subData.forEach((s: any) => {
        if (!userMap[s.user_id]) return;
        if (!userProblems[s.user_id]) userProblems[s.user_id] = new Set();
        if (!userProblems[s.user_id].has(s.problem_id)) {
          userProblems[s.user_id].add(s.problem_id);
          userMap[s.user_id].total_points  += s.points_earned;
          userMap[s.user_id].problems_solved += 1;
        }
      });

      drData.forEach((d: any) => {
        if (!userMap[d.user_id]) return;
        userMap[d.user_id].total_points    += d.points_earned;
        userMap[d.user_id].dry_run_correct += 1;
      });

      const sorted = Object.values(userMap)
        .filter(u => u.total_points > 0 || u.problems_solved > 0)
        .sort((a, b) => b.total_points - a.total_points || b.problems_solved - a.problems_solved);

      setBoard(sorted);
      setFiltered(sorted);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = board;
    if (uniFilter) result = result.filter(u => u.university_id === uniFilter);
    if (search)    result = result.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [uniFilter, search, board]);

  const myRank = board.findIndex(e => e.user_id === myId) + 1;
  const myEntry = board.find(e => e.user_id === myId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">{board.length} coders ranked</p>
        </div>
      </div>

      {/* My rank card */}
      {myEntry && (
        <div className="theme-card p-4 border-l-4 border-[rgb(var(--primary))] flex items-center gap-4">
          <span className="text-2xl font-bold text-[rgb(var(--primary))]">#{myRank}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">Your Rank</p>
            <p className="text-xs text-[rgb(var(--muted-fg))]">{myEntry.total_points} pts · {myEntry.problems_solved} solved · {myEntry.dry_run_correct} dry runs correct</p>
          </div>
          <div className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", TIER_BADGE(myEntry.total_points).color)}>
            {TIER_BADGE(myEntry.total_points).label}
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {!loading && filtered.length >= 3 && !uniFilter && !search && (
        <div className="grid grid-cols-3 gap-3">
          {[filtered[1], filtered[0], filtered[2]].map((entry, podiumIdx) => {
            if (!entry) return null;
            const rank = filtered.indexOf(entry) + 1;
            const heights = ["h-24", "h-32", "h-20"];
            const isMe = entry.user_id === myId;
            return (
              <motion.div key={entry.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: podiumIdx * 0.1 }}
                className={cn("theme-card p-4 flex flex-col items-center justify-end text-center", heights[podiumIdx], isMe && "border-[rgb(var(--primary))]")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-purple-600 flex items-center justify-center text-sm font-bold text-white mb-1 overflow-hidden shrink-0">
                  {entry.avatar_url ? <img src={entry.avatar_url} className="w-full h-full object-cover" /> : entry.full_name[0]}
                </div>
                <p className="text-xs font-semibold truncate w-full">{entry.full_name}</p>
                <p className="text-lg">{RANK_ICON(rank)}</p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">{entry.total_points}pts</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coders..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
        </div>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <select value={uniFilter} onChange={e => setUniFilter(e.target.value)}
            className="h-9 pl-9 pr-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] appearance-none">
            <option value="">All Universities</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.short_name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="theme-card overflow-hidden">
        {loading && (
          <div className="py-12 text-center text-[rgb(var(--muted-fg))]">Loading leaderboard…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-[rgb(var(--muted-fg))]">No coders found. Be the first to solve a problem!</div>
        )}
        <div className="divide-y divide-[rgb(var(--border))]">
          {filtered.map((entry, i) => {
            const rank  = board.indexOf(entry) + 1;
            const isMe  = entry.user_id === myId;
            const tier  = TIER_BADGE(entry.total_points);
            return (
              <motion.div key={entry.user_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={cn("flex items-center gap-4 px-5 py-3.5 hover:bg-[rgb(var(--muted)/0.3)] transition-colors", isMe && "bg-[rgb(var(--primary)/0.05)]")}>
                <span className={cn("w-8 text-center font-bold shrink-0", rank <= 3 ? "text-lg" : "text-sm text-[rgb(var(--muted-fg))]")}>
                  {RANK_ICON(rank)}
                </span>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {entry.avatar_url ? <img src={entry.avatar_url} className="w-full h-full object-cover" /> : entry.full_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-semibold text-sm truncate", isMe && "text-[rgb(var(--primary))]")}>{entry.full_name} {isMe && "(You)"}</span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", tier.color)}>{tier.label}</span>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted-fg))] truncate">{entry.university_name || "University not set"}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-[rgb(var(--muted-fg))] shrink-0">
                  <span title="Problems solved">✅ {entry.problems_solved}</span>
                  <span title="Dry runs correct">👁 {entry.dry_run_correct}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-yellow-400">{entry.total_points}</p>
                  <p className="text-[10px] text-[rgb(var(--muted-fg))]">pts</p>
                </div>
                {!isMe && (
                  <Link href={`/profile/${entry.user_id}`}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors" title="Message">
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
