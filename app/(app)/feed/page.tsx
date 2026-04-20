"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, MessageSquare, Briefcase, Zap,
  TrendingUp, Download, ArrowRight, GraduationCap, Bot,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface TrendingNote {
  id: string;
  title: string;
  subject: string;
  downloads: number;
  upvotes: number;
  university?: { short_name: string } | null;
}

interface FeaturedJob {
  id: string;
  title: string;
  company_name: string;
  type: string;
  city: string | null;
  is_remote: boolean;
}

const QUICK_ACTIONS = [
  { icon: BookOpen,    label: "Browse Notes",  href: "/notes",  color: "#6366F1" },
  { icon: MessageSquare, label: "Join Chat",   href: "/chat",   color: "#10B981" },
  { icon: Briefcase,   label: "Find Jobs",     href: "/jobs",   color: "#F97316" },
  { icon: Bot,         label: "Ask AI",        href: "/ai",     color: "#8B5CF6" },
];

const JOB_TYPE_LABELS: Record<string, string> = {
  internship: "Internship",
  full_time:  "Full-time",
  part_time:  "Part-time",
  contract:   "Contract",
  remote:     "Remote",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function FeedPage() {
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [uniShort, setUniShort] = useState("");
  const [notes, setNotes] = useState<TrendingNote[]>([]);
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: profile }, { data: notesData }, { data: jobsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, universities:universities!university_id(short_name)")
          .eq("id", user.id)
          .single(),
        supabase
          .from("notes")
          .select("id, title, subject, downloads, upvotes, university:universities!university_id(short_name)")
          .eq("status", "published")
          .order("downloads", { ascending: false })
          .limit(4),
        supabase
          .from("jobs")
          .select("id, title, company_name, type, city, is_remote")
          .eq("status", "active")
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      if (profile) {
        setUserName(profile.full_name.split(" ")[0]);
        setUniShort((profile.universities as any)?.short_name ?? "");
      }
      setNotes((notesData as TrendingNote[]) ?? []);
      setJobs((jobsData as FeaturedJob[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">
          {greeting()}{userName ? `, ${userName}` : ""} 👋
        </h1>
        <p className="text-[rgb(var(--muted-fg))]">
          {uniShort
            ? `Here's what's happening across Pakistani campuses — and at ${uniShort}.`
            : "Here's what's happening across Pakistani campuses."}
        </p>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="theme-card p-4 flex flex-col items-center gap-3 hover:scale-[1.02] hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 text-center group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: action.color + "22" }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-[rgb(var(--fg))]">{action.label}</span>
          </Link>
        ))}
      </motion.div>

      {/* Trending notes */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[rgb(var(--primary))]" />
            Trending Notes
          </h2>
          <Link href="/notes" className="flex items-center gap-1 text-sm text-[rgb(var(--primary))] hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="theme-card p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--muted))]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[rgb(var(--muted))] rounded w-1/2" />
                  <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="theme-card p-8 text-center">
            <BookOpen className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-2" />
            <p className="text-sm text-[rgb(var(--muted-fg))]">No notes yet — be the first to upload!</p>
            <Link href="/notes/upload" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[rgb(var(--primary))] hover:underline">
              Upload a note <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="theme-card p-4 flex items-center gap-4 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[rgb(var(--primary))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-[rgb(var(--primary))] transition-colors">
                    {note.title}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted-fg))]">
                    {note.subject}
                    {note.university && ` · ${(note.university as any).short_name}`}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">
                  <Download className="w-3.5 h-3.5" /> {note.downloads}
                </span>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      {/* Featured jobs */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[rgb(var(--primary))]" />
            Latest Jobs
          </h2>
          <Link href="/jobs" className="flex items-center gap-1 text-sm text-[rgb(var(--primary))] hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="theme-card p-4 animate-pulse space-y-2">
                <div className="h-4 bg-[rgb(var(--muted))] rounded w-2/3" />
                <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="theme-card p-8 text-center">
            <Briefcase className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-2" />
            <p className="text-sm text-[rgb(var(--muted-fg))]">No open jobs yet.</p>
            <Link href="/jobs/post" className="mt-3 inline-flex items-center gap-1.5 text-sm text-[rgb(var(--primary))] hover:underline">
              Post a job <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="theme-card p-4 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold truncate group-hover:text-[rgb(var(--primary))] transition-colors">
                    {job.title}
                  </p>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                    "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  )}>
                    {JOB_TYPE_LABELS[job.type] ?? job.type}
                  </span>
                </div>
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {job.company_name} · {job.is_remote ? "Remote" : (job.city ?? "Pakistan")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      {/* AI promo */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          href="/ai"
          className={cn(
            "theme-card p-5 flex items-center gap-4",
            "hover:border-[rgb(var(--primary)/0.4)] transition-all duration-200 group",
            "bg-gradient-to-r from-[rgb(var(--primary)/0.05)] to-transparent"
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm group-hover:text-[rgb(var(--primary))] transition-colors">
              Study with UniConnect AI
            </p>
            <p className="text-xs text-[rgb(var(--muted-fg))]">
              Powered by Claude — ask anything about your coursework, exams, or career.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-[rgb(var(--muted-fg))] group-hover:text-[rgb(var(--primary))] transition-colors flex-shrink-0" />
        </Link>
      </motion.div>
    </div>
  );
}
