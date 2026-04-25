"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Clock, TrendingUp, BookOpen, Plus, Trash2, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface UserSubject {
  id: string;
  name: string;
  color: string;
  target_grade: number | null;
  current_grade: number | null;
  credits: number;
}

interface SubjectStats {
  subjectId: string;
  totalMinutes: number;
  sessionCount: number;
}

const PRESET_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#10b981","#06b6d4","#3b82f6",
];

function GradeBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function SubjectCard({ subject, stats, onStartSession, onDelete }: {
  subject: UserSubject;
  stats: SubjectStats | undefined;
  onStartSession: (subject: UserSubject) => void;
  onDelete: (id: string) => void;
}) {
  const hours = Math.floor((stats?.totalMinutes ?? 0) / 60);
  const minutes = (stats?.totalMinutes ?? 0) % 60;
  const lowGrade =
    (stats?.totalMinutes ?? 0) > 300 &&
    subject.current_grade !== null &&
    subject.target_grade !== null &&
    subject.current_grade < subject.target_grade * 0.75;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="theme-card p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: subject.color }}
          >
            {subject.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{subject.name}</p>
            <p className="text-xs text-[rgb(var(--muted-fg))]">{subject.credits} credits</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(subject.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[rgb(var(--muted-fg))] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {lowGrade && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>High study time but grade is below target — try a different study strategy!</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[rgb(var(--muted))]">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-[rgb(var(--primary))]" />
            <span className="text-[10px] text-[rgb(var(--muted-fg))] uppercase font-semibold tracking-wider">Studied</span>
          </div>
          <p className="text-xl font-bold">{hours}h {minutes}m</p>
          <p className="text-[11px] text-[rgb(var(--muted-fg))]">{stats?.sessionCount ?? 0} sessions</p>
        </div>
        <div className="p-3 rounded-xl bg-[rgb(var(--muted))]">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-[rgb(var(--muted-fg))] uppercase font-semibold tracking-wider">Grade</span>
          </div>
          <p className="text-xl font-bold">
            {subject.current_grade != null ? `${subject.current_grade.toFixed(0)}%` : "—"}
          </p>
          <p className="text-[11px] text-[rgb(var(--muted-fg))]">
            Target: {subject.target_grade != null ? `${subject.target_grade}%` : "not set"}
          </p>
        </div>
      </div>

      {subject.current_grade != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-[rgb(var(--muted-fg))]">
            <span>Progress to target</span>
            <span style={{ color: subject.color }}>{subject.current_grade.toFixed(0)}%</span>
          </div>
          <GradeBar value={subject.current_grade} max={subject.target_grade ?? 100} color={subject.color} />
        </div>
      )}

      <button
        onClick={() => onStartSession(subject)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: subject.color }}
      >
        Start Study Session →
      </button>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const { userId, loaded } = useCurrentUser();
  const router = useRouter();
  const supabase = createClient();

  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newCredits, setNewCredits] = useState(3);
  const [newTarget, setNewTarget] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded || !userId) return;
    loadData();
  }, [loaded, userId]);

  async function loadData() {
    setLoading(true);
    const [{ data: subs }, { data: logs }] = await Promise.all([
      supabase.from("user_subjects").select("*").eq("user_id", userId!).order("name"),
      supabase.from("study_logs").select("subject_id, duration_minutes").eq("user_id", userId!),
    ]);

    setSubjects((subs as UserSubject[]) ?? []);

    const statsMap = new Map<string, SubjectStats>();
    for (const log of (logs ?? []) as { subject_id: string | null; duration_minutes: number }[]) {
      if (!log.subject_id) continue;
      const existing = statsMap.get(log.subject_id) ?? { subjectId: log.subject_id, totalMinutes: 0, sessionCount: 0 };
      existing.totalMinutes += log.duration_minutes;
      existing.sessionCount += 1;
      statsMap.set(log.subject_id, existing);
    }
    setStats(Array.from(statsMap.values()));
    setLoading(false);
  }

  async function addSubject() {
    if (!newName.trim() || !userId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("user_subjects")
      .insert({
        user_id: userId,
        name: newName.trim(),
        color: newColor,
        credits: newCredits,
        target_grade: newTarget !== "" ? Number(newTarget) : null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setSubjects(p => [...p, data as UserSubject]);
      setNewName("");
      setNewTarget("");
      setShowAdd(false);
    }
  }

  async function deleteSubject(id: string) {
    await supabase.from("user_subjects").delete().eq("id", id);
    setSubjects(p => p.filter(s => s.id !== id));
    setStats(p => p.filter(s => s.subjectId !== id));
  }

  function startSession(subject: UserSubject) {
    router.push(`/study`);
  }

  const totalMinutes = stats.reduce((s, r) => s + r.totalMinutes, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[rgb(var(--primary))]" />
            Subject Mastery
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">
            {subjects.length} subjects · {totalH}h {totalM}m total study time
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/study"
            className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm font-medium hover:bg-[rgb(var(--border))] transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Timer
          </Link>
          <button
            onClick={() => setShowAdd(p => !p)}
            className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="theme-card p-5 space-y-3"
          >
            <p className="font-semibold text-sm">New Subject</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Linear Algebra"
                  className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Credits</label>
                  <input
                    type="number" min={1} max={6} value={newCredits}
                    onChange={e => setNewCredits(Number(e.target.value))}
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Target %</label>
                  <input
                    type="number" min={0} max={100}
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="80"
                    className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:border-[rgb(var(--primary))]"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted-fg))] mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform",
                      newColor === c && "scale-125 ring-2 ring-white ring-offset-2 ring-offset-[rgb(var(--bg))]"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={addSubject}
                disabled={!newName.trim() || saving}
                className="px-6 py-2 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {saving ? "Adding…" : "Add Subject"}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
          <p className="font-semibold mb-1">No subjects yet</p>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Add a subject above to start tracking your mastery
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              stats={stats.find(s => s.subjectId === subject.id)}
              onStartSession={startSession}
              onDelete={deleteSubject}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
