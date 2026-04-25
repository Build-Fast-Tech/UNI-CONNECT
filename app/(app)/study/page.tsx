"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, Play, Pause, RotateCcw, SkipForward, Users, Copy,
  Plus, Coffee, Brain, Zap, X, LogIn,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useSyncedTimer, formatTime, generateSessionCode } from "@/lib/hooks/useSyncedTimer";
import { cn } from "@/lib/utils";

interface UserSubject {
  id: string;
  name: string;
  color: string;
  target_grade: number | null;
  current_grade: number | null;
  credits: number;
}

interface LiveSession {
  userId: string;
  fullName: string;
  subjectName: string;
  secondsLeft: number;
  phase: "work" | "break";
  sessionCode: string | null;
}

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#10b981","#06b6d4","#3b82f6",
];

const PRESET_SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology","Computer Science",
  "English Literature","History","Economics","Business Studies","Statistics",
  "Calculus","Linear Algebra","Data Structures","Algorithms","Discrete Math",
  "Thermodynamics","Mechanics","Organic Chemistry","Genetics","Accounting",
];

function SubjectPill({ subject, selected, onClick }: {
  subject: UserSubject; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
        selected
          ? "border-transparent text-white scale-105 shadow-lg"
          : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:border-[rgb(var(--primary)/0.4)]"
      )}
      style={selected ? { backgroundColor: subject.color } : {}}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
      {subject.name}
    </button>
  );
}

function TimerCircle({ secondsLeft, phase, isRunning, total }: {
  secondsLeft: number; phase: "work" | "break"; isRunning: boolean; total: number;
}) {
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / total;
  const dashOffset = circumference * (1 - progress);
  const color = phase === "work" ? "#6366f1" : "#10b981";

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="224" height="224">
        <circle cx="112" cy="112" r={radius} fill="none" stroke="rgb(var(--muted))" strokeWidth="8" />
        <circle
          cx="112" cy="112" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <div className="text-5xl font-bold font-mono tracking-tight">{formatTime(secondsLeft)}</div>
        <div className={cn(
          "text-xs font-semibold uppercase tracking-widest mt-1",
          phase === "work" ? "text-[rgb(var(--primary))]" : "text-emerald-400"
        )}>
          {phase === "work" ? "Focus" : "Break"}
        </div>
      </div>
      {isRunning && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-10"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
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
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { state, start, pause, reset, skip } = useSyncedTimer(sessionCode);

  // Load subjects
  useEffect(() => {
    if (!loaded || !userId) return;
    supabase
      .from("user_subjects")
      .select("*")
      .eq("user_id", userId)
      .order("name")
      .then(({ data }) => setSubjects((data as UserSubject[]) ?? []));
  }, [loaded, userId]);

  // Load today's study time
  useEffect(() => {
    if (!userId) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    supabase
      .from("study_logs")
      .select("duration_minutes")
      .eq("user_id", userId)
      .gte("timestamp", today.toISOString())
      .then(({ data }) => {
        const total = (data ?? []).reduce((s: number, r: { duration_minutes: number }) => s + r.duration_minutes, 0);
        setTodayMinutes(total);
      });
  }, [userId]);

  // Presence channel for Live Now
  useEffect(() => {
    if (!userId || !fullName) return;
    const ch = supabase.channel("study-presence");

    ch.on("presence", { event: "sync" }, () => {
      const raw = ch.presenceState<{
        userId: string; fullName: string; subjectName: string;
        secondsLeft: number; phase: "work" | "break"; sessionCode: string | null;
      }>();
      const sessions: LiveSession[] = Object.values(raw)
        .flat()
        .filter((s) => s.userId !== userId && s.phase === "work");
      setLiveSessions(sessions);
    });

    ch.subscribe();
    presenceChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [userId, fullName]);

  // Update presence when timer state changes
  useEffect(() => {
    if (!presenceChannelRef.current || !selectedSubject || !userId) return;
    if (state.isRunning) {
      presenceChannelRef.current.track({
        userId, fullName, subjectName: selectedSubject.name,
        secondsLeft: state.secondsLeft, phase: state.phase, sessionCode,
      });
    } else {
      presenceChannelRef.current.untrack();
    }
  }, [state.isRunning, state.secondsLeft, state.phase, selectedSubject, sessionCode]);

  // Auto-log when a pomodoro completes (work → break transition)
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current === "work" && state.phase === "break" && selectedSubject && userId) {
      logSession(25);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  // Track session start time
  useEffect(() => {
    if (state.isRunning && !sessionStartTime) setSessionStartTime(Date.now());
    if (!state.isRunning) setSessionStartTime(null);
  }, [state.isRunning]);

  async function logSession(minutes: number) {
    if (!userId || !selectedSubject) return;
    await supabase.from("study_logs").insert({
      user_id: userId,
      subject_id: selectedSubject.id,
      duration_minutes: minutes,
      is_group_session: groupMode,
      session_code: sessionCode,
    });
    setTodayMinutes(p => p + minutes);
  }

  async function handleEndSession() {
    if (!sessionStartTime || !selectedSubject) return;
    const minutes = Math.round((Date.now() - sessionStartTime) / 60000);
    if (minutes >= 1) await logSession(minutes);
    pause();
    setSessionStartTime(null);
    if (presenceChannelRef.current) presenceChannelRef.current.untrack();
  }

  async function addSubject() {
    if (!newSubjectName.trim() || !userId) return;
    const { data, error } = await supabase
      .from("user_subjects")
      .insert({ user_id: userId, name: newSubjectName.trim(), color: newSubjectColor, credits: 3 })
      .select()
      .single();
    if (!error && data) {
      setSubjects(p => [...p, data as UserSubject]);
      setSelectedSubject(data as UserSubject);
      setNewSubjectName("");
      setShowNewSubject(false);
    }
  }

  function startGroupSession() {
    const code = generateSessionCode();
    setSessionCode(code);
    setGroupMode(true);
  }

  function joinGroupSession() {
    if (joinCode.trim().length < 4) return;
    setSessionCode(joinCode.trim().toUpperCase());
    setGroupMode(true);
    setJoinCode("");
  }

  function leaveGroup() {
    setSessionCode(null);
    setGroupMode(false);
    reset();
  }

  function copyCode() {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const todayH = Math.floor(todayMinutes / 60);
  const todayM = todayMinutes % 60;

  return (
    <div className={cn("relative transition-all duration-500", focusMode && state.isRunning && "")}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6 pb-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Timer className="w-6 h-6 text-[rgb(var(--primary))]" />
              Study Command Center
            </h1>
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">
              Today: {todayH > 0 ? `${todayH}h ` : ""}{todayM}m studied · {state.completedPomodoros} 🍅
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/study/analytics" className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm font-medium hover:bg-[rgb(var(--border))] transition-colors">
              Analytics
            </Link>
            <button
              onClick={() => setFocusMode(p => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                focusMode
                  ? "bg-[rgb(var(--primary))] text-white border-transparent"
                  : "border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
              )}
            >
              <Brain className="w-4 h-4" />
              {focusMode ? "Focus On" : "Focus Mode"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Subject Selector */}
            <div className="theme-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm">Study Subject</p>
                <button
                  onClick={() => setShowNewSubject(p => !p)}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Subject
                </button>
              </div>

              <AnimatePresence>
                {showNewSubject && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="p-3 bg-[rgb(var(--muted))] rounded-xl space-y-2">
                      <input
                        list="preset-subjects"
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        placeholder="Subject name (or pick from list)"
                        className="w-full bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]"
                      />
                      <datalist id="preset-subjects">
                        {PRESET_SUBJECTS.map(s => <option key={s} value={s} />)}
                      </datalist>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setNewSubjectColor(c)}
                            className={cn(
                              "w-6 h-6 rounded-full transition-transform",
                              newSubjectColor === c && "scale-125 ring-2 ring-white ring-offset-1 ring-offset-[rgb(var(--bg))]"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addSubject}
                          disabled={!newSubjectName.trim()}
                          className="flex-1 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-white text-sm font-medium disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowNewSubject(false)}
                          className="px-3 py-1.5 rounded-lg bg-[rgb(var(--border))] text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <SubjectPill
                    key={s.id}
                    subject={s}
                    selected={selectedSubject?.id === s.id}
                    onClick={() => setSelectedSubject(s)}
                  />
                ))}
                {subjects.length === 0 && (
                  <p className="text-sm text-[rgb(var(--muted-fg))]">
                    Add a subject to get started
                  </p>
                )}
              </div>
            </div>

            {/* Pomodoro Timer */}
            <div className="theme-card p-6 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors",
                  state.phase === "work" ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]" : ""
                )}>
                  <Brain className="w-3.5 h-3.5" /> Work
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors",
                  state.phase === "break" ? "bg-emerald-500/15 text-emerald-400" : ""
                )}>
                  <Coffee className="w-3.5 h-3.5" /> Break
                </div>
              </div>

              <TimerCircle
                secondsLeft={state.secondsLeft}
                phase={state.phase}
                isRunning={state.isRunning}
                total={state.phase === "work" ? 25 * 60 : 5 * 60}
              />

              {selectedSubject && state.isRunning && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: selectedSubject.color + "22", color: selectedSubject.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  Studying {selectedSubject.name}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="w-10 h-10 rounded-xl bg-[rgb(var(--muted))] flex items-center justify-center hover:bg-[rgb(var(--border))] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={state.isRunning ? pause : start}
                  disabled={!selectedSubject}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: state.phase === "work" ? "#6366f1" : "#10b981" }}
                >
                  {state.isRunning
                    ? <Pause className="w-7 h-7" />
                    : <Play className="w-7 h-7 ml-0.5" />}
                </button>
                <button
                  onClick={skip}
                  className="w-10 h-10 rounded-xl bg-[rgb(var(--muted))] flex items-center justify-center hover:bg-[rgb(var(--border))] transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {!selectedSubject && (
                <p className="text-xs text-[rgb(var(--muted-fg))]">Select a subject above to start</p>
              )}

              {state.isRunning && (
                <button
                  onClick={handleEndSession}
                  className="px-6 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                >
                  End Session & Log Time
                </button>
              )}

              {state.completedPomodoros > 0 && (
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {Array.from({ length: Math.min(8, state.completedPomodoros) }).map((_, i) => (
                    <span key={i} className="text-lg">🍅</span>
                  ))}
                  {state.completedPomodoros > 8 && (
                    <span className="text-sm text-[rgb(var(--muted-fg))]">+{state.completedPomodoros - 8}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Group Session */}
            <div className={cn(
              "theme-card p-4 transition-all duration-500",
              focusMode && state.isRunning && "opacity-20 pointer-events-none"
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[rgb(var(--primary))]" />
                  Study with Friends
                </p>
                {groupMode && (
                  <button
                    onClick={leaveGroup}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Leave
                  </button>
                )}
              </div>

              {groupMode ? (
                <div className="space-y-2">
                  <p className="text-xs text-[rgb(var(--muted-fg))]">Session Code — share this</p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-[rgb(var(--muted))] rounded-xl font-mono text-base font-bold tracking-widest text-center text-[rgb(var(--primary))]">
                      {sessionCode}
                    </code>
                    <button
                      onClick={copyCode}
                      className="px-3 py-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors"
                    >
                      {copied ? <span className="text-xs text-emerald-400">✓</span> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] text-center">
                    Timers sync automatically for all members
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={startGroupSession}
                    className="w-full py-2.5 rounded-xl bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-sm font-semibold hover:bg-[rgb(var(--primary)/0.2)] transition-colors"
                  >
                    Start Group Session
                  </button>
                  <div className="flex gap-2">
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && joinGroupSession()}
                      placeholder="Enter code"
                      maxLength={8}
                      className="flex-1 bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm font-mono uppercase outline-none focus:border-[rgb(var(--primary))]"
                    />
                    <button
                      onClick={joinGroupSession}
                      className="px-3 py-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Now */}
            <div className={cn(
              "theme-card p-4 transition-all duration-500",
              focusMode && state.isRunning && "opacity-20 pointer-events-none"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-semibold text-sm">Live Now</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveSessions.length} studying
                </span>
              </div>

              {liveSessions.length === 0 ? (
                <div className="text-center py-6">
                  <Zap className="w-7 h-7 text-[rgb(var(--muted-fg))] mx-auto mb-2 opacity-30" />
                  <p className="text-xs text-[rgb(var(--muted-fg))]">No active sessions</p>
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">Start a session to appear here!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {liveSessions.map((session, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[rgb(var(--muted))]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {session.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{session.fullName}</p>
                        <p className="text-[11px] text-[rgb(var(--muted-fg))] truncate">
                          {session.subjectName} · {formatTime(session.secondsLeft)}
                        </p>
                      </div>
                      {session.sessionCode && (
                        <button
                          onClick={() => {
                            setSessionCode(session.sessionCode);
                            setGroupMode(true);
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium hover:bg-[rgb(var(--primary)/0.2)] flex-shrink-0 transition-colors"
                        >
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
