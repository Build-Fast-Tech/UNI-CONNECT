"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, CheckCircle, XCircle, ChevronRight, Play, StepForward,
  Zap, SkipForward, RotateCcw, ArrowLeft, Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DRY_RUN_SNIPPETS, TRACKS, type Track, type TraceStep } from "@/lib/coding/problems";

/* ── Confetti ──────────────────────────────────────────────────── */
interface Particle { id: number; x: number; color: string; delay: number; size: number; duration: number; }
function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const colors = ["#BD93F9","#FF79C6","#6C3FD4","#4F46E5","#50FA7B","#FFB86C","#8BE9FD","#FF5555"];
    setParticles(Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, color: colors[i % colors.length],
      delay: Math.random() * 0.8, size: 5 + Math.random() * 8, duration: 1.5 + Math.random() * 1.5,
    })));
    const t = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(t);
  }, [active]);
  if (!particles.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="confetti-particle"
          style={{ left: `${p.x}%`, top: "-20px", width: p.size, height: p.size,
            backgroundColor: p.color, animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`, borderRadius: p.id % 2 ? "50%" : "2px",
            boxShadow: `0 0 6px ${p.color}` }} />
      ))}
    </div>
  );
}

/* ── Syntax highlight ────────────────────────────────────────────── */
function highlight(code: string) {
  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(\/\/[^\n]*)/g, '<span class="pk-comment">$1</span>')
    .replace(/\b(int|void|class|struct|string|auto|bool|char|double|float|long|short|vector|stack|queue|map|set|while|for|if|else|return|public|private|protected|virtual|new|delete|cout|cin|endl|true|false|nullptr|using|namespace|std|include|static|const|friend|operator|template|typename|override|final|mutable|explicit|this)\b/g, '<span class="pk-keyword">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="pk-string">"$1"</span>')
    .replace(/\b(\d+)\b/g, '<span class="pk-number">$1</span>');
}

/* ── Variable Memory Box ─────────────────────────────────────────── */
function VarBox({ name, value, changed }: { name: string; value: string | number | boolean; changed: boolean }) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        border: changed ? "1.5px solid #50FA7B" : "1px solid rgba(108,63,212,0.4)",
        boxShadow: changed ? "0 0 16px rgba(80,250,123,0.25)" : "none",
        minWidth: 72, background: "rgba(15,5,29,0.8)",
      }}>
      <div className="w-full text-center px-2 py-1 text-[10px] font-mono font-semibold truncate"
        style={{ background: "rgba(108,63,212,0.2)", color: "#BD93F9", borderBottom: "1px solid rgba(108,63,212,0.3)" }}>
        {name}
      </div>
      <div className="px-3 py-2.5 flex items-center justify-center">
        <motion.span key={String(value)} initial={{ scale: 1.4, color: "#50FA7B" }}
          animate={{ scale: 1, color: changed ? "#50FA7B" : "#8BE9FD" }} transition={{ duration: 0.35 }}
          className="text-sm font-mono font-bold">{String(value)}</motion.span>
      </div>
    </motion.div>
  );
}

/* ── Visual Trace Board ──────────────────────────────────────────── */
function VisualTrace({ steps, currentStep }: { steps: TraceStep[]; currentStep: number }) {
  if (!steps.length || currentStep < 0) return null;
  const step = steps[currentStep];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;
  const allVars = Array.from(new Set(steps.slice(0, currentStep + 1).flatMap(s => Object.keys(s.variables))));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {steps.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i < currentStep ? "#6C3FD4" : i === currentStep ? "#BD93F9" : "rgba(255,255,255,0.08)",
              boxShadow: i === currentStep ? "0 0 8px #BD93F9" : "none",
            }} />
        ))}
        <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: "#6272A4" }}>
          {currentStep + 1}/{steps.length}
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
        style={{ background: "rgba(108,63,212,0.12)", border: "1px solid rgba(108,63,212,0.25)" }}>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
          style={{ background: "rgba(255,121,198,0.15)", color: "#FF79C6", border: "1px solid rgba(255,121,198,0.3)" }}>
          line {step.line}
        </span>
        <span className="text-xs" style={{ color: "#CBD5E1" }}>{step.note}</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <AnimatePresence mode="popLayout">
          {allVars.map(varName => {
            const val = step.variables[varName];
            if (val === undefined) return null;
            const prevVal = prevStep?.variables[varName];
            return <VarBox key={varName} name={varName} value={val} changed={prevVal === undefined || prevVal !== val} />;
          })}
        </AnimatePresence>
      </div>
      {step.variables["output"] !== undefined && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
          style={{ background: "rgba(80,250,123,0.06)", border: "1px solid rgba(80,250,123,0.2)", color: "#50FA7B" }}>
          <span style={{ color: "#6272A4" }}>stdout →</span>
          <span className="font-bold">{String(step.variables["output"])}</span>
        </div>
      )}
    </div>
  );
}

/* ── Code Display ────────────────────────────────────────────────── */
function CodeDisplay({ code, activeLine }: { code: string; activeLine?: number }) {
  const lines = code.split("\n");
  return (
    <div className="flex overflow-x-auto" style={{ background: "#0F051D" }}>
      <div className="px-3 py-4 select-none shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {lines.map((_, i) => (
          <div key={i} className="text-xs font-mono leading-6 text-right w-6"
            style={{ color: activeLine === i + 1 ? "#FF79C6" : "#4a4070" }}>{i + 1}</div>
        ))}
      </div>
      <div className="flex-1">
        {lines.map((line, i) => (
          <div key={i} className="leading-6 transition-colors duration-200"
            style={{
              background: activeLine === i + 1 ? "rgba(108,63,212,0.15)" : "transparent",
              borderLeft: activeLine === i + 1 ? "2px solid #BD93F9" : "2px solid transparent",
            }}>
            <pre className="px-4 text-sm font-mono" style={{ color: "#E2E8F0" }}
              dangerouslySetInnerHTML={{ __html: highlight(line) }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Snippet Solver ──────────────────────────────────────────────── */
function SnippetSolver({
  snippet, onBack, onNext, position, total, userId, supabase, onSolve,
}: {
  snippet: (typeof DRY_RUN_SNIPPETS)[0];
  onBack: () => void; onNext: () => void;
  position: number; total: number;
  userId: string | null; supabase: ReturnType<typeof createClient>;
  onSolve: (id: string, correct: boolean, pts: number) => void;
}) {
  const [prediction, setPrediction] = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [isCorrect, setIsCorrect]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [traceStep, setTraceStep]   = useState(-1);
  const [tracing, setTracing]       = useState(false);
  const [autoPlay, setAutoPlay]     = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const traceSteps: TraceStep[] = (snippet as any).traceSteps ?? [];
  const hasTrace = traceSteps.length > 0;
  const activeLine = tracing && traceStep >= 0 ? traceSteps[traceStep]?.line : undefined;

  const startTrace  = () => { setTracing(true); setTraceStep(0); };
  const stepForward = () => setTraceStep(s => Math.min(s + 1, traceSteps.length - 1));
  const resetTrace  = () => {
    setTraceStep(0); setAutoPlay(false);
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  };

  useEffect(() => {
    if (!autoPlay || !tracing) return;
    autoRef.current = setInterval(() => {
      setTraceStep(s => {
        if (s >= traceSteps.length - 1) { setAutoPlay(false); return s; }
        return s + 1;
      });
    }, 900);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoPlay, tracing, traceSteps.length]);

  const submit = async () => {
    if (!prediction.trim()) return;
    const correct = prediction.trim() === snippet.correctOutput.trim();
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
    const pts = correct ? snippet.points : 0;
    onSolve(snippet.id, correct, pts);
    if (userId) {
      await (supabase as any).from("coding_dry_runs").insert({
        user_id: userId, code_snippet: snippet.code, user_prediction: prediction.trim(),
        correct_output: snippet.correctOutput, is_correct: correct, points_earned: pts,
        track: snippet.track, difficulty: snippet.difficulty,
      });
    }
  };

  const diffColor = snippet.difficulty === "easy" ? "#50FA7B" : snippet.difficulty === "medium" ? "#FFB86C" : "#FF5555";
  const diffBg    = snippet.difficulty === "easy" ? "rgba(80,250,123,0.1)" : snippet.difficulty === "medium" ? "rgba(255,184,108,0.1)" : "rgba(255,85,85,0.1)";
  const diffBorder = snippet.difficulty === "easy" ? "rgba(80,250,123,0.3)" : snippet.difficulty === "medium" ? "rgba(255,184,108,0.3)" : "rgba(255,85,85,0.3)";

  return (
    <>
      <Confetti active={showConfetti} />
      <motion.div key={snippet.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(108,63,212,0.35)", boxShadow: "0 0 40px rgba(108,63,212,0.12)" }}>

        <div className="flex items-center justify-between px-5 py-3"
          style={{ background: "rgba(108,63,212,0.15)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-xs transition-colors hover:text-white"
              style={{ color: "#94A3B8" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> All
            </button>
            <div className="flex gap-1.5">
              {["#FF5555","#FFB86C","#50FA7B"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />)}
            </div>
            <span className="text-xs font-mono" style={{ color: "#BD93F9" }}>trace_{snippet.id}.cpp</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: diffColor, background: diffBg, border: `1px solid ${diffBorder}` }}>
              {snippet.difficulty} · +{snippet.points}pts
            </span>
          </div>
          <span className="text-xs" style={{ color: "#94A3B8" }}>{position}/{total}</span>
        </div>

        <CodeDisplay code={snippet.code} activeLine={activeLine} />

        {hasTrace && (
          <div className="px-5 py-5 space-y-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#BD93F9" }}>🧠 Memory Trace</span>
              <div className="flex gap-1.5">
                {!tracing ? (
                  <button onClick={startTrace}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                    <Play className="w-3 h-3" /> Start Trace
                  </button>
                ) : (
                  <>
                    <button onClick={() => setAutoPlay(a => !a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={autoPlay
                        ? { background: "rgba(255,184,108,0.2)", border: "1px solid rgba(255,184,108,0.4)", color: "#FFB86C" }
                        : { background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                      <SkipForward className="w-3 h-3" /> {autoPlay ? "Pause" : "Auto"}
                    </button>
                    <button onClick={stepForward} disabled={traceStep >= traceSteps.length - 1 || autoPlay}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                      style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                      <StepForward className="w-3 h-3" /> Step
                    </button>
                    <button onClick={resetTrace} className="p-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {tracing && traceStep >= 0
              ? <VisualTrace steps={traceSteps} currentStep={traceStep} />
              : <p className="text-xs text-center py-4" style={{ color: "#4a4070" }}>
                  Click <span style={{ color: "#BD93F9" }}>Start Trace</span> to watch variables update step by step
                </p>
            }
          </div>
        )}

        <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <label className="block text-sm font-semibold text-white">Final Output Prediction</label>
          <textarea value={prediction} onChange={e => !submitted && setPrediction(e.target.value)}
            disabled={submitted}
            placeholder="What does this code print? Type exactly as it would appear..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm font-mono resize-none transition-all focus:outline-none disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: submitted ? (isCorrect ? "1px solid rgba(80,250,123,0.5)" : "1px solid rgba(255,85,85,0.5)") : "1px solid rgba(255,255,255,0.1)",
              color: "#E2E8F0",
              boxShadow: submitted && isCorrect ? "0 0 20px rgba(80,250,123,0.15)" : "none",
            }} />

          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: isCorrect ? "rgba(80,250,123,0.08)" : "rgba(255,85,85,0.08)",
                  border: `1px solid ${isCorrect ? "rgba(80,250,123,0.3)" : "rgba(255,85,85,0.3)"}`,
                }}>
                {isCorrect
                  ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#50FA7B" }} />
                  : <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#FF5555" }} />}
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1" style={{ color: isCorrect ? "#50FA7B" : "#FF5555" }}>
                    {isCorrect ? `Correct! +${snippet.points} points` : "Incorrect"}
                  </p>
                  {!isCorrect && (
                    <div className="text-sm mb-1">
                      <span style={{ color: "#94A3B8" }}>Expected: </span>
                      <code className="font-mono px-1.5 py-0.5 rounded text-xs"
                        style={{ color: "#50FA7B", background: "rgba(80,250,123,0.1)" }}>
                        {snippet.correctOutput}
                      </code>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{snippet.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {!submitted ? (
              <button onClick={submit} disabled={!prediction.trim()}
                className="coding-btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-30">
                <Zap className="w-4 h-4" /> Check Logic
              </button>
            ) : (
              <button onClick={onNext}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                Next Snippet <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Snippet List (block cards) ──────────────────────────────────── */
function SnippetList({
  snippets, solved, trackFilter, setTrackFilter, search, setSearch, onSelect, stats,
}: {
  snippets: typeof DRY_RUN_SNIPPETS;
  solved: Set<string>;
  trackFilter: Track | "all"; setTrackFilter: (t: Track | "all") => void;
  search: string; setSearch: (s: string) => void;
  onSelect: (idx: number) => void;
  stats: { total: number; correct: number; points: number };
}) {
  const filtered = snippets.filter(s =>
    (trackFilter === "all" || s.track === trackFilter) &&
    (!search.trim() || s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.explanation.toLowerCase().includes(search.toLowerCase()))
  );

  const DIFF_COLORS: Record<string, string> = { easy: "#50FA7B", medium: "#FFB86C", hard: "#FF5555" };
  const TRACK_COLORS: Record<string, string> = { fundamentals: "#8BE9FD", oop: "#BD93F9", dsa: "#50FA7B" };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Attempts", value: stats.total,   icon: "📊", color: "#BD93F9" },
          { label: "Correct",  value: stats.correct, icon: "✅", color: "#50FA7B" },
          { label: "Points",   value: stats.points,  icon: "⭐", color: "#FFB86C" },
        ].map(s => (
          <div key={s.label} className="coding-glass p-4 text-center rounded-xl">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", label: "All", icon: "🎯" }, ...TRACKS.map(t => ({ id: t.id, label: t.label.split(" ")[0], icon: t.icon }))]
          .map(t => (
            <button key={t.id} onClick={() => setTrackFilter(t.id as Track | "all")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={trackFilter === t.id ? {
                background: "linear-gradient(135deg,#6C3FD4,#4F46E5)",
                border: "1px solid rgba(108,63,212,0.5)", color: "#fff",
                boxShadow: "0 0 14px rgba(108,63,212,0.35)",
              } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#6272A4" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search snippets…"
            className="w-full h-8 pl-8 pr-3 rounded-lg text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0" }} />
        </div>
      </div>

      {/* Cards grouped by difficulty */}
      {(["easy", "medium", "hard"] as const).map(diff => {
        const group = filtered.filter(s => s.difficulty === diff);
        if (group.length === 0) return null;
        const solvedCount = group.filter(s => solved.has(s.id)).length;
        const dc = DIFF_COLORS[diff];
        return (
          <div key={diff} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: dc }}>
                {diff} — {solvedCount}/{group.length}
              </span>
              <div className="flex-1 h-px" style={{ background: `${dc}20` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.map((s, gi) => {
                const isSolved  = solved.has(s.id);
                const globalIdx = snippets.indexOf(s);
                const tc = TRACK_COLORS[s.track] ?? "#94A3B8";
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(gi * 0.03, 0.25) }}>
                    <button onClick={() => onSelect(globalIdx)}
                      className="group flex rounded-xl overflow-hidden transition-all w-full text-left"
                      style={{
                        background: isSolved ? "rgba(80,250,123,0.04)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isSolved ? "rgba(80,250,123,0.2)" : "rgba(255,255,255,0.07)"}`,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isSolved ? "rgba(80,250,123,0.08)" : "rgba(108,63,212,0.1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = isSolved ? "rgba(80,250,123,0.04)" : "rgba(255,255,255,0.03)")}>
                      {/* Completion tab */}
                      <div className="w-1.5 flex-shrink-0 rounded-l-xl"
                        style={{ background: isSolved ? "#50FA7B" : "rgba(255,255,255,0.08)" }} />
                      <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {isSolved
                            ? <CheckCircle className="w-4 h-4" style={{ color: "#50FA7B" }} />
                            : <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "rgba(255,255,255,0.15)" }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block truncate font-mono"
                            style={{ color: isSolved ? "#50FA7B" : "#E2E8F0" }}>{s.id}</span>
                          <span className="text-[10px] truncate block" style={{ color: "#6272A4" }}>
                            {s.explanation.slice(0, 55)}{s.explanation.length > 55 ? "…" : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold block" style={{ color: "#FFB86C" }}>{s.points}pts</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                              style={{ color: tc, background: `${tc}15` }}>
                              {s.track === "fundamentals" ? "Fund." : s.track.toUpperCase()}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "#BD93F9" }} />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function DryRunsPage() {
  const supabase = createClient();
  const [userId, setUserId]           = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [search, setSearch]           = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [solved, setSolved]           = useState<Set<string>>(new Set());
  const [stats, setStats]             = useState({ total: 0, correct: 0, points: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_dry_runs")
        .select("is_correct,points_earned,code_snippet")
        .eq("user_id", user.id)
        .then(({ data }: any) => {
          const d = data || [];
          setStats({ total: d.length, correct: d.filter((x: any) => x.is_correct).length, points: d.reduce((s: number, x: any) => s + x.points_earned, 0) });
          const solvedIds = new Set<string>();
          d.filter((x: any) => x.is_correct).forEach((x: any) => {
            const match = DRY_RUN_SNIPPETS.find(s => s.code === x.code_snippet);
            if (match) solvedIds.add(match.id);
          });
          setSolved(solvedIds);
        });
    });
  }, []);

  const handleSolve = (id: string, correct: boolean, pts: number) => {
    if (correct) setSolved(prev => new Set([...prev, id]));
    setStats(s => ({ total: s.total + 1, correct: s.correct + (correct ? 1 : 0), points: s.points + pts }));
  };

  const snippet = selectedIdx !== null ? DRY_RUN_SNIPPETS[selectedIdx] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        {selectedIdx !== null && (
          <button onClick={() => setSelectedIdx(null)}
            className="p-2 rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5" style={{ color: "#BD93F9" }} />
            {selectedIdx !== null ? `Dry Run — ${snippet?.id}` : "Dry Runs"}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {selectedIdx !== null
              ? "Trace code mentally — predict the output"
              : `${DRY_RUN_SNIPPETS.length} snippets · ${solved.size} solved`}
          </p>
        </div>
      </div>

      {selectedIdx !== null && snippet ? (
        <SnippetSolver
          snippet={snippet}
          onBack={() => setSelectedIdx(null)}
          onNext={() => setSelectedIdx(i => i !== null ? (i + 1) % DRY_RUN_SNIPPETS.length : 0)}
          position={selectedIdx + 1}
          total={DRY_RUN_SNIPPETS.length}
          userId={userId}
          supabase={supabase}
          onSolve={handleSolve}
        />
      ) : (
        <SnippetList
          snippets={DRY_RUN_SNIPPETS}
          solved={solved}
          trackFilter={trackFilter}
          setTrackFilter={setTrackFilter}
          search={search}
          setSearch={setSearch}
          onSelect={setSelectedIdx}
          stats={stats}
        />
      )}
    </div>
  );
}
