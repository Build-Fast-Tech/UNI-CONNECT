"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, ChevronRight, RefreshCw, Play, StepForward, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DRY_RUN_SNIPPETS, TRACKS, type Track, type TraceStep } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

/* ── Purple Particle Confetti ─────────────────────────────────── */
interface Particle { id: number; x: number; color: string; delay: number; size: number; duration: number; }

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const colors = ["#BD93F9","#FF79C6","#6C3FD4","#4F46E5","#50FA7B","#FFB86C","#8BE9FD","#FF5555"];
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      size: 5 + Math.random() * 8,
      duration: 1.5 + Math.random() * 1.5,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="confetti-particle"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            boxShadow: `0 0 6px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Syntax highlight (simple) ───────────────────────────────── */
function highlightCode(code: string) {
  return code
    .replace(/(\/\/.*)/g, '<span class="pk-comment">$1</span>')
    .replace(/\b(int|void|class|struct|string|auto|bool|char|double|float|long|short|vector|stack|queue|map|set|while|for|if|else|return|public|private|protected|virtual|new|delete|cout|cin|endl|true|false|nullptr|using|namespace|std|include)\b/g, '<span class="pk-keyword">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="pk-string">"$1"</span>')
    .replace(/\b(\d+)\b/g, '<span class="pk-number">$1</span>');
}

/* ── Trace Table ─────────────────────────────────────────────── */
function TraceTable({ steps, currentStep }: { steps: TraceStep[]; currentStep: number }) {
  if (!steps.length) return null;
  const allVarKeys = Array.from(new Set(steps.flatMap(s => Object.keys(s.variables))));
  const visibleSteps = steps.slice(0, currentStep + 1);

  return (
    <div className="overflow-x-auto rounded-xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(108,63,212,0.1)" }}>
            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Line</th>
            {allVarKeys.map(k => (
              <th key={k} className="px-3 py-2 text-left font-semibold" style={{ color: "#BD93F9" }}>{k}</th>
            ))}
            <th className="px-3 py-2 text-left text-slate-400 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {visibleSteps.map((step, i) => (
            <motion.tr key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("transition-colors", i === currentStep && "border-l-2")}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: i === currentStep ? "rgba(108,63,212,0.12)" : "transparent",
                borderLeftColor: i === currentStep ? "#BD93F9" : "transparent",
              }}>
              <td className="px-3 py-2" style={{ color: "#FF79C6" }}>{step.line}</td>
              {allVarKeys.map(k => (
                <td key={k} className="px-3 py-2">
                  {step.variables[k] !== undefined ? (
                    <motion.span
                      key={`${i}-${k}-${step.variables[k]}`}
                      initial={{ scale: 1.3, color: "#50FA7B" }}
                      animate={{ scale: 1, color: "#8BE9FD" }}
                      transition={{ duration: 0.3 }}
                      className="inline-block font-bold">
                      {String(step.variables[k])}
                    </motion.span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-slate-400 text-[11px]">{step.note}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function DryRunsPage() {
  const supabase = createClient();
  const [userId, setUserId]     = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [snippetIdx, setSnippetIdx]   = useState(0);
  const [prediction, setPrediction]   = useState("");
  const [submitted, setSubmitted]     = useState(false);
  const [isCorrect, setIsCorrect]     = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [traceStep, setTraceStep]     = useState(-1);
  const [tracing, setTracing]         = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, points: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      (supabase as any).from("coding_dry_runs").select("is_correct,points_earned").eq("user_id", user.id)
        .then(({ data }: any) => {
          const d = data || [];
          setStats({ total: d.length, correct: d.filter((x: any) => x.is_correct).length, points: d.reduce((s: number, x: any) => s + x.points_earned, 0) });
        });
    });
  }, []);

  const snippets = DRY_RUN_SNIPPETS.filter(s => trackFilter === "all" || s.track === trackFilter);
  const snippet  = snippets[snippetIdx % Math.max(snippets.length, 1)];

  const resetState = useCallback(() => {
    setSubmitted(false);
    setPrediction("");
    setTraceStep(-1);
    setTracing(false);
  }, []);

  const startTrace = () => { setTracing(true); setTraceStep(0); };
  const stepForward = () => {
    const steps = (snippet as any).traceSteps;
    if (!steps) return;
    setTraceStep(s => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    if (!snippet || !prediction.trim()) return;
    const correct = prediction.trim() === snippet.correctOutput.trim();
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
    const pts = correct ? snippet.points : 0;
    setStats(s => ({ total: s.total + 1, correct: s.correct + (correct ? 1 : 0), points: s.points + pts }));
    if (userId) {
      await (supabase as any).from("coding_dry_runs").insert({
        user_id: userId, code_snippet: snippet.code, user_prediction: prediction.trim(),
        correct_output: snippet.correctOutput, is_correct: correct, points_earned: pts,
        track: snippet.track, difficulty: snippet.difficulty,
      });
    }
  };

  const next = () => {
    resetState();
    setSnippetIdx(i => (i + 1) % snippets.length);
  };

  const hasTrace = !!(snippet as any).traceSteps?.length;

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Eye className="w-6 h-6" style={{ color: "#BD93F9" }} />
              Dry Runs
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>
              Trace code mentally — predict output before running
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Attempts", value: stats.total,   icon: "📊", color: "#BD93F9" },
            { label: "Correct",        value: stats.correct, icon: "✅", color: "#50FA7B" },
            { label: "Points",         value: stats.points,  icon: "⭐", color: "#FFB86C" },
          ].map(s => (
            <div key={s.label} className="coding-glass p-4 text-center rounded-xl">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Track filters */}
        <div className="flex gap-2 flex-wrap">
          {[{ id: "all", label: "All", icon: "🎯" }, ...TRACKS.map(t => ({ id: t.id, label: t.label.split(" ")[0], icon: t.icon }))]
            .map(t => (
              <button key={t.id} onClick={() => { setTrackFilter(t.id as any); setSnippetIdx(0); resetState(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={trackFilter === t.id ? {
                  background: "linear-gradient(135deg,#6C3FD4,#4F46E5)",
                  border: "1px solid rgba(108,63,212,0.5)",
                  color: "#fff",
                  boxShadow: "0 0 16px rgba(108,63,212,0.4)",
                } : {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#94A3B8",
                }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
        </div>

        {/* Snippet card */}
        {snippet && (
          <motion.div key={snippet.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(108,63,212,0.35)", boxShadow: "0 0 40px rgba(108,63,212,0.12)" }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ background: "rgba(108,63,212,0.15)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {["#FF5555","#FFB86C","#50FA7B"].map(c => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: "#BD93F9" }}>trace_{snippet.id}.cpp</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    color: snippet.difficulty === "easy" ? "#50FA7B" : snippet.difficulty === "medium" ? "#FFB86C" : "#FF5555",
                    background: snippet.difficulty === "easy" ? "rgba(80,250,123,0.1)" : snippet.difficulty === "medium" ? "rgba(255,184,108,0.1)" : "rgba(255,85,85,0.1)",
                    border: `1px solid ${snippet.difficulty === "easy" ? "rgba(80,250,123,0.3)" : snippet.difficulty === "medium" ? "rgba(255,184,108,0.3)" : "rgba(255,85,85,0.3)"}`,
                  }}>
                  {snippet.difficulty} · +{snippet.points}pts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#94A3B8" }}>{snippetIdx + 1}/{snippets.length}</span>
                <button onClick={() => { resetState(); setSnippetIdx(Math.floor(Math.random() * snippets.length)); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Random snippet">
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                </button>
              </div>
            </div>

            {/* Code block */}
            <div className="relative" style={{ background: "#0F051D" }}>
              {/* Line numbers + code */}
              <div className="flex overflow-x-auto">
                <div className="px-4 py-4 select-none shrink-0"
                  style={{ borderRight: "1px solid rgba(255,255,255,0.05)", color: "#4a4070" }}>
                  {snippet.code.split("\n").map((_, i) => (
                    <div key={i} className="text-xs font-mono leading-6 text-right">{i + 1}</div>
                  ))}
                </div>
                <pre className="px-5 py-4 text-sm font-mono leading-6 flex-1 overflow-x-auto"
                  style={{ color: "#E2E8F0" }}
                  dangerouslySetInnerHTML={{ __html: highlightCode(snippet.code) }} />
              </div>
            </div>

            {/* Trace table section */}
            {hasTrace && (
              <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: "#BD93F9" }}>Variable Trace</span>
                  <div className="flex gap-2">
                    {!tracing ? (
                      <button onClick={startTrace}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                        <Play className="w-3 h-3" /> Start Trace
                      </button>
                    ) : (
                      <>
                        <button onClick={stepForward}
                          disabled={traceStep >= ((snippet as any).traceSteps?.length ?? 0) - 1}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                          style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                          <StepForward className="w-3 h-3" /> Step
                        </button>
                        <button onClick={() => { setTracing(false); setTraceStep(-1); }}
                          className="px-3 py-1.5 rounded-lg text-xs transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {tracing && traceStep >= 0 && (
                  <TraceTable steps={(snippet as any).traceSteps} currentStep={traceStep} />
                )}
                {!tracing && (
                  <p className="text-xs text-center py-3" style={{ color: "#4a4070" }}>
                    Click "Start Trace" to step through variable changes
                  </p>
                )}
              </div>
            )}

            {/* Predict area */}
            <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <label className="block text-sm font-semibold text-white">
                Final Output Prediction
              </label>
              <textarea
                ref={inputRef}
                value={prediction}
                onChange={e => !submitted && setPrediction(e.target.value)}
                disabled={submitted}
                placeholder="What does this code print? Type exactly as it would appear..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono resize-none transition-all focus:outline-none disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: submitted
                    ? isCorrect ? "1px solid rgba(80,250,123,0.5)" : "1px solid rgba(255,85,85,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: "#E2E8F0",
                  boxShadow: submitted && isCorrect ? "0 0 20px rgba(80,250,123,0.15)" : "none",
                }}
              />

              {/* Result banner */}
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
                        <div className="text-sm">
                          <span style={{ color: "#94A3B8" }}>Expected: </span>
                          <code className="font-mono px-1.5 py-0.5 rounded text-xs" style={{ color: "#50FA7B", background: "rgba(80,250,123,0.1)" }}>
                            {snippet.correctOutput}
                          </code>
                        </div>
                      )}
                      <p className="text-xs mt-2" style={{ color: "#94A3B8" }}>{snippet.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-2">
                {!submitted ? (
                  <button onClick={submit} disabled={!prediction.trim()}
                    className="coding-btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-30">
                    <Zap className="w-4 h-4" /> Check Logic
                  </button>
                ) : (
                  <button onClick={next}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                    Next Snippet <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
