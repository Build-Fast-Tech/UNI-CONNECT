"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Users, Copy, Plus, X, LogIn,
  Brain, Coffee, Zap, Timer, BarChart3, Settings, AlertCircle, CheckCircle2,
  Search,
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
interface StudyGroup {
  id: string; name: string; description: string | null;
  type: "permanent" | "temporary"; subject: string;
  creator_id: string; created_at: string; expires_at: string | null;
}
interface LiveSession {
  userId: string; fullName: string; subjectName: string;
  secondsLeft: number; mode: string; sessionCode: string | null;
  groupId: string | null;
  studyGroupId: string | null;
  studyGroupName: string | null;
  isRunning: boolean;
  isPrivate: boolean;
}
interface LeaderboardEntry {
  user_id: string; full_name: string; avatar_url: string | null; total_minutes: number;
}

const MODE_CONFIG: Record<TimerMode, { label: string; color: string; bg: string; seconds: number }> = {
  pomodoro:    { label: "Pomodoro",    color: "rgb(var(--hue-a))", bg: "rgb(var(--hue-a) / 0.15)", seconds: 25*60 },
  short_break: { label: "Short Break", color: "rgb(var(--hue-b))", bg: "rgb(var(--hue-b) / 0.15)", seconds: 5*60  },
  long_break:  { label: "Long Break",  color: "rgb(var(--hue-f))", bg: "rgb(var(--hue-f) / 0.15)", seconds: 15*60 },
};

const PRESET_COLORS = [
  "rgb(var(--hue-a))","rgb(var(--hue-e))","rgb(var(--hue-d))","rgb(var(--destructive))",
  "rgb(var(--hue-c))","rgb(var(--warning))","rgb(var(--positive))","rgb(var(--hue-b))",
  "rgb(var(--hue-f))","rgb(var(--primary))",
];
const PRESET_SUBJECTS = ["Mathematics","Physics","Chemistry","Computer Science","Linear Algebra","Data Structures","Calculus","Statistics","Economics","History"];

const CONFIG_KEY = "uc_timer_config";

interface SavedConfig { pomodoro: number; short_break: number; long_break: number; }

function loadConfig(): SavedConfig {
  if (typeof window === "undefined") return { pomodoro: 25, short_break: 5, long_break: 15 };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw) as SavedConfig;
  } catch {}
  return { pomodoro: 25, short_break: 5, long_break: 15 };
}

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

  const [mainTab, setMainTab] = useState<"timer" | "private" | "groups" | "leaderboard">("timer");
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<UserSubject | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  // Study Groups
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"permanent" | "temporary">("permanent");
  const [newGroupSubject, setNewGroupSubject] = useState("");
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  const [groupActiveCounts, setGroupActiveCounts] = useState<Record<string, number>>({});
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(PRESET_COLORS[0]);
  const [todayPomodoros, setTodayPomodoros] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [addSubjectError, setAddSubjectError] = useState("");
  const [addSubjectSuccess, setAddSubjectSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timerConfig, setTimerConfig] = useState<SavedConfig>(loadConfig);
  const [draftConfig, setDraftConfig] = useState<SavedConfig>(loadConfig);
  const [groupLeaderboards, setGroupLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [expandedLeaderboard, setExpandedLeaderboard] = useState<string | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const groupPresenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const joinedGroupIdRef = useRef<string | null>(null);
  const sessionCodeRef = useRef<string | null>(null);
  const groupModeRef = useRef(false);

  const { state, setMode, start, pause, reset, onComplete, progress } = useTimer(sessionCode, {
    pomodoro:    timerConfig.pomodoro    * 60,
    short_break: timerConfig.short_break * 60,
    long_break:  timerConfig.long_break  * 60,
  });
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

  // Keep refs in sync so presence callbacks can read latest values without re-subscribing
  useEffect(() => { sessionCodeRef.current = sessionCode; }, [sessionCode]);
  useEffect(() => { groupModeRef.current = groupMode; }, [groupMode]);
  useEffect(() => { joinedGroupIdRef.current = joinedGroupId; }, [joinedGroupId]);

  // Presence channel — subscribe once
  useEffect(() => {
    if (!userId || !fullName) return;
    const ch = supabase.channel("study-presence");
    ch.on("presence", { event: "sync" }, () => {
      const raw = ch.presenceState<any>();
      const myCode = sessionCodeRef.current;

      setLiveSessions(
        Object.values(raw).flat().filter((s: any) => {
          // Always show self when timer is running, in a private session, or in a study group
          if (s.userId === userId) {
            return s.isRunning || (s.isPrivate && s.sessionCode) || s.studyGroupId;
          }
          // Others running in public pomodoro
          if (s.isRunning && s.mode === "pomodoro" && !s.isPrivate) return true;
          // Others running in (or present in) the same private session code
          if (s.isPrivate && s.sessionCode && s.sessionCode === myCode) return true;
          // Others who have joined any study group
          if (s.studyGroupId) return true;
          return false;
        }) as LiveSession[]
      );
    });
    ch.subscribe();
    presenceRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [userId, fullName]);

  // Re-track whenever anything that affects presence changes
  useEffect(() => {
    if (!presenceRef.current || !userId) return;

    const inPrivateSession = groupMode && !!sessionCode;
    const inStudyGroup = !!joinedGroupId;
    const shouldTrack = (state.isRunning && !!selectedSubject) || inPrivateSession || inStudyGroup;

    if (shouldTrack) {
      presenceRef.current.track({
        userId, fullName,
        subjectName: selectedSubject?.name ?? "",
        secondsLeft: state.secondsLeft,
        mode: state.mode,
        isRunning: state.isRunning,
        sessionCode: inPrivateSession ? sessionCode : null,
        isPrivate: inPrivateSession,
        studyGroupId: joinedGroupId,
        studyGroupName: joinedGroupId
          ? (studyGroups.find(g => g.id === joinedGroupId)?.name ?? null)
          : null,
        groupId: null,
      });
    } else {
      presenceRef.current.untrack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRunning, state.mode, selectedSubject?.id, groupMode, sessionCode, joinedGroupId]);

  // On phase complete
  onComplete(useCallback((completedMode: TimerMode) => {
    playDing();
    if (completedMode === "pomodoro") {
      setTodayPomodoros(p => p + 1);
      setTodayMinutes(p => p + 25);
      if (userId && selectedSubject) {
        (supabase as any).from("study_logs").insert({
          user_id: userId, subject_id: selectedSubject.id,
          duration_minutes: 25, is_group_session: groupMode, session_code: sessionCode,
          study_group_id: joinedGroupId ?? null,
        });
        if (joinedGroupId) fetchLeaderboard(joinedGroupId);
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
    setAddSubjectError("");
    setAddSubjectSuccess(false);
    const { data, error } = await supabase.from("user_subjects")
      .insert({ user_id: userId, name: newSubjectName.trim(), color: newSubjectColor, credits: 3 })
      .select().single();
    if (error) {
      if (error.code === "42P01") {
        setAddSubjectError("Table not found — run migration 019 in Supabase SQL Editor.");
      } else if (error.code === "42501" || error.message.includes("policy")) {
        setAddSubjectError("Permission denied — run migration 019 in your Supabase SQL Editor to fix RLS.");
      } else if (error.code === "23505") {
        setAddSubjectError("You already have a subject with that name.");
      } else {
        setAddSubjectError(error.message);
      }
      return;
    }
    if (data) {
      setSubjects(p => [...p, data as UserSubject]);
      setSelectedSubject(data as UserSubject);
      setNewSubjectName("");
      setShowAddSubject(false);
      setAddSubjectSuccess(true);
      setTimeout(() => setAddSubjectSuccess(false), 3000);
    }
  };

  const saveTimerConfig = () => {
    setTimerConfig(draftConfig);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(draftConfig));
    setShowSettings(false);
    reset();
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

  // ── Study Groups ──
  useEffect(() => {
    (supabase as any).from("study_groups").select("*").eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: StudyGroup[] | null }) => setStudyGroups(data ?? []));
  }, []);

  // Global groups presence — single shared channel, group-specific counts
  useEffect(() => {
    if (!userId || !fullName) return;
    const ch = supabase.channel("study-groups-presence");
    groupPresenceRef.current = ch;

    ch.on("presence", { event: "sync" }, () => {
      const raw = ch.presenceState<{ userId: string; groupId: string }>();
      const counts: Record<string, number> = {};
      Object.values(raw).flat().forEach((s: any) => {
        if (s.groupId) counts[s.groupId] = (counts[s.groupId] ?? 0) + 1;
      });
      setGroupActiveCounts(counts);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // If the user is already inside a group when the channel becomes ready, track immediately
        const gid = joinedGroupIdRef.current;
        if (gid) await ch.track({ userId, fullName, groupId: gid });
      }
    });

    return () => { supabase.removeChannel(ch); };
  }, [userId, fullName]);

  // Broadcast presence into joined group (or untrack when leaving)
  // This handles changes AFTER the channel is already subscribed
  useEffect(() => {
    const ch = groupPresenceRef.current;
    if (!ch || !userId) return;
    if (joinedGroupId) {
      ch.track({ userId, fullName, groupId: joinedGroupId });
    } else {
      ch.untrack();
    }
  }, [joinedGroupId, userId, fullName]);

  const createStudyGroup = async () => {
    if (!newGroupName.trim() || !userId) return;
    const { data } = await (supabase as any).from("study_groups").insert({
      name: newGroupName.trim(),
      type: newGroupType,
      subject: newGroupSubject.trim() || "General",
      creator_id: userId,
      is_active: true,
      expires_at: newGroupType === "temporary"
        ? new Date(Date.now() + 24 * 3600 * 1000).toISOString()
        : null,
    }).select().single();
    if (data) {
      setStudyGroups(p => [data as unknown as StudyGroup, ...p]);
      setJoinedGroupId((data as unknown as StudyGroup).id);
      setNewGroupName(""); setNewGroupSubject("");
      setShowCreateGroup(false);
    }
  };

  const toggleJoinGroup = (groupId: string) => {
    if (joinedGroupId === groupId) { setJoinedGroupId(null); return; }
    setJoinedGroupId(groupId);
    if (!groupLeaderboards[groupId]) fetchLeaderboard(groupId);
  };

  const fetchLeaderboard = async (groupId: string) => {
    const { data } = await (supabase as any)
      .from("study_logs")
      .select("user_id, duration_minutes, profile:profiles!user_id(full_name, avatar_url)")
      .eq("study_group_id", groupId);
    if (!data) return;
    const map: Record<string, LeaderboardEntry> = {};
    for (const row of data as any[]) {
      const uid: string = row.user_id;
      if (!map[uid]) map[uid] = { user_id: uid, full_name: row.profile?.full_name ?? "Unknown", avatar_url: row.profile?.avatar_url ?? null, total_minutes: 0 };
      map[uid].total_minutes += row.duration_minutes;
    }
    setGroupLeaderboards(p => ({ ...p, [groupId]: Object.values(map).sort((a, b) => b.total_minutes - a.total_minutes) }));
  };

  const fetchGlobalLeaderboard = async () => {
    if (globalLeaderboard.length > 0) return; // already loaded
    setLbLoading(true);
    const { data } = await (supabase as any)
      .from("study_logs")
      .select("user_id, duration_minutes, profile:profiles!user_id(full_name, avatar_url)");
    if (data) {
      const map: Record<string, LeaderboardEntry> = {};
      for (const row of data as any[]) {
        const uid: string = row.user_id;
        if (!map[uid]) map[uid] = { user_id: uid, full_name: row.profile?.full_name ?? "Unknown", avatar_url: row.profile?.avatar_url ?? null, total_minutes: 0 };
        map[uid].total_minutes += row.duration_minutes;
      }
      setGlobalLeaderboard(Object.values(map).sort((a, b) => b.total_minutes - a.total_minutes));
    }
    setLbLoading(false);
  };

  const toggleLeaderboard = (groupId: string) => {
    if (expandedLeaderboard === groupId) { setExpandedLeaderboard(null); return; }
    setExpandedLeaderboard(groupId);
    if (!groupLeaderboards[groupId]) fetchLeaderboard(groupId);
  };

  const filteredGroups = studyGroups.filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.subject.toLowerCase().includes(groupSearch.toLowerCase())
  );

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setDraftConfig(timerConfig); setShowSettings(p => !p); }}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showSettings
                  ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
            <Link href="/study/analytics" className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl bg-[rgb(var(--muted))]">
          {([
            { key: "timer",       label: "Timer" },
            { key: "private",     label: "Private" },
            { key: "groups",      label: "Groups" },
            { key: "leaderboard", label: "Leaderboard" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => { setMainTab(tab.key); if (tab.key === "leaderboard") fetchGlobalLeaderboard(); }}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                mainTab === tab.key
                  ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                  : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {mainTab !== "leaderboard" && (<>
        {/* Timer Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="theme-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[rgb(var(--primary))]" /> Timer Settings
                  </p>
                  <button onClick={() => setShowSettings(false)} className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { key: "pomodoro" as const, label: "Pomodoro", color: "rgb(var(--hue-a))", max: 60 },
                    { key: "short_break" as const, label: "Short Break", color: "rgb(var(--hue-b))", max: 30 },
                    { key: "long_break" as const, label: "Long Break", color: "rgb(var(--hue-f))", max: 60 },
                  ].map(({ key, label, color, max }) => (
                    <div key={key} className="text-center">
                      <label className="block text-xs text-[rgb(var(--muted-fg))] mb-2 font-medium">{label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={max}
                          value={draftConfig[key]}
                          onChange={e => setDraftConfig(p => ({ ...p, [key]: Math.max(1, Math.min(max, Number(e.target.value))) }))}
                          className="w-full h-12 text-center text-xl font-bold font-mono rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2"
                          style={{ color, borderColor: color + "44" }}
                        />
                        <span className="text-[10px] text-[rgb(var(--muted-fg))] mt-1 block">minutes</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveTimerConfig}
                  className="w-full py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Apply & Reset Timer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    {addSubjectError && (
                      <p className="text-xs text-red-400 flex items-start gap-1.5 bg-red-500/10 px-2 py-1.5 rounded-lg">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{addSubjectError}</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={addSubject} disabled={!newSubjectName.trim()} className="flex-1 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium disabled:opacity-40">Add</button>
                      <button onClick={() => { setShowAddSubject(false); setAddSubjectError(""); }} className="px-3 py-1.5 rounded-lg bg-[rgb(var(--border))] text-sm">Cancel</button>
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

          {/* Right: private session + live */}
          <div className="lg:col-span-2 space-y-3">
            {/* Private Study Session — only on "private" tab */}
            {mainTab === "private" && (
            <div className="theme-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm flex items-center gap-1.5"><Users className="w-4 h-4 text-[rgb(var(--primary))]" /> Private Study Session</p>
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
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] text-center">Share this code — each member keeps their own timer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={startGroup} className="w-full py-2 rounded-xl bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-sm font-semibold hover:bg-[rgb(var(--primary)/0.2)] transition-colors">
                    Start Private Session
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
            )}

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
                  {liveSessions.map((s, i) => {
                    const isSelf = s.userId === userId;
                    const subtitle = s.studyGroupId
                      ? `In: ${s.studyGroupName || "Study Group"}`
                      : s.isRunning
                        ? `${s.subjectName || "Studying"} · ${formatTime(s.secondsLeft)}`
                        : s.isPrivate
                          ? "Private session"
                          : "Online";
                    return (
                      <div key={i} className={cn(
                        "flex items-center gap-2 p-2 rounded-xl",
                        isSelf ? "bg-[rgb(var(--primary)/0.08)] border border-[rgb(var(--primary)/0.2)]" : "bg-[rgb(var(--muted))]"
                      )}>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate flex items-center gap-1">
                            {s.fullName}
                            {isSelf && <span className="text-[10px] text-[rgb(var(--primary))] font-semibold">(you)</span>}
                          </p>
                          <p className="text-[11px] text-[rgb(var(--muted-fg))]">{subtitle}</p>
                        </div>
                        {!isSelf && s.sessionCode && !s.studyGroupId && (
                          <button onClick={() => { setSessionCode(s.sessionCode!); setGroupMode(true); }}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] flex-shrink-0">
                            Join
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        </>)}

        {/* ── Study Groups Tab ── */}
        {mainTab === "groups" && (
          <div className="space-y-4">
            {/* Search + Create */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
                <input value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                  placeholder="Search study groups…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm outline-none focus:border-[rgb(var(--primary))]" />
              </div>
              <button onClick={() => setShowCreateGroup(p => !p)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold">
                <Plus className="w-4 h-4" /> New Group
              </button>
            </div>

            {/* Create Group Form */}
            <AnimatePresence>
              {showCreateGroup && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="theme-card p-4 space-y-3">
                    <p className="font-semibold text-sm">Create Study Group</p>
                    <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                      placeholder="Group name (e.g. CS401 Study Crew)"
                      className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                    <input value={newGroupSubject} onChange={e => setNewGroupSubject(e.target.value)}
                      placeholder="Subject (e.g. Algorithms)"
                      className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]" />
                    <div className="flex gap-2">
                      {(["permanent", "temporary"] as const).map(t => (
                        <button key={t} onClick={() => setNewGroupType(t)}
                          className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
                            newGroupType === t ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]" : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]")}>
                          {t}
                        </button>
                      ))}
                    </div>
                    {newGroupType === "temporary" && (
                      <p className="text-xs text-[rgb(var(--muted-fg))]">Temporary groups expire after 24 hours.</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={createStudyGroup} disabled={!newGroupName.trim()}
                        className="flex-1 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-40">Create</button>
                      <button onClick={() => setShowCreateGroup(false)}
                        className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Joined group — full detail panel */}
            <AnimatePresence>
              {joinedGroupId && (() => {
                const group = studyGroups.find(g => g.id === joinedGroupId);
                if (!group) return null;
                const lb = groupLeaderboards[joinedGroupId];
                return (
                  <motion.div key="group-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="theme-card overflow-hidden ring-2 ring-[rgb(var(--primary)/0.35)]">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--primary)/0.05)]">
                      <div className="w-9 h-9 rounded-xl bg-[rgb(var(--primary)/0.15)] flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-[rgb(var(--primary))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{group.name}</p>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">{group.subject}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {groupActiveCounts[group.id] ?? 0} active
                        </div>
                        <button onClick={() => toggleJoinGroup(group.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          Leave
                        </button>
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold mb-4">
                        <BarChart3 className="w-4 h-4 text-[rgb(var(--primary))]" /> Leaderboard
                        <span className="text-xs font-normal text-[rgb(var(--muted-fg))]">— total study time, all time</span>
                      </p>
                      {!lb ? (
                        <div className="space-y-2">
                          {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />)}
                        </div>
                      ) : lb.length === 0 ? (
                        <div className="text-center py-8 text-[rgb(var(--muted-fg))]">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No study sessions yet — start the timer to appear here!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {lb.slice(0, 10).map((entry, rank) => {
                            const h = Math.floor(entry.total_minutes / 60);
                            const m = entry.total_minutes % 60;
                            const isTop = rank === 0;
                            return (
                              <div key={entry.user_id}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                                  isTop
                                    ? "bg-amber-400/10 border border-amber-400/20"
                                    : "bg-[rgb(var(--muted)/0.5)]"
                                )}>
                                <span className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                                  rank === 0 ? "bg-amber-400/25 text-amber-400" :
                                  rank === 1 ? "bg-slate-300/20 text-slate-400" :
                                  rank === 2 ? "bg-orange-700/20 text-orange-500" :
                                  "bg-[rgb(var(--border))] text-[rgb(var(--muted-fg))]"
                                )}>
                                  {rank + 1}
                                </span>
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                                  {entry.avatar_url
                                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                    : entry.full_name.charAt(0)}
                                </div>
                                <p className="flex-1 text-sm font-medium truncate">{entry.full_name}</p>
                                <p className={cn("text-sm font-bold flex-shrink-0", isTop ? "text-amber-400" : "text-[rgb(var(--primary))]")}>
                                  {h > 0 ? `${h}h ` : ""}{m}m
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Group list — hidden when inside a group */}
            {!joinedGroupId && (
              <div className="space-y-3">
                {filteredGroups.length === 0 ? (
                  <div className="theme-card p-8 text-center text-[rgb(var(--muted-fg))]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No study groups yet — create one above!</p>
                  </div>
                ) : (
                  filteredGroups.map(group => (
                    <div key={group.id} className="theme-card p-4 transition-all hover:border-[rgb(var(--primary)/0.2)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{group.name}</p>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide",
                              group.type === "permanent" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                            )}>{group.type}</span>
                          </div>
                          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">{group.subject}</p>
                          {group.expires_at && (
                            <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-1">
                              Expires: {new Date(group.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {groupActiveCounts[group.id] ?? 0} active
                          </div>
                          <button onClick={() => toggleJoinGroup(group.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] transition-colors">
                            Join
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Global Leaderboard Tab ── */}
        {mainTab === "leaderboard" && (
          <div className="space-y-6">
            <style>{`
              @keyframes sparkle {
                0%,100% { opacity:.6; transform:scale(1) rotate(0deg); }
                50%      { opacity:1; transform:scale(1.4) rotate(20deg); }
              }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">All-Time Leaderboard</h2>
                <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Total study hours — all sessions combined</p>
              </div>
              <button
                onClick={() => { setGlobalLeaderboard([]); fetchGlobalLeaderboard(); }}
                className="text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors px-3 py-1.5 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]"
              >
                Refresh
              </button>
            </div>

            {lbLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />)}
              </div>
            ) : globalLeaderboard.length === 0 ? (
              <div className="theme-card p-12 text-center text-[rgb(var(--muted-fg))]">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No study sessions logged yet.</p>
              </div>
            ) : (() => {
              const fmt = (mins: number) => {
                const h = Math.floor(mins / 60), m = mins % 60;
                return h > 0 ? `${h}h ${m}m` : `${m}m`;
              };
              const Avatar = ({ entry, size }: { entry: LeaderboardEntry; size: string }) => (
                <div className={cn("rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0", size)}>
                  {entry.avatar_url
                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span>{entry.full_name.charAt(0)}</span>}
                </div>
              );
              const [p1, p2, p3] = globalLeaderboard;
              return (
                <>
                  {/* ── Olympic Podium ── */}
                  <div className="flex items-end justify-center gap-3 pt-4 pb-0">

                    {/* 2nd — Silver */}
                    {p2 && (
                      <div className="flex flex-col items-center">
                        <div className="flex flex-col items-center mb-2 gap-1">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 p-0.5 shadow-lg shadow-slate-400/30">
                              <Avatar entry={p2} size="w-full h-full bg-gradient-to-br from-slate-300 to-slate-500" />
                            </div>
                            <span className="absolute -top-1 -right-1 text-base leading-none">🥈</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-300 max-w-[80px] text-center truncate mt-1">{p2.full_name}{p2.user_id===userId&&<span className="text-[rgb(var(--primary))]"> (you)</span>}</p>
                          <p className="text-xs font-bold text-slate-300 tabular-nums">{fmt(p2.total_minutes)}</p>
                        </div>
                        {/* Step */}
                        <div className="relative w-[88px] h-16 rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-300 to-slate-600">
                          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                            animate={{x:["-110%","210%"]}} transition={{duration:2.5,repeat:Infinity,repeatDelay:1.5,ease:"linear"}} />
                          <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/40 select-none">2</span>
                        </div>
                      </div>
                    )}

                    {/* 1st — Gold (tallest, centre) */}
                    {p1 && (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1 block" style={{animation:"sparkle 1.8s ease-in-out infinite"}}>👑</span>
                        <div className="flex flex-col items-center mb-2 gap-1">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full p-0.5 shadow-xl shadow-amber-400/40 bg-gradient-to-br from-amber-400 to-amber-700">
                              <Avatar entry={p1} size="w-full h-full bg-gradient-to-br from-amber-300 to-amber-600" />
                            </div>
                            <span className="absolute -top-1 -right-1 text-lg leading-none">🥇</span>
                            <span className="absolute -top-3 -left-3 text-xs" style={{animation:"sparkle 1.5s ease-in-out infinite 0.3s"}}>✨</span>
                            <span className="absolute -bottom-2 -right-4 text-xs" style={{animation:"sparkle 2s ease-in-out infinite 0.8s"}}>✨</span>
                            <span className="absolute top-1 -right-5 text-[10px]" style={{animation:"sparkle 1.7s ease-in-out infinite 0.5s"}}>⭐</span>
                          </div>
                          <p className="text-xs font-bold text-amber-300 max-w-[96px] text-center truncate mt-1">{p1.full_name}{p1.user_id===userId&&<span className="text-[rgb(var(--primary))]"> (you)</span>}</p>
                          <p className="text-sm font-black text-amber-400 tabular-nums">{fmt(p1.total_minutes)}</p>
                        </div>
                        {/* Step — tallest */}
                        <div className="relative w-[104px] h-24 rounded-t-2xl overflow-hidden bg-gradient-to-br from-amber-400 to-amber-700">
                          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                            animate={{x:["-110%","210%"]}} transition={{duration:1.8,repeat:Infinity,repeatDelay:0.8,ease:"linear"}} />
                          <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/40 select-none">1</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd — Bronze */}
                    {p3 && (
                      <div className="flex flex-col items-center">
                        <div className="flex flex-col items-center mb-2 gap-1">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full p-0.5 shadow-lg shadow-orange-500/30 bg-gradient-to-br from-orange-500 to-orange-700">
                              <Avatar entry={p3} size="w-full h-full bg-gradient-to-br from-orange-400 to-orange-700" />
                            </div>
                            <span className="absolute -top-1 -right-1 text-base leading-none">🥉</span>
                          </div>
                          <p className="text-[11px] font-semibold text-orange-400 max-w-[80px] text-center truncate mt-1">{p3.full_name}{p3.user_id===userId&&<span className="text-[rgb(var(--primary))]"> (you)</span>}</p>
                          <p className="text-xs font-bold text-orange-400 tabular-nums">{fmt(p3.total_minutes)}</p>
                        </div>
                        {/* Step */}
                        <div className="relative w-[88px] h-12 rounded-t-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-orange-800">
                          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                            animate={{x:["-110%","210%"]}} transition={{duration:2.2,repeat:Infinity,repeatDelay:2,ease:"linear"}} />
                          <span className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/40 select-none">3</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── 4th place and beyond ── */}
                  {globalLeaderboard.length > 3 && (
                    <div className="theme-card overflow-hidden">
                      <div className="divide-y divide-[rgb(var(--border))]">
                        {globalLeaderboard.slice(3).map((entry, idx) => {
                          const isSelf = entry.user_id === userId;
                          return (
                            <div key={entry.user_id} className={cn(
                              "flex items-center gap-3 px-4 py-3 transition-colors",
                              isSelf && "bg-[rgb(var(--primary)/0.06)]"
                            )}>
                              <span className="w-6 text-center text-xs font-bold text-[rgb(var(--muted-fg))] flex-shrink-0">{idx + 4}</span>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                {entry.avatar_url
                                  ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : entry.full_name.charAt(0)}
                              </div>
                              <p className="flex-1 text-sm font-medium truncate">
                                {entry.full_name}
                                {isSelf && <span className="ml-1.5 text-[10px] text-[rgb(var(--primary))] font-semibold">(you)</span>}
                              </p>
                              <p className="text-sm font-bold text-[rgb(var(--primary))] flex-shrink-0 tabular-nums">
                                {fmt(entry.total_minutes)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </motion.div>
    </div>
  );
}
