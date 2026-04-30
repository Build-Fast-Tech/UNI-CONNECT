"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Plus, Trash2, TrendingUp,
  AlertTriangle, Check, ChevronDown, ChevronUp,
} from "lucide-react";
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

interface Assignment {
  id: string;
  subject_id: string;
  name: string;
  grade: number;
  max_grade: number;
  weight: number;
  created_at: string;
}

interface SubjectHours {
  subjectId: string;
  totalMinutes: number;
}

function gradeToLetter(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 85) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 55) return "C";
  if (pct >= 50) return "D";
  return "F";
}

function gradeColor(pct: number): string {
  if (pct >= 80) return "#22c55e";
  if (pct >= 65) return "#f59e0b";
  if (pct >= 50) return "#f97316";
  return "#ef4444";
}

function pctToGpa4(pct: number): number {
  if (pct >= 90) return 4.0;
  if (pct >= 85) return 3.7;
  if (pct >= 80) return 3.3;
  if (pct >= 75) return 3.0;
  if (pct >= 70) return 2.7;
  if (pct >= 65) return 2.3;
  if (pct >= 60) return 2.0;
  if (pct >= 55) return 1.7;
  if (pct >= 50) return 1.0;
  return 0.0;
}

function GradeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 rounded-full bg-[rgb(var(--muted))] overflow-hidden flex-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function GPAGauge({ gpa, scale }: { gpa: number; scale: "4.0" | "percent" }) {
  const max = scale === "4.0" ? 4.0 : 100;
  const pct = Math.min(100, (gpa / max) * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  const display = scale === "4.0" ? gpa.toFixed(2) : `${gpa.toFixed(1)}%`;
  const letter = gradeToLetter(scale === "4.0" ? gpa * 25 : gpa);

  return (
    <div className="theme-card p-6 flex items-center gap-6">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="-rotate-90" width="96" height="96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgb(var(--muted))" strokeWidth="8" />
          <motion.circle
            cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={2 * Math.PI * 40}
            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - pct / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none">{display}</span>
          <span className="text-[10px] text-[rgb(var(--muted-fg))] uppercase font-semibold tracking-wider">GPA</span>
        </div>
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold mb-0.5">Your GPA</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))] mb-3">
          {letter} · {pct >= 80 ? "Excellent" : pct >= 65 ? "Good" : pct >= 50 ? "Average" : "Needs improvement"}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <GradeBar value={pct} max={100} color={color} />
          </div>
          <span className="text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">{pct.toFixed(0)}%</span>
        </div>
        {gpa === 0 && (
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-2">Add assignment grades below to calculate your GPA</p>
        )}
      </div>
    </div>
  );
}

export default function GPAPage() {
  const { userId, loaded } = useCurrentUser();
  const supabase = createClient();

  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjectHours, setSubjectHours] = useState<SubjectHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpaScale, setGpaScale] = useState<"4.0" | "percent">("percent");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [showAddFor, setShowAddFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", grade: "", max_grade: "100", weight: "100" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded || !userId) return;
    loadAll();
  }, [loaded, userId]);

  async function loadAll() {
    setLoading(true);
    const [{ data: subs }, { data: assigns }, { data: logs }, { data: profile }] = await Promise.all([
      supabase.from("user_subjects").select("*").eq("user_id", userId!).order("name"),
      supabase.from("gpa_assignments").select("*").eq("user_id", userId!).order("created_at"),
      supabase.from("study_logs").select("subject_id, duration_minutes").eq("user_id", userId!),
      supabase.from("profiles").select("gpa_scale").eq("id", userId!).single(),
    ]);

    setSubjects((subs as UserSubject[]) ?? []);
    setAssignments((assigns as Assignment[]) ?? []);
    if (profile?.gpa_scale) setGpaScale(profile.gpa_scale as "4.0" | "percent");

    const hoursMap = new Map<string, number>();
    for (const log of (logs ?? []) as { subject_id: string | null; duration_minutes: number }[]) {
      if (!log.subject_id) continue;
      hoursMap.set(log.subject_id, (hoursMap.get(log.subject_id) ?? 0) + log.duration_minutes);
    }
    setSubjectHours(
      Array.from(hoursMap.entries()).map(([subjectId, totalMinutes]) => ({ subjectId, totalMinutes }))
    );
    setLoading(false);
  }

  function getSubjectScore(subjectId: string): number {
    const subAssigns = assignments.filter(a => a.subject_id === subjectId);
    if (!subAssigns.length) return 0;
    let n = 0, d = 0;
    for (const a of subAssigns) {
      n += (a.grade / a.max_grade) * 100 * a.weight;
      d += a.weight;
    }
    return d ? n / d : 0;
  }

  // Weighted GPA: Σ(subject_score% × credits) / Σ(credits)
  const calculatedGpa = useMemo(() => {
    const scoredSubjects = subjects.filter(s => assignments.some(a => a.subject_id === s.id));
    if (!scoredSubjects.length) return 0;
    let num = 0, den = 0;
    for (const s of scoredSubjects) {
      const score = getSubjectScore(s.id);
      num += score * s.credits;
      den += s.credits;
    }
    if (!den) return 0;
    const pct = num / den;
    return gpaScale === "4.0" ? pctToGpa4(pct) : pct;
  }, [subjects, assignments, gpaScale]);

  function toggle(id: string) {
    setExpandedSubjects(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function addAssignment(subjectId: string) {
    if (!form.name.trim() || !form.grade || !userId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("gpa_assignments")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        name: form.name.trim(),
        grade: Number(form.grade),
        max_grade: Number(form.max_grade),
        weight: Number(form.weight),
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      const newAssignments = [...assignments, data as Assignment];
      setAssignments(newAssignments);
      setForm({ name: "", grade: "", max_grade: "100", weight: "100" });
      setShowAddFor(null);
      // Update subject current_grade
      const newScore = (() => {
        const subs = newAssignments.filter(a => a.subject_id === subjectId);
        let n = 0, d = 0;
        for (const a of subs) { n += (a.grade / a.max_grade) * 100 * a.weight; d += a.weight; }
        return d ? n / d : 0;
      })();
      await supabase.from("user_subjects").update({ current_grade: newScore }).eq("id", subjectId);
      setSubjects(p => p.map(s => s.id === subjectId ? { ...s, current_grade: newScore } : s));
    }
  }

  async function deleteAssignment(id: string, subjectId: string) {
    await supabase.from("gpa_assignments").delete().eq("id", id);
    const remaining = assignments.filter(a => a.id !== id);
    setAssignments(remaining);
    const newScore = (() => {
      const subs = remaining.filter(a => a.subject_id === subjectId);
      if (!subs.length) return null;
      let n = 0, d = 0;
      for (const a of subs) { n += (a.grade / a.max_grade) * 100 * a.weight; d += a.weight; }
      return d ? n / d : null;
    })();
    await supabase.from("user_subjects").update({ current_grade: newScore }).eq("id", subjectId);
    setSubjects(p => p.map(s => s.id === subjectId ? { ...s, current_grade: newScore } : s));
  }

  async function updateGpaScale(scale: "4.0" | "percent") {
    setGpaScale(scale);
    await supabase.from("profiles").update({ gpa_scale: scale }).eq("id", userId!);
  }

  const warnings = subjects.filter(s => {
    const hours = (subjectHours.find(h => h.subjectId === s.id)?.totalMinutes ?? 0) / 60;
    return (
      s.current_grade != null &&
      s.target_grade != null &&
      hours >= 5 &&
      s.current_grade < s.target_grade * 0.75
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[rgb(var(--primary))]" />
            GPA Management
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">
            Track grades and calculate your weighted GPA
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] text-sm">
          {(["percent", "4.0"] as const).map(scale => (
            <button
              key={scale}
              onClick={() => updateGpaScale(scale)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-colors",
                gpaScale === scale
                  ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                  : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}
            >
              {scale === "percent" ? "%" : "4.0"}
            </button>
          ))}
        </div>
      </div>

      {/* UniAI Warnings */}
      <AnimatePresence>
        {warnings.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">UniAI Suggestion — {s.name}</p>
                <p className="text-xs mt-0.5 opacity-80">
                  You&apos;ve been studying {s.name} for a while, but your grade ({s.current_grade?.toFixed(0)}%)
                  is below your target ({s.target_grade?.toFixed(0)}%). Try practice problems,
                  study groups, or ask your professor for targeted help.
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* GPA Gauge */}
      {!loading && <GPAGauge gpa={calculatedGpa} scale={gpaScale} />}

      {/* No subjects state */}
      {!loading && subjects.length === 0 && (
        <div className="theme-card p-8 text-center">
          <GraduationCap className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
          <p className="font-semibold mb-1">No subjects yet</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">
            Add subjects in the Study Analytics page first
          </p>
          <a
            href="/study/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Analytics →
          </a>
        </div>
      )}

      {/* Subject Groups */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subject => {
            const subAssigns = assignments.filter(a => a.subject_id === subject.id);
            const score = getSubjectScore(subject.id);
            const color = gradeColor(score);
            const isExpanded = expandedSubjects.has(subject.id);

            return (
              <div key={subject.id} className="theme-card overflow-hidden">
                <button
                  onClick={() => toggle(subject.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[rgb(var(--muted)/0.3)] transition-colors text-left"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">{subject.name}</span>
                      <span className="text-xs text-[rgb(var(--muted-fg))]">{subject.credits} cr</span>
                      {subAssigns.length > 0 && (
                        <span className="ml-auto text-sm font-bold" style={{ color }}>
                          {score.toFixed(1)}% · {gradeToLetter(score)}
                        </span>
                      )}
                    </div>
                    {subAssigns.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <GradeBar value={score} max={100} color={color} />
                        <span className="text-[11px] text-[rgb(var(--muted-fg))] flex-shrink-0">
                          {subAssigns.length} grade{subAssigns.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-[rgb(var(--muted-fg))] flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-[rgb(var(--muted-fg))] flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-[rgb(var(--border))]"
                    >
                      <div className="p-4 space-y-2">
                        {subAssigns.map(a => {
                          const pct = (a.grade / a.max_grade) * 100;
                          const c = gradeColor(pct);
                          return (
                            <div key={a.id} className="flex items-center gap-3 group">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm">{a.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono" style={{ color: c }}>
                                      {a.grade}/{a.max_grade} ({pct.toFixed(0)}%)
                                    </span>
                                    <span className="text-[11px] text-[rgb(var(--muted-fg))]">wt:{a.weight}%</span>
                                    <button
                                      onClick={() => deleteAssignment(a.id, subject.id)}
                                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[rgb(var(--muted-fg))] hover:text-red-400 transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <GradeBar value={pct} max={100} color={c} />
                              </div>
                            </div>
                          );
                        })}

                        {showAddFor === subject.id ? (
                          <div className="mt-3 p-3 bg-[rgb(var(--muted))] rounded-xl space-y-2">
                            <p className="text-xs font-semibold text-[rgb(var(--muted-fg))] uppercase tracking-wider">
                              Add Grade
                            </p>
                            <input
                              value={form.name}
                              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                              placeholder="Assignment name"
                              className="w-full bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number" min={0}
                                  value={form.grade}
                                  onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                                  placeholder="Grade"
                                  className="flex-1 bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]"
                                />
                                <span className="text-[rgb(var(--muted-fg))] text-sm">/</span>
                                <input
                                  type="number" min={1}
                                  value={form.max_grade}
                                  onChange={e => setForm(p => ({ ...p, max_grade: e.target.value }))}
                                  placeholder="Max"
                                  className="flex-1 bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">Weight%</span>
                                <input
                                  type="number" min={1} max={100}
                                  value={form.weight}
                                  onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                                  className="flex-1 bg-transparent border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[rgb(var(--primary))]"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addAssignment(subject.id)}
                                disabled={!form.name || !form.grade || saving}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium disabled:opacity-40 hover:opacity-90"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                onClick={() => setShowAddFor(null)}
                                className="px-3 py-1.5 rounded-lg bg-[rgb(var(--border))] text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setShowAddFor(subject.id);
                              setExpandedSubjects(p => new Set([...p, subject.id]));
                            }}
                            className="flex items-center gap-1.5 text-xs text-[rgb(var(--primary))] hover:underline mt-1"
                          >
                            <Plus className="w-3 h-3" /> Add grade
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
