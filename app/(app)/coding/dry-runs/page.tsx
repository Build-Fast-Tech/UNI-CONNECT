"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, Flame, ChevronRight, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DRY_RUN_SNIPPETS, TRACKS, type Track } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

const DIFF_COLOR = { easy: "text-emerald-400", medium: "text-yellow-400", hard: "text-red-400" };

export default function DryRunsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [current, setCurrent]         = useState(0);
  const [prediction, setPrediction]   = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [isCorrect, setIsCorrect]     = useState(false);
  const [stats, setStats]             = useState({ total: 0, correct: 0, points: 0 });
  const [history, setHistory]         = useState<{ id: string; correct: boolean; pts: number }[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_dry_runs").select("is_correct, points_earned").eq("user_id", user.id)
        .then(({ data }: any) => {
          const d = data || [];
          setStats({ total: d.length, correct: d.filter((x: any) => x.is_correct).length, points: d.reduce((s: number, x: any) => s + x.points_earned, 0) });
        });
    });
  }, []);

  const snippets = DRY_RUN_SNIPPETS.filter(s => trackFilter === "all" || s.track === trackFilter);
  const snippet  = snippets[current % snippets.length];

  const submit = async () => {
    if (!snippet || !prediction.trim()) return;
    const correct = prediction.trim() === snippet.correctOutput.trim();
    setIsCorrect(correct);
    setSubmitted(true);
    const pts = correct ? snippet.points : 0;
    setHistory(h => [...h, { id: snippet.id, correct, pts }]);
    setStats(s => ({ total: s.total + 1, correct: s.correct + (correct ? 1 : 0), points: s.points + pts }));

    if (userId) {
      await (supabase as any).from("coding_dry_runs").insert({
        user_id: userId,
        code_snippet: snippet.code,
        user_prediction: prediction.trim(),
        correct_output: snippet.correctOutput,
        is_correct: correct,
        points_earned: pts,
        track: snippet.track,
        difficulty: snippet.difficulty,
      });
    }
  };

  const next = () => {
    setSubmitted(false);
    setPrediction("");
    setCurrent(c => (c + 1) % snippets.length);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Eye className="w-6 h-6 text-[rgb(var(--primary))]" />Dry Runs</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Read code snippets and predict the output to earn points</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Attempts", value: stats.total, icon: "📊" },
          { label: "Correct",        value: stats.correct, icon: "✅" },
          { label: "Points Earned",  value: stats.points,  icon: "⭐" },
        ].map(s => (
          <div key={s.label} className="theme-card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-[rgb(var(--muted-fg))]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Track filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "All Tracks", icon: "🎯" }, ...TRACKS.map(t => ({ id: t.id, label: t.label.split(" ")[0], icon: t.icon }))].map(t => (
          <button key={t.id} onClick={() => { setTrackFilter(t.id as any); setCurrent(0); setSubmitted(false); setPrediction(""); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              trackFilter === t.id ? "bg-[rgb(var(--primary))] text-white" : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Snippet card */}
      {snippet && (
        <motion.div key={snippet.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="theme-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))] bg-[#1A0B2E]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-400">snippet.cpp</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", DIFF_COLOR[snippet.difficulty])}>{snippet.difficulty}</span>
              <span className="text-[10px] text-purple-400">+{snippet.points} pts</span>
            </div>
            <span className="text-xs text-[rgb(var(--muted-fg))]">{current + 1}/{snippets.length}</span>
          </div>

          <pre className="px-5 py-4 bg-[#0F051D] text-sm font-mono text-purple-100 whitespace-pre overflow-x-auto leading-relaxed">
            {snippet.code}
          </pre>

          <div className="px-5 py-4 space-y-3">
            <label className="text-sm font-semibold">What is the output?</label>
            <textarea
              value={prediction}
              onChange={e => !submitted && setPrediction(e.target.value)}
              disabled={submitted}
              placeholder="Type your prediction here..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] resize-none disabled:opacity-60"
            />

            <AnimatePresence>
              {submitted && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-xl p-4 border", isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30")}>
                  <div className={cn("flex items-center gap-2 font-semibold mb-2", isCorrect ? "text-emerald-400" : "text-red-400")}>
                    {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {isCorrect ? `Correct! +${snippet.points} points` : "Incorrect"}
                  </div>
                  {!isCorrect && (
                    <div className="text-sm">
                      <span className="text-[rgb(var(--muted-fg))]">Correct output: </span>
                      <pre className="inline font-mono text-emerald-400">{snippet.correctOutput}</pre>
                    </div>
                  )}
                  <p className="text-xs text-[rgb(var(--muted-fg))] mt-2">{snippet.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              {!submitted ? (
                <button onClick={submit} disabled={!prediction.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                  Submit Prediction
                </button>
              ) : (
                <button onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
                  Next Snippet <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setSubmitted(false); setPrediction(""); setCurrent(c => (c + Math.floor(Math.random() * snippets.length - 1) + 1) % snippets.length); }}
                className="p-2.5 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors" title="Skip">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div className="theme-card p-4 space-y-2">
          <h3 className="text-sm font-semibold mb-3">This Session</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <div key={i} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                h.correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                {h.correct ? "✓" : "✗"}
              </div>
            ))}
          </div>
          <p className="text-xs text-[rgb(var(--muted-fg))]">Accuracy: {history.length ? Math.round((history.filter(h => h.correct).length / history.length) * 100) : 0}%</p>
        </div>
      )}
    </div>
  );
}
