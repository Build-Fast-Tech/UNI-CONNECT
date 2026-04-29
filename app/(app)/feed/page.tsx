"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Briefcase, TrendingUp, Upload, ArrowRight,
  Star, Bot, X, Sparkles, Send,
  Download, Clock, FileText, ChevronRight, MessageCircle, Zap,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useAcademic } from "@/lib/hooks/useAcademic";

interface Note    { id: string; title: string; subject: string; downloads: number; upvotes: number; }
interface Job     { id: string; title: string; company_name: string; type: string; city: string | null; is_remote: boolean; }
interface ChatMsg { id: string; content: string; created_at: string; sender_id: string; sender: { full_name: string; avatar_url: string | null } | null; }
interface CalEvent { id: string; title: string; date: string; start_time: string | null; end_time: string | null; color: string; }

const CHAT_TABS = ["Global", "University", "Private"];
const NOTE_CATS = ["All", "Trending", "Computer Science", "Mathematics", "Business", "Chemistry", "Physics"];
// null = no subject filter; index 1 = Trending sorts by downloads
const NOTE_SUBJECTS: (string | null)[] = [null, null, "Computer Science", "Mathematics", "Business", "Chemistry", "Physics"];

// ─── Live Now Ticker ──────────────────────────────────────────────────────────

interface PresenceSession {
  userId: string;
  fullName: string;
  subjectName: string;
  secondsLeft: number;
  phase: string;
  sessionCode: string | null;
}

function LiveNowTicker() {
  const [sessions, setSessions] = useState<PresenceSession[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel("study-global");
    ch.on("presence", { event: "sync" }, () => {
      const raw = ch.presenceState<any>();
      const all = Object.values(raw).flat() as any[];
      // Only show public sessions in the feed ticker
      setSessions(all.filter(s => s.mode === "pomodoro" && !s.sessionCode && !s.groupId));
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (sessions.length === 0) return null;

  return (
    <div className="theme-card p-3 flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        LIVE
      </div>
      <div className="flex-1 overflow-x-auto flex gap-6" style={{ scrollbarWidth: "none" }}>
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0 text-xs">
            <span className="text-[rgb(var(--fg))]">
              <span className="font-semibold">{s.fullName}</span>
              {" is studying "}
              <span className="text-[rgb(var(--primary))]">{s.subjectName}</span>
              {" — "}
              {Math.floor(s.secondsLeft / 60)}:{String(s.secondsLeft % 60).padStart(2, "0")} remaining
            </span>
            <Link
              href={`/study${s.sessionCode ? `?join=${s.sessionCode}` : ""}`}
              className="px-2 py-0.5 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium hover:bg-[rgb(var(--primary)/0.2)] transition-colors flex-shrink-0"
            >
              Join
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

function HeroBanner({ daysLeft, showDatePicker, setShowDatePicker, dateInput, setDateInput, onSetDate, subjectsToReview }: {
  daysLeft: number | null;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  onSetDate: (d: string) => void;
  subjectsToReview: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between min-h-[186px]"
      style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 35%, #4f46e5 65%, #818cf8 100%)" }}
    >
      {/* existing decorative circles */}
      <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute right-20 bottom-0 w-36 h-36 rounded-full bg-white/5 translate-y-1/3 pointer-events-none" />
      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-white mb-2 leading-snug">
          Your university life,<br />all in one place.
        </h1>
        {daysLeft !== null ? (
          <p className="text-white/80 text-sm mb-3 flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-lg font-bold text-white text-base">{daysLeft > 0 ? daysLeft : 0}</span>
            {daysLeft > 0 ? "days until semester ends" : daysLeft === 0 ? "Semester ends today!" : "Semester has ended"}
          </p>
        ) : (
          <p className="text-white/60 text-xs mb-3">Set your semester end date to see countdown</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-white/90 transition-colors shadow-md">
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/notes" className="px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors">
            Browse Notes
          </Link>
          <button onClick={() => setShowDatePicker(!showDatePicker)} className="px-3 py-2 rounded-xl border border-white/20 text-white/70 text-xs hover:bg-white/10 transition-colors">
            {daysLeft !== null ? "Change Date" : "Set Semester End"}
          </button>
        </div>
        {showDatePicker && (
          <div className="mt-3 flex items-center gap-2">
            <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white outline-none focus:border-white/40" />
            <button onClick={() => { if (dateInput) { onSetDate(dateInput); setShowDatePicker(false); } }}
              className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors">
              Save
            </button>
          </div>
        )}
        {subjectsToReview > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-white/90 text-xs font-medium">
            <span className="text-amber-300">⚠</span>
            <span><strong>{subjectsToReview}</strong> subject{subjectsToReview > 1 ? "s" : ""} need review (under 80%)</span>
            <a href="/study/analytics" className="underline text-amber-200 hover:text-white ml-1">View →</a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) {
  return (
    <div className="theme-card p-4 flex items-center gap-3 flex-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "22" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))] mb-0.5">{label}</p>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function MessageList({ messages, loading }: { messages: ChatMsg[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[rgb(var(--muted))] flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/3" />
              <div className="h-2.5 bg-[rgb(var(--muted))] rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-[rgb(var(--muted-fg))]">
        <MessageCircle className="w-7 h-7 opacity-30" />
        <p className="text-xs">No messages yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {messages.map(msg => (
        <div key={msg.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {msg.sender?.avatar_url
              ? <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
              : (msg.sender?.full_name?.charAt(0).toUpperCase() ?? "?")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium">{msg.sender?.full_name ?? "Unknown"}</span>
              <span className="text-xs text-[rgb(var(--muted-fg))] ml-auto">{formatRelativeTime(msg.created_at)}</span>
            </div>
            <p className="text-xs text-[rgb(var(--muted-fg))] break-words">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommHub({
  globalMsgs, uniMsgs, privateMsgs, loading,
  activeTab, setActiveTab,
}: {
  globalMsgs: ChatMsg[]; uniMsgs: ChatMsg[]; privateMsgs: ChatMsg[];
  loading: boolean; activeTab: number; setActiveTab: (i: number) => void;
}) {
  const currentMsgs = [globalMsgs, uniMsgs, privateMsgs][activeTab] ?? [];

  return (
    <div className="theme-card p-0 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-3">
        <div>
          <p className="font-semibold text-sm">Communication Hub</p>
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">Real-time conversations across your network</p>
        </div>
        <Link href="/chat" className="text-xs text-[rgb(var(--primary))] hover:underline flex items-center gap-0.5 flex-shrink-0">
          Open chat <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-1 px-4 pb-3 border-b border-[rgb(var(--border))]">
        {CHAT_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              activeTab === i
                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]")}>
            {t}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
        </span>
      </div>

      <div className="flex-1 p-4 min-h-[200px]">
        <MessageList messages={currentMsgs} loading={loading} />
      </div>

      <div className="p-3 border-t border-[rgb(var(--border))]">
        <Link href="/chat" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--primary)/0.08)] transition-colors group">
          <span className="flex-1 text-sm text-[rgb(var(--muted-fg))] group-hover:text-[rgb(var(--fg))]">Open full chat to reply…</span>
          <Send className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
        </Link>
      </div>
    </div>
  );
}

function JobPortal({ jobs, loading }: { jobs: Job[]; loading: boolean }) {
  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm">Job Portal</p>
        <Link href="/jobs" className="text-xs text-[rgb(var(--primary))] hover:underline flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-[rgb(var(--muted))] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[rgb(var(--muted))] rounded w-3/4" />
                <div className="h-2.5 bg-[rgb(var(--muted))] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-[rgb(var(--muted-fg))] text-center py-4">No jobs available right now</p>
      ) : (
        <div className="space-y-1">
          {jobs.slice(0, 3).map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`}
              className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[rgb(var(--primary))]">
                {job.company_name.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold truncate group-hover:text-[rgb(var(--primary))] transition-colors">{job.title}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium flex-shrink-0 capitalize">
                    {job.type === "internship" ? "Intern" : job.type}
                  </span>
                </div>
                <p className="text-[11px] text-[rgb(var(--muted-fg))]">
                  {job.company_name} · {job.is_remote ? "Remote" : (job.city ?? "Pakistan")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CVWidget() {
  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-sm">CV Upload</p>
        <span className="text-[10px] text-[rgb(var(--muted-fg))]">Required for 3 Apps</span>
      </div>
      <Link href="/cvs"
        className="flex flex-col items-center py-5 border-2 border-dashed border-[rgb(var(--border))] rounded-xl hover:border-[rgb(var(--primary)/0.4)] hover:bg-[rgb(var(--primary)/0.03)] transition-all group">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center mb-2">
          <Upload className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <p className="text-xs font-medium">Drop your CV here</p>
        <p className="text-[11px] text-[rgb(var(--muted-fg))] text-center mt-0.5 px-4">PDF, DOCX · up to 10MB · AI-reviewed in 30s</p>
        <span className="mt-3 px-3 py-1.5 rounded-lg bg-[rgb(var(--muted))] text-xs font-medium group-hover:bg-[rgb(var(--primary)/0.1)] group-hover:text-[rgb(var(--primary))] transition-colors">
          Browse files
        </span>
      </Link>
    </div>
  );
}

function LibraryWidget({ notes, loading, activeTab, setActiveTab }: {
  notes: Note[]; loading: boolean; activeTab: number; setActiveTab: (i: number) => void;
}) {
  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">The Library</span>
          <span className="text-xs text-[rgb(var(--muted-fg))]">
            {activeTab === 1 ? "Trending Notes" : NOTE_CATS[activeTab]}
          </span>
        </div>
        <Link href="/notes/upload"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--muted))] text-xs font-medium hover:bg-[rgb(var(--primary)/0.1)] hover:text-[rgb(var(--primary))] transition-colors">
          <Upload className="w-3 h-3" /> Upload Notes
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
        {NOTE_CATS.map((c, i) => (
          <button key={c} onClick={() => setActiveTab(i)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
              activeTab === i
                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]")}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-8 h-8 text-[rgb(var(--muted-fg))] mx-auto mb-2" />
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            {NOTE_SUBJECTS[activeTab]
              ? `No ${NOTE_CATS[activeTab]} notes yet`
              : "No notes yet — be the first to upload!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.slice(0, 4).map(note => (
            <Link key={note.id} href={`/notes/${note.id}`}
              className="p-3 rounded-xl border border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.35)] hover:bg-[rgb(var(--primary)/0.03)] transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[rgb(var(--primary))]" />
                </div>
                <span className="text-[10px] text-[rgb(var(--muted-fg))] truncate">{note.subject}</span>
              </div>
              <p className="text-xs font-medium leading-tight group-hover:text-[rgb(var(--primary))] transition-colors line-clamp-2 mb-2">
                {note.title}
              </p>
              <div className="flex items-center gap-2.5 text-[11px] text-[rgb(var(--muted-fg))]">
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{note.downloads}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{note.upvotes}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarWidget({ userId }: { userId: string | null }) {
  const supabase = createClient();
  const [events, setEvents] = useState<CalEvent[]>([]);

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    (supabase as any)
      .from("calendar_events")
      .select("id, title, date, start_time, end_time, color")
      .eq("user_id", userId)
      .gte("date", today)
      .lte("date", nextWeek)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5)
      .then(({ data }: { data: CalEvent[] | null }) => setEvents(data ?? []));
  }, [userId]);

  const labelFor = (dateStr: string) => {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const d = new Date(dateStr + "T00:00:00");
    if (d.getTime() === today.getTime())    return "TODAY";
    if (d.getTime() === tomorrow.getTime()) return "TOMORROW";
    return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm">This Week</p>
        <Link href="/calendar" className="text-xs text-[rgb(var(--primary))] hover:underline flex items-center gap-0.5">
          Full calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2 text-[rgb(var(--muted-fg))]">
          <Clock className="w-6 h-6 opacity-30" />
          <p className="text-xs">No upcoming events</p>
          <Link href="/calendar" className="text-xs text-[rgb(var(--primary))] hover:underline">Add events →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map(ev => (
            <div key={ev.id} className="flex gap-3">
              <div className="w-0.5 rounded-full self-stretch flex-shrink-0" style={{ backgroundColor: ev.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))]">
                    {labelFor(ev.date)}
                  </span>
                  {ev.start_time && (
                    <span className="text-[10px] text-[rgb(var(--muted-fg))]">— {ev.start_time}</span>
                  )}
                </div>
                <p className="text-xs font-medium leading-tight truncate">{ev.title}</p>
                {ev.end_time && (
                  <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">Until {ev.end_time}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UniAIWidget({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 right-6 z-50 w-72 theme-card p-0 overflow-hidden shadow-2xl"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[rgb(var(--primary)/0.12)] to-transparent border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">UniAI</p>
            <p className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Your AI Tutor · Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors" aria-label="Close">
          <X className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-[rgb(var(--fg))] leading-relaxed">
          Hi! I&apos;m here to help with your studies, career prep, and more. Ask me anything!
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {["Summarise today's lecture", "Help me find study notes", "Draft a cover letter"].map(action => (
            <Link key={action} href="/ai"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--muted))] text-xs font-medium hover:bg-[rgb(var(--primary)/0.1)] hover:text-[rgb(var(--primary))] transition-colors">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-[rgb(var(--primary))]" />
              {action}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { userId, universityId, loaded } = useCurrentUser();

  const [notes, setNotes]             = useState<Note[]>([]);
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [globalMsgs, setGlobalMsgs]   = useState<ChatMsg[]>([]);
  const [uniMsgs, setUniMsgs]         = useState<ChatMsg[]>([]);
  const [privateMsgs, setPrivateMsgs] = useState<ChatMsg[]>([]);
  const [jobsLoading, setJobsLoading]   = useState(true);
  const [chatLoading, setChatLoading]   = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [chatTab, setChatTab] = useState(0);
  const [noteTab, setNoteTab] = useState(1);
  const [showAI, setShowAI]   = useState(true);
  const { daysLeft, setSemesterEnd } = useAcademic(userId);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [gpa, setGpa]                   = useState<number | null>(null);
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [applications, setApplications] = useState(0);
  const [subjectsToReview, setSubjectsToReview] = useState(0);

  // Real-time stats
  useEffect(() => {
    if (!loaded || !userId) return;
    const supabase = createClient();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    Promise.all([
      supabase.from("profiles").select("cgpa").eq("id", userId).single(),
      supabase.from("study_logs").select("duration_minutes").eq("user_id", userId).gte("timestamp", weekAgo.toISOString()),
      supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("applicant_id", userId),
    ]).then(([profileRes, logsRes, appsRes]) => {
      if (profileRes.data?.cgpa) setGpa(Number(profileRes.data.cgpa));
      const rows = (logsRes.data as { duration_minutes: number }[] | null) ?? [];
      const mins = rows.reduce((s, r) => s + r.duration_minutes, 0);
      setHoursThisWeek(Math.round((mins / 60) * 10) / 10);
      setApplications(appsRes.count ?? 0);
    });

    const studyLogSub = supabase
      .channel(`feed-study-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_logs", filter: `user_id=eq.${userId}` }, (payload) => {
        const mins = (payload.new as { duration_minutes: number }).duration_minutes;
        setHoursThisWeek(prev => Math.round((prev + mins / 60) * 10) / 10);
      })
      .subscribe();
    return () => { supabase.removeChannel(studyLogSub); };
  }, [loaded, userId]);

  // Jobs — fetched once
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, company_name, type, city, is_remote")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      setJobs((data as Job[]) ?? []);
      setJobsLoading(false);
    })();
  }, []);

  // Chat — fetch all three channel types once user is loaded
  useEffect(() => {
    if (!loaded || !userId) return;
    const supabase = createClient();

    const fetchMsgs = async (channelId: string): Promise<ChatMsg[]> => {
      const { data } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url)")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data as unknown as ChatMsg[] ?? []).reverse();
    };

    (async () => {
      // 1. Global channel
      const { data: globalChan } = await supabase
        .from("channels").select("id").eq("type", "global").single();
      if (globalChan) {
        fetchMsgs(globalChan.id).then(setGlobalMsgs);
      }

      // 2. University channel
      if (universityId) {
        const { data: uniChan } = await supabase
          .from("channels").select("id")
          .eq("type", "university")
          .eq("university_id", universityId)
          .single();
        if (uniChan) {
          fetchMsgs(uniChan.id).then(setUniMsgs);
        }
      }

      // 3. Private / DM channels
      const { data: dmChans } = await supabase
        .from("channels").select("id")
        .eq("type", "dm")
        .or(`dm_user_a.eq.${userId},dm_user_b.eq.${userId}`)
        .limit(10);
      if (dmChans && dmChans.length > 0) {
        const ids = dmChans.map(d => d.id);
        const { data: dmMsgs } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url)")
          .in("channel_id", ids)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(5);
        if (dmMsgs) setPrivateMsgs((dmMsgs as unknown as ChatMsg[]).reverse());
      }

      setChatLoading(false);
    })();
  }, [loaded, userId, universityId]);

  // Subjects needing review (mastery < 80%)
  useEffect(() => {
    if (!loaded || !userId) return;
    const supabase = createClient();
    supabase.from("user_subjects").select("id, current_grade").eq("user_id", userId)
      .then(({ data }) => {
        const count = (data ?? []).filter(
          (s: { current_grade: number | null }) => s.current_grade === null || s.current_grade < 80
        ).length;
        setSubjectsToReview(count);
      });
  }, [loaded, userId]);

  // Notes — re-fetch whenever the category tab changes
  useEffect(() => {
    const supabase = createClient();
    setNotesLoading(true);
    (async () => {
      const subject = NOTE_SUBJECTS[noteTab];
      let q = supabase
        .from("notes")
        .select("id, title, subject, downloads, upvotes")
        .eq("status", "published");

      if (subject) {
        q = q.ilike("subject", `%${subject}%`);
      }

      q = noteTab === 0
        ? q.order("created_at", { ascending: false })  // All  → newest first
        : q.order("downloads", { ascending: false });   // Trending / subject → most downloaded

      const { data } = await q.limit(4);
      setNotes((data as Note[]) ?? []);
      setNotesLoading(false);
    })();
  }, [noteTab]);

  return (
    <div className="relative space-y-4">
      <LiveNowTicker />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Row 1: Hero + Stats */}
        <div className="lg:col-span-2"><HeroBanner daysLeft={daysLeft} showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker} dateInput={dateInput} setDateInput={setDateInput} onSetDate={setSemesterEnd} subjectsToReview={subjectsToReview} /></div>
        <div className="flex flex-col gap-4">
          <StatCard label="GPA This Term"  value={gpa !== null ? gpa.toFixed(2) : "—"} sub={gpa !== null ? "weighted average" : "add grades to calculate"} icon={TrendingUp} color="#6366f1" />
          <StatCard label="Hours Studied"  value={`${hoursThisWeek}h`} sub="this week" icon={Clock} color="#10b981" />
          <StatCard label="Applications"   value={String(applications)} sub={applications === 0 ? "none submitted yet" : `${applications} submitted`} icon={Briefcase} color="#f97316" />
        </div>

        {/* Row 2: Comm Hub + Jobs / CV */}
        <div className="lg:col-span-2">
          <CommHub
            globalMsgs={globalMsgs} uniMsgs={uniMsgs} privateMsgs={privateMsgs}
            loading={chatLoading} activeTab={chatTab} setActiveTab={setChatTab}
          />
        </div>
        <div className="flex flex-col gap-4">
          <JobPortal jobs={jobs} loading={jobsLoading} />
          <CVWidget />
        </div>

        {/* Row 3: Library + Calendar */}
        <div className="lg:col-span-2">
          <LibraryWidget notes={notes} loading={notesLoading} activeTab={noteTab} setActiveTab={setNoteTab} />
        </div>
        <div><CalendarWidget userId={userId} /></div>
      </motion.div>

      <AnimatePresence>
        {showAI && <UniAIWidget onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
}
