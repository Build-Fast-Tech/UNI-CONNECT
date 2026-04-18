import { BookOpen, MessageSquare, Briefcase, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

const QUICK_ACTIONS = [
  { icon: BookOpen,    label: "Browse Notes",       href: "/notes",   color: "#6366F1" },
  { icon: MessageSquare, label: "Join Chat",         href: "/chat/global", color: "#10B981" },
  { icon: Briefcase,   label: "Find Jobs",          href: "/jobs",    color: "#F97316" },
  { icon: Zap,         label: "Ask AI",             href: "/ai",      color: "#8B5CF6" },
];

const RECENT_NOTES = [
  { title: "Data Structures Complete Notes", subject: "CS201", uni: "NUST", downloads: 432 },
  { title: "Calculus II — All Lectures",     subject: "MATH202", uni: "LUMS", downloads: 298 },
  { title: "Digital Logic Design Notes",     subject: "EE201",  uni: "FAST", downloads: 187 },
];

const FEATURED_JOBS = [
  { title: "Software Engineer Intern",  company: "Systems Ltd",    type: "Internship", city: "Karachi" },
  { title: "Backend Developer",         company: "Arbisoft",       type: "Full-time",  city: "Lahore" },
];

export default function FeedPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Good afternoon 👋</h1>
        <p className="text-[rgb(var(--muted-fg))]">Here&apos;s what&apos;s happening across Pakistani campuses.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="theme-card p-4 flex flex-col items-center gap-3 hover:scale-[1.02] hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 text-center"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.color + "22" }}>
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-[rgb(var(--fg))]">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[rgb(var(--primary))]" />
            Trending Notes
          </h2>
          <Link href="/notes" className="text-sm text-[rgb(var(--primary))] hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {RECENT_NOTES.map((note) => (
            <div
              key={note.title}
              className="theme-card p-4 flex items-center gap-4 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[rgb(var(--primary))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{note.title}</p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {note.subject} · {note.uni} · {note.downloads} downloads
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[rgb(var(--primary))]" />
            Featured Jobs
          </h2>
          <Link href="/jobs" className="text-sm text-[rgb(var(--primary))] hover:underline">View all</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURED_JOBS.map((job) => (
            <div
              key={job.title}
              className="theme-card p-4 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{job.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] flex-shrink-0">
                  {job.type}
                </span>
              </div>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{job.company} · {job.city}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
