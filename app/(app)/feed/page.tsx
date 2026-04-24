"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Briefcase, TrendingUp, Upload, ArrowRight,
  Star, Bot, X, Sparkles, Send,
  Download, Clock, FileText, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
interface Note { id: string; title: string; subject: string; downloads: number; upvotes: number; }
interface Job  { id: string; title: string; company_name: string; type: string; city: string | null; is_remote: boolean; }

const MOCK_CHATS = [
  { id: 1, name: "Study Group — CS 401", tag: "Pinned", time: "now",  msg: "Finalised the exam review doc. Check #library for the PDF.", initials: "SG", color: "#6366f1", likes: 4 },
  { id: 2, name: "Prof. Nakamura",        tag: "",      time: "1h",   msg: "Office hours moved to Thursday 3 PM this week.",            initials: "PN", color: "#10b981", likes: 0 },
  { id: 3, name: "Sarah Kim",             tag: "",      time: "32m",  msg: "Anyone want to grab coffee before the 2pm lecture?",       initials: "SK", color: "#f97316", likes: 2 },
];

const MOCK_EVENTS = [
  { id: 1, day: "TODAY",    time: "2:00 PM", title: "CS 401 – Distributed Systems",   location: "Building 21, Rm 104",   color: "#6366f1" },
  { id: 2, day: "TOMORROW", time: "11 AM",   title: "Study Group – Linear Algebra",   location: "Library 21, Level 4th", color: "#10b981" },
  { id: 3, day: "THU",      time: "3:00 PM", title: "Career Fair — Tech Track",        location: "Student Center",        color: "#f97316" },
];

const CHAT_TABS  = ["Global", "University", "Private"];
const NOTE_CATS  = ["All", "Trending", "Computer Science", "Mathematics", "Business", "Chemistry", "Physics"];
const SEMESTER_DAYS = 21;

// ─── Widgets ──────────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between min-h-[186px]"
      style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 35%, #4f46e5 65%, #818cf8 100%)" }}
    >
      <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute right-20 bottom-0 w-36 h-36 rounded-full bg-white/5 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
          <span className="text-white/90 text-xs font-medium tracking-wide uppercase">Week 14 · Finals Season</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 leading-snug">
          Your semester ends in{" "}
          <span className="underline decoration-yellow-300/70 decoration-2">{SEMESTER_DAYS} days.</span>
          <br />Let&apos;s make it count.
        </h1>

        <p className="text-white/70 text-sm mb-4 max-w-sm">
          UniAI is ready to help you review 4 subjects, 12 study groups are active on campus, and 3 new internships just dropped in your field.
        </p>

        <div className="flex items-center gap-3">
          <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-white/90 transition-colors shadow-md">
            Start Study Sprint <ArrowRight className="w-4 h-4" />
          </Link>
          <button className="px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors">
            View roadmap
          </button>
        </div>
      </div>

      <div className="absolute right-5 bottom-5 flex items-center gap-2 z-10">
        <div className="flex -space-x-1.5">
          {["#ef4444", "#10b981", "#f59e0b"].map((c, i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-indigo-500/60" style={{ backgroundColor: c }} />
          ))}
        </div>
        <span className="text-white/70 text-xs">+294 studying now</span>
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

function CommHub({ activeTab, setActiveTab }: { activeTab: number; setActiveTab: (i: number) => void }) {
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
            className={cn("flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              activeTab === i ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]")}>
            {t}
            {i === 1 && <span className="text-[10px] opacity-60">411</span>}
            {i === 2 && <span className="text-[10px] opacity-60">4</span>}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE
        </span>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {MOCK_CHATS.map(chat => (
          <div key={chat.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: chat.color }}>
              {chat.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium">{chat.name}</span>
                {chat.tag && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium">
                    {chat.tag}
                  </span>
                )}
                <span className="text-xs text-[rgb(var(--muted-fg))] ml-auto">{chat.time}</span>
              </div>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{chat.msg}</p>
              {chat.likes > 0 && <p className="mt-1 text-[11px] text-[rgb(var(--muted-fg))]">❤️ {chat.likes}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[rgb(var(--border))]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--muted))]">
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgb(var(--muted-fg))]" placeholder="Message #university..." />
          <button className="p-1.5 rounded-lg bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
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
          42 matches <ChevronRight className="w-3 h-3" />
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
          <span className="text-xs text-[rgb(var(--muted-fg))]">Trending Notes</span>
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
              activeTab === i ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))]")}>
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
          <p className="text-xs text-[rgb(var(--muted-fg))]">No notes yet — be the first to upload!</p>
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

function CalendarWidget() {
  return (
    <div className="theme-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-sm">This Week</p>
        <Link href="/universities" className="text-xs text-[rgb(var(--primary))] hover:underline flex items-center gap-0.5">
          Full calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {MOCK_EVENTS.map(ev => (
          <div key={ev.id} className="flex gap-3">
            <div className="w-0.5 rounded-full self-stretch flex-shrink-0" style={{ backgroundColor: ev.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))]">{ev.day}</span>
                <span className="text-[10px] text-[rgb(var(--muted-fg))]">— {ev.time}</span>
              </div>
              <p className="text-xs font-medium leading-tight">{ev.title}</p>
              <p className="text-[11px] text-[rgb(var(--muted-fg))] mt-0.5">{ev.location}</p>
            </div>
          </div>
        ))}
      </div>
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
          Hi! I noticed you have a Linear Algebra exam in 3 days. Want me to build a study plan from the top cheat sheets?
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {["Summarise today's lecture", "Quiz me on eigenvalues", "Draft cover letter for Stripe"].map(action => (
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [chatTab, setChatTab]   = useState(1);
  const [noteTab, setNoteTab]   = useState(1);
  const [showAI, setShowAI]     = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: nd }, { data: jd }] = await Promise.all([
        supabase.from("notes").select("id, title, subject, downloads, upvotes").eq("status", "published").order("downloads", { ascending: false }).limit(4),
        supabase.from("jobs").select("id, title, company_name, type, city, is_remote").eq("status", "active").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      ]);
      setNotes((nd as Note[]) ?? []);
      setJobs((jd as Job[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Row 1: Hero + Stats */}
        <div className="lg:col-span-2">
          <HeroBanner />
        </div>
        <div className="flex flex-col gap-4">
          <StatCard label="GPA This Term"   value="3.84" sub="+0.12 this semester" icon={TrendingUp} color="#6366f1" />
          <StatCard label="Hours Studied"   value="47h"  sub="this week"           icon={Clock}      color="#10b981" />
          <StatCard label="Applications"    value="8"    sub="3 pending review"    icon={Briefcase}  color="#f97316" />
        </div>

        {/* Row 2: Comm Hub + Jobs / CV */}
        <div className="lg:col-span-2">
          <CommHub activeTab={chatTab} setActiveTab={setChatTab} />
        </div>
        <div className="flex flex-col gap-4">
          <JobPortal jobs={jobs} loading={loading} />
          <CVWidget />
        </div>

        {/* Row 3: Library + Calendar */}
        <div className="lg:col-span-2">
          <LibraryWidget notes={notes} loading={loading} activeTab={noteTab} setActiveTab={setNoteTab} />
        </div>
        <div>
          <CalendarWidget />
        </div>
      </motion.div>

      {/* Floating UniAI widget */}
      <AnimatePresence>
        {showAI && <UniAIWidget onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
}
