"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Plus, Users, Clock, Loader2, Play, Trophy,
  X, Zap, Globe, Lock, CheckCircle, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface BattleRoom {
  id: string;
  creator_id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  duration_minutes: number;
  max_players: number;
  problem_title: string | null;
  status: "waiting" | "active" | "finished";
  created_at: string;
  creator_name?: string;
  participant_count?: number;
}

const LANG_LABELS: Record<string, string> = { cpp: "C++", python: "Python", java: "Java" };
const DIFF_COLOR: Record<string, string> = {
  easy:   "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
  medium: "text-yellow-400  border-yellow-400/20  bg-yellow-400/10",
  hard:   "text-red-400    border-red-400/20    bg-red-400/10",
};

export default function BattlePage() {
  const supabase = createClient();
  const [userId, setUserId]     = useState<string | null>(null);
  const [rooms, setRooms]       = useState<BattleRoom[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining]   = useState<string | null>(null);

  const [form, setForm] = useState({
    topic: "Arrays",
    difficulty: "medium",
    language: "cpp",
    duration_minutes: 30,
    max_players: 4,
    custom_instructions: "",
  });
  const [generatingProblem, setGeneratingProblem] = useState(false);
  const [generatedProblem, setGeneratedProblem]   = useState<{ title: string; description: string; starterCode: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    fetchRooms();

    // Realtime subscription
    const channel = supabase.channel("battle_rooms_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_rooms" }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    const { data } = await (supabase as any)
      .from("battle_rooms")
      .select("*, profiles!creator_id(full_name), battle_participants(count)")
      .neq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(20);

    setRooms((data || []).map((r: any) => ({
      ...r,
      creator_name: r.profiles?.full_name || "Unknown",
      participant_count: r.battle_participants?.[0]?.count || 0,
    })));
    setLoading(false);
  };

  const generateProblem = async () => {
    setGeneratingProblem(true);
    try {
      const res = await fetch("/api/coding/ai-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          difficulty: form.difficulty,
          language: form.language,
          customInstructions: form.custom_instructions,
        }),
      });
      const data = await res.json();
      setGeneratedProblem(data);
    } finally {
      setGeneratingProblem(false);
    }
  };

  const createRoom = async () => {
    if (!userId) return;
    setCreating(true);
    const { data, error } = await (supabase as any).from("battle_rooms").insert({
      creator_id: userId,
      topic: form.topic,
      difficulty: form.difficulty,
      language: form.language,
      duration_minutes: form.duration_minutes,
      max_players: form.max_players,
      custom_instructions: form.custom_instructions || null,
      problem_title: generatedProblem?.title || null,
      problem_description: generatedProblem?.description || null,
      starter_code: generatedProblem?.starterCode || null,
      status: "waiting",
    }).select().single();

    if (!error && data) {
      await (supabase as any).from("battle_participants").insert({ room_id: data.id, user_id: userId });
      setShowCreate(false);
      setGeneratedProblem(null);
      await fetchRooms();
    }
    setCreating(false);
  };

  const joinRoom = async (roomId: string) => {
    if (!userId) return;
    setJoining(roomId);
    const { error } = await (supabase as any).from("battle_participants").insert({ room_id: roomId, user_id: userId });
    if (!error) await fetchRooms();
    setJoining(null);
  };

  const deleteRoom = async (roomId: string) => {
    if (!userId) return;
    await (supabase as any).from("battle_participants").delete().eq("room_id", roomId);
    await (supabase as any).from("battle_rooms").delete().eq("id", roomId).eq("creator_id", userId);
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const TOPICS = ["Arrays", "Strings", "Recursion", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Math", "Bit Manipulation"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Swords className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Battle Rooms</h1>
            <p className="text-sm text-[rgb(var(--muted-fg))]">Compete live with other coders</p>
          </div>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Create Room
          </button>
        )}
      </div>

      {/* Rooms */}
      {loading ? (
        <div className="py-16 text-center text-[rgb(var(--muted-fg))]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div className="theme-card py-16 text-center">
          <Swords className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-4 opacity-40" />
          <p className="font-semibold mb-1">No active battle rooms</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">Create one and challenge other coders!</p>
          {userId && (
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90">
              Create First Room
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map(room => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="theme-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{room.problem_title || `${room.topic} Battle`}</h3>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">by {room.creator_name}</p>
                </div>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0", DIFF_COLOR[room.difficulty])}>
                  {room.difficulty}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted-fg))]">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.participant_count}/{room.max_players}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{room.duration_minutes}min</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{LANG_LABELS[room.language] || room.language}</span>
                <span className="flex items-center gap-1">
                  {room.status === "waiting" ? <span className="text-emerald-400 flex items-center gap-1"><Globe className="w-3 h-3" />Waiting</span>
                    : <span className="text-yellow-400 flex items-center gap-1"><Play className="w-3 h-3" />In Progress</span>}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => joinRoom(room.id)}
                  disabled={!!joining || room.status !== "waiting" || room.creator_id === userId}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                    room.creator_id === userId
                      ? "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
                      : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-40")}>
                  {joining === room.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : room.creator_id === userId ? "Your Room" : "Join →"}
                </button>
                {room.creator_id === userId && (
                  <button onClick={() => deleteRoom(room.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                    title="Delete room">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                  <h2 className="font-bold text-lg flex items-center gap-2"><Swords className="w-5 h-5 text-red-400" />Create Battle Room</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))]"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Topic</label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, topic: t }))}
                          className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                            form.topic === t ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]" : "bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] text-[rgb(var(--muted-fg))]")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty, Language */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Difficulty</label>
                      <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Language</label>
                      <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
                        {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Duration, Max Players */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Duration</label>
                      <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
                        {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Max Players</label>
                      <select value={form.max_players} onChange={e => setForm(f => ({ ...f, max_players: +e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]">
                        {[2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n} players</option>)}
                      </select>
                    </div>
                  </div>

                  {/* AI Instructions */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Custom Instructions for UniAI <span className="font-normal text-[rgb(var(--muted-fg))]">(optional)</span></label>
                    <textarea value={form.custom_instructions} onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
                      placeholder="e.g. Focus on dynamic programming with memoization..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] resize-none" />
                  </div>

                  {/* AI Generate button */}
                  <button onClick={generateProblem} disabled={generatingProblem}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-[rgb(var(--primary))] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.05)] disabled:opacity-50 transition-all">
                    {generatingProblem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {generatingProblem ? "Generating with UniAI…" : "Generate Problem with UniAI"}
                  </button>

                  {/* Generated problem preview */}
                  {generatedProblem && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
                      <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
                        <CheckCircle className="w-4 h-4" /> {generatedProblem.title}
                      </div>
                      <p className="text-xs text-[rgb(var(--muted-fg))] line-clamp-2">{generatedProblem.description}</p>
                    </motion.div>
                  )}

                  {/* Create button */}
                  <button onClick={createRoom} disabled={creating}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[rgb(var(--primary))] to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                    {creating ? "Creating…" : "Create Battle Room"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
