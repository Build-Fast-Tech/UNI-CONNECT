"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Users, Copy, Plus, X, LogIn,
  Brain, Coffee, Zap, Timer, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useTimer, formatTime, generateCode, type TimerMode } from "@/lib/hooks/useTimer";
import { cn } from "@/lib/utils";

interface UserSubject {
  id: string; name: string; color: string;
  target_grade: number | null; current_grade: number | null; credits: number;
}
interface LiveSession {
  userId: string; fullName: string; subjectName: string;
  secondsLeft: number; mode: string; sessionCode: string | null;
}

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; bg: string; seconds: number }> = {
  pomodoro:    { label: "Pomodoro",    color: "#6366f1", bg: "rgba(99,102,241,0.15)",  seconds: 25*60 },
  short_break: { label: "Short Break", color: "#10b981", bg: "rgba(16,185,129,0.15)",  seconds: 5*60  },
  long_break:  { label: "Long Break",  color: "#3b82f6", bg: "rgba(59,130,246,0.15)", seconds: 15*60 },
};

const PRESET_COLORS = ["#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308","#22c55e","#10b981","#06b6d4","#3b82f6"];
const PRESET_SUBJECTS = ["Mathematics","Physics","Chemistry","Computer Science","Linear Algebra","Data Structures","Calculus","Statistics","Economics","History"];

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.45);
    });
  } catch {}
}

function ProgressRing({ progress, color, size = 240 }: { progress: number; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, progress)))}
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
      />
    </svg>
  );
}

export default function StudyPage() {
  const { userId, fullName, loaded } = useCurrentUser();
  const supabase = createClient();

  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<UserSubject | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0]);
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { state, setMode, start, pause, reset, onComplete, progress } = useTimer(sessionCode);
  const modeConfig = MODE_CONFIG[state.mode];

  // Load subjects
  useEffect(() => {
    if (!loaded || !userId) return;
    supabase.from("user_subjects").select("*").eq("user_id", userId).order("name")
      .then(({ data, error }) => {
        if (!error) setSubjects((data as UserSubject[]) ?? []);
      });
  }, [loaded, userId]);

  // Load today stats
  useEffect(() => {
    if (!userId) return;
    const today = new Date(); today.setHours(0,0,0,0);
    supabase.from("study_logs").select("duration_minutes").eq("user_id", userId).gte("timestamp", today.toISOString())
      .then(({ data }) => {
        const total = (data ?? []).reduce((s: number, r: any) => s + r.duration_minutes, 0);
        setTodayMinutes(total);
        setTodayPomodoros(Math.floor(total / 25));
      });
  }, [userId]);

  // Presence
  useEffect(() => {
    if (!userId || !fullName) return;
    const ch = supabase.channel("study-presence");
    ch.on("presence", { event: "sync" }, () => {
      const raw = ch.presenceState<any>();
      setLiveSessions(Object.values(raw).flat().filter((s: any) => s.userId !== userId && s.mode === "pomodoro") as LiveSession[]);
    });
    ch.subscribe();
    presenceRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [userId, fullName]);

  // Update presence when timer state changes
  useEffect(() => {
    if (!presenceRef.current || !userId) return;
    if (state.isRunning && selectedSubject) {
      presenceRef.current.track({ userId, fullName, subjectName: selectedSubject.name, secondsLeft: state.secondsLeft, mode: state.mode, sessionCode });
    } else {
      presenceRef.current.untrack();
    }
  }, [state.isRunning, state.secondsLeft, state.mode, selectedSubject]);

  // On phase complete
  onComplete(useCallback((completedMode: TimerMode) => {
    playDing();
    if (completedMode === "pomodoro") {
      setTodayPomodoros(p => p + 1);
      setTodayMinutes(p => p + 25);
      if (userId && selectedSubject) {
        supabase.from("study_logs").insert({
          user_id: userId, subject_id: selectedSubject.id,
          duration_minutes: 25, is_group_session: groupMode, session_code: sessionCode,
        });
      }
    }
  }, [userId, selectedSubject, groupMode, sessionCode]));

  // Track session start for manual end
  useEffect(() => {
    if (state.isRunning && !sessionStartTime) setSessionStartTime(Date.now());
    if (!state.isRunning) setSessionStartTime(null);
  }, [state.isRunning]);

  const addSubject = async () => {
    if (!newSubjectName.trim() || !userId) return;
    const { data, error } = await supabase.from("user_subjects")
      .insert({ user_id: userId, name: newSubjectName.trim(), color: newSubjectColor, credits: 3 })
      .select().single();
    if (!error && data) {
      setSubjects(p => [...p, data as UserSubject]);
      setSelectedSubject(data as UserSubject);
      setNewSubjectName("");
      setShowAddSubject(false);
    }
  };

  const endSession = async () => {
    if (!sessionStartTime || !selectedSubject || !userId) return;
    const minutes = Math.round((Date.now() - sessionStartTime) / 60000);
    if (minutes >= 1) {
      await supabase.from("study_logs").insert({
        user_id: userId, subject_id: selectedSubject.id,
        duration_minutes: minutes, is_group_session: groupMode, session_code: sessionCode,
      });
      setTodayMinutes(p => p + minutes);
    }
    pause();
    if (presenceRef.current) presenceRef.current.untrack();
  };

  const startGroup = () => { const code = generateCode(); setSessionCode(code); setGroupMode(true); };
  const joinGroup = () => { if (joinCode.length >= 4) { setSessionCode(joinCode.toUpperCase()); setGroupMode(true); setJoinCode(""); } };
  const leaveGroup = () => { setSessionCode(null); setGroupMode(false); reset(); };
  const copyCode = () => { if (sessionCode) { navigator.clipboard.writeText(sessionCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  const todayH = Math.floor(todayMinutes / 60);
  const todayM = todayMinutes % 60;

  return (
    <div className="min-h-screen pb-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Timer className="w-5 h-5 text-[rgb(var(--primary))]" /> Study Center
            </h1>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">
              Today: {todayH > 0 ? `${todayH}h ` : ""}{todayM}m · {todayPomodoros} 🍅
            </p>
          </div>
          <Link href="/study/analytics" className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>

        {/* Timer card — pomofocus style */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center gap-6 border border-white/5 transition-colors duration-500"
          style={{ backgroundColor: modeConfig.bg, backdropFilter: "blur(20px)" }}
        >
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-black/20">
            {(["pomodoro", "short_break", "long_break"] as TimerMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
                  state.mode === m
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                )}>
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Timer ring */}
          <div className="relative flex items-center justify-center">
            <ProgressRing progress={progress} color={modeConfig.color} size={256} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-bold font-mono text-white tracking-tight leading-none">
                {formatTime(state.secondsLeft)}
              </span>
              <span className="text-sm text-white/50 mt-2 uppercase tracking-widest font-semibold">
                {state.mode === "pomodoro" ? "Focus" : state.mode === "short_break" ? "Short Break" : "Long Break"}
              </span>
            </div>
          </div>

          {/* Subject pill */}
          {selectedSubject && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-white/90"
              style={{ backgroundColor: selectedSubject.color + "33" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
              {selectedSubject.name}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={reset} className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={state.isRunning ? pause : start}
              disabled={!selectedSubject}
              className="w-20 h-20 rounded-3xl text-white font-bold shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: modeConfig.color }}
            >
              {state.isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
            </button>
            <div className="w-11 h-11 flex items-center justify-center text-white/40 text-xs font-mono">
              ×{state.completedPomodoros}
            </div>
          </div>

          {!selectedSubject && (
            <p className="text-white/40 text-sm">Select a subject below to start</p>
          )}

          {state.isRunning && (
            <button onClick={endSession}
              className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 px-4 py-1.5 rounded-xl hover:border-white/20">
              End Session &amp; Log Time
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Subjects panel */}
          <div className="lg:col-span-3 theme-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Subject</p>
              <button onClick={() => setShowAddSubject(p => !p)}
                className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <AnimatePresence>
              {showAddSubject && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="p-3 bg-[rgb(var(--muted))] rounded-xl space-y-2">
                    <input list="preset-subjects" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addSubject()}
                      placeholder="Subject name" className="w-full bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                    <datalist id="preset-subjects">{PRESET_SUBJECTS.map(s => <option key={s} value={s} />)}</datalist>
                    <div className="flex gap-1.5 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setNewSubjectColor(c)}
                          className={cn("w-6 h-6 rounded-full transition-transform", newSubjectColor === c && "scale-125 ring-2 ring-white ring-offset-1 ring-offset-[rgb(var(--bg))]")}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addSubject} disabled={!newSubjectName.trim()} className="flex-1 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-white text-sm font-medium disabled:opacity-40">Add</button>
                      <button onClick={() => setShowAddSubject(false)} className="px-3 py-1.5 rounded-lg bg-[rgb(var(--border))] text-sm">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <button key={s.id} onClick={() => setSelectedSubject(selectedSubject?.id === s.id ? null : s)}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
                    selectedSubject?.id === s.id
                      ? "border-transparent text-white scale-105 shadow-lg"
                      : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.4)]")}
                  style={selectedSubject?.id === s.id ? { backgroundColor: s.color } : {}}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
              {subjects.length === 0 && <p className="text-sm text-[rgb(var(--muted-fg))]">Add a subject to get started</p>}
            </div>
          </div>

          {/* Right: group + live */}
          <div className="lg:col-span-2 space-y-3">
            {/* Group session */}
            <div className="theme-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm flex items-center gap-1.5"><Users className="w-4 h-4 text-[rgb(var(--primary))]" /> Group Study</p>
                {groupMode && <button onClick={leaveGroup} className="text-xs text-red-400"><X className="w-3.5 h-3.5" /></button>}
              </div>
              {groupMode ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-[rgb(var(--muted))] rounded-xl font-mono font-bold text-base tracking-widest text-center text-[rgb(var(--primary))]">{sessionCode}</code>
                    <button onClick={copyCode} className="px-3 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]">
                      {copied ? "✓" : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] text-center">Timers sync automatically</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={startGroup} className="w-full py-2 rounded-xl bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-sm font-semibold hover:bg-[rgb(var(--primary)/0.2)] transition-colors">
                    Start Group Session
                  </button>
                  <div className="flex gap-2">
                    <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && joinGroup()}
                      placeholder="Enter code" maxLength={8}
                      className="flex-1 bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm font-mono uppercase outline-none focus:border-[rgb(var(--primary))]" />
                    <button onClick={joinGroup} className="px-3 py-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
                      <LogIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Now */}
            <div className="theme-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-semibold text-sm">Live Now</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{liveSessions.length}
                </span>
              </div>
              {liveSessions.length === 0 ? (
                <div className="text-center py-4">
                  <Zap className="w-6 h-6 text-[rgb(var(--muted-fg))] mx-auto mb-1 opacity-20" />
                  <p className="text-xs text-[rgb(var(--muted-fg))]">No one studying yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {liveSessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-[rgb(var(--muted))]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.fullName}</p>
                        <p className="text-[11px] text-[rgb(var(--muted-fg))]">{s.subjectName} · {formatTime(s.secondsLeft)}</p>
                      </div>
                      {s.sessionCode && (
                        <button onClick={() => { setSessionCode(s.sessionCode); setGroupMode(true); }}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] flex-shrink-0">
                          Join
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
