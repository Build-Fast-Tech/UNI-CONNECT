"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, ChevronRight, RefreshCw, Play, StepForward, Zap, SkipForward, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DRY_RUN_SNIPPETS, TRACKS, type Track, type TraceStep } from "@/lib/coding/problems";
import { cn } from "@/lib/utils";

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
    .replace(/(#include\s*&lt;[^&]*&gt;)/g, '<span class="pk-preprocessor">$1</span>')
    .replace(/(\/\/[^\n]*)/g, '<span class="pk-comment">$1</span>')
    .replace(/\b(int|void|class|struct|string|auto|bool|char|double|float|long|short|vector|stack|queue|map|set|while|for|if|else|return|public|private|protected|virtual|new|delete|cout|cin|endl|true|false|nullptr|using|namespace|std|include|main|do|break|continue|switch|case|default|typename|template|const|static|friend|operator|override|explicit|this|size_t|pair|sort|min|max|swap|push|pop|front|back|begin|end|reverse)\b/g, '<span class="pk-keyword">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="pk-string">"$1"</span>')
    .replace(/\b(\d+)\b/g, '<span class="pk-number">$1</span>');
}

/* ── Variable Memory Box ─────────────────────────────────────────── */
function VarBox({ name, value, changed }: { name: string; value: string | number | boolean; changed: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        border: changed ? "1.5px solid #50FA7B" : "1px solid rgba(108,63,212,0.4)",
        boxShadow: changed ? "0 0 16px rgba(80,250,123,0.25)" : "none",
        minWidth: 72,
        background: "rgba(15,5,29,0.8)",
      }}>
      {/* Name label */}
      <div className="w-full text-center px-2 py-1 text-[10px] font-mono font-semibold truncate"
        style={{ background: "rgba(108,63,212,0.2)", color: "#BD93F9", borderBottom: "1px solid rgba(108,63,212,0.3)" }}>
        {name}
      </div>
      {/* Value */}
      <div className="px-3 py-2.5 flex items-center justify-center">
        <motion.span
          key={String(value)}
          initial={{ scale: 1.4, color: "#50FA7B" }}
          animate={{ scale: 1, color: changed ? "#50FA7B" : "#8BE9FD" }}
          transition={{ duration: 0.35 }}
          className="text-sm font-mono font-bold"
        >
          {String(value)}
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ── Visual Trace Board ──────────────────────────────────────────── */
function VisualTrace({ steps, currentStep }: { steps: TraceStep[]; currentStep: number }) {
  if (!steps.length || currentStep < 0) return null;

  const step = steps[currentStep];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  // Accumulate all vars seen up to this step
  const allVars = Array.from(
    new Set(steps.slice(0, currentStep + 1).flatMap(s => Object.keys(s.variables)))
  );

  return (
    <div className="space-y-4">
      {/* Step progress bar */}
      <div className="flex items-center gap-1">
        {steps.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i < currentStep ? "#6C3FD4"
                : i === currentStep ? "#BD93F9"
                : "rgba(255,255,255,0.08)",
              boxShadow: i === currentStep ? "0 0 8px #BD93F9" : "none",
            }} />
        ))}
        <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: "#6272A4" }}>
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      {/* Current line badge + note */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
        style={{ background: "rgba(108,63,212,0.12)", border: "1px solid rgba(108,63,212,0.25)" }}>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
          style={{ background: "rgba(255,121,198,0.15)", color: "#FF79C6", border: "1px solid rgba(255,121,198,0.3)" }}>
          line {step.line}
        </span>
        <span className="text-xs" style={{ color: "#CBD5E1" }}>{step.note}</span>
      </div>

      {/* Variable boxes */}
      <div className="flex flex-wrap gap-2.5">
        <AnimatePresence mode="popLayout">
          {allVars.map(varName => {
            const val = step.variables[varName];
            if (val === undefined) return null;
            const prevVal = prevStep?.variables[varName];
            const changed = prevVal === undefined || prevVal !== val;
            return (
              <VarBox key={varName} name={varName} value={val} changed={changed} />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Output trace if present */}
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

/* ── Code Display with line highlight ───────────────────────────── */
const BOILERPLATE_HEADER = ["#include <bits/stdc++.h>", "using namespace std;", "", "int main() {"];
const BOILERPLATE_FOOTER = ["    return 0;", "}"];
const HEADER_COUNT = BOILERPLATE_HEADER.length;

function CodeDisplay({ code, activeLine }: { code: string; activeLine?: number }) {
  const codeLines = code.split("\n").map(l => "    " + l);
  const allLines = [...BOILERPLATE_HEADER, ...codeLines, ...BOILERPLATE_FOOTER];
  const displayActiveLine = activeLine !== undefined ? activeLine + HEADER_COUNT : undefined;

  return (
    <div className="flex overflow-x-auto" style={{ background: "#0F051D" }}>
      <div className="px-3 py-4 select-none shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {allLines.map((_, i) => (
          <div key={i} className="text-xs font-mono leading-6 text-right w-6"
            style={{ color: displayActiveLine === i + 1 ? "#FF79C6" : "#4a4070" }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className="flex-1">
        {allLines.map((line, i) => {
          const isBoilerplate = i < HEADER_COUNT || i >= HEADER_COUNT + codeLines.length;
          const isActive = displayActiveLine === i + 1;
          return (
            <div key={i} className="leading-6 transition-colors duration-200"
              style={{
                background: isActive ? "rgba(108,63,212,0.15)" : "transparent",
                borderLeft: isActive ? "2px solid #BD93F9" : "2px solid transparent",
                opacity: isBoilerplate ? 0.4 : 1,
              }}>
              <pre className="px-4 text-sm font-mono"
                style={{ color: "#E2E8F0" }}
                dangerouslySetInnerHTML={{ __html: highlight(line) }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function DryRunsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [traceStep, setTraceStep] = useState(-1);
  const [tracing, setTracing] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0, points: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const snippet = snippets[snippetIdx % Math.max(snippets.length, 1)];
  const traceSteps: TraceStep[] = (snippet as any).traceSteps ?? [];
  const hasTrace = traceSteps.length > 0;

  const resetState = useCallback(() => {
    setSubmitted(false); setPrediction(""); setTraceStep(-1); setTracing(false); setAutoPlay(false);
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  const startTrace = () => { setTracing(true); setTraceStep(0); };
  const stepForward = () => setTraceStep(s => Math.min(s + 1, traceSteps.length - 1));
  const resetTrace = () => { setTraceStep(0); setAutoPlay(false); if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; } };

  // Auto-play through trace steps
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

  const next = () => { resetState(); setSnippetIdx(i => (i + 1) % snippets.length); };

  const activeLine = tracing && traceStep >= 0 ? traceSteps[traceStep]?.line : undefined;

  return (
    <>
      <Confetti active={showConfetti} />
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: "#BD93F9" }} /> Dry Runs
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              Trace code mentally — predict output before running
            </p>
          </div>
        </div>

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

        {/* Track filters */}
        <div className="flex gap-2 flex-wrap">
          {[{ id: "all", label: "All", icon: "🎯" }, ...TRACKS.map(t => ({ id: t.id, label: t.label.split(" ")[0], icon: t.icon }))]
            .map(t => (
              <button key={t.id} onClick={() => { setTrackFilter(t.id as any); setSnippetIdx(0); resetState(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={trackFilter === t.id ? {
                  background: "linear-gradient(135deg,#6C3FD4,#4F46E5)",
                  border: "1px solid rgba(108,63,212,0.5)", color: "#fff",
                  boxShadow: "0 0 14px rgba(108,63,212,0.35)",
                } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
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
                  {["#FF5555","#FFB86C","#50FA7B"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />)}
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

            {/* Code with optional line highlight */}
            <CodeDisplay code={snippet.code} activeLine={activeLine} />

            {/* ── Visual Trace Section ── */}
            {hasTrace && (
              <div className="px-5 py-5 space-y-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#BD93F9" }}>
                    🧠 Memory Trace
                  </span>
                  <div className="flex gap-1.5">
                    {!tracing ? (
                      <button onClick={startTrace}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                        <Play className="w-3 h-3" /> Start Trace
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setAutoPlay(a => !a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={autoPlay
                            ? { background: "rgba(255,184,108,0.2)", border: "1px solid rgba(255,184,108,0.4)", color: "#FFB86C" }
                            : { background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                          <SkipForward className="w-3 h-3" /> {autoPlay ? "Pause" : "Auto"}
                        </button>
                        <button onClick={stepForward}
                          disabled={traceStep >= traceSteps.length - 1 || autoPlay}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                          style={{ background: "rgba(108,63,212,0.2)", border: "1px solid rgba(108,63,212,0.4)", color: "#BD93F9" }}>
                          <StepForward className="w-3 h-3" /> Step
                        </button>
                        <button onClick={resetTrace}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {tracing && traceStep >= 0
                  ? <VisualTrace steps={traceSteps} currentStep={traceStep} />
                  : (
                    <p className="text-xs text-center py-4" style={{ color: "#4a4070" }}>
                      Click <span style={{ color: "#BD93F9" }}>Start Trace</span> to watch variables update box by box
                    </p>
                  )
                }
              </div>
            )}

            {/* Predict area */}
            <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <label className="block text-sm font-semibold text-white">Final Output Prediction</label>
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
