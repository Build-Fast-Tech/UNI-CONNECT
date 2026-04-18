"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Briefcase, MapPin, Calendar, Plus,
  Clock, Building2, ExternalLink, Zap,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const TYPE_LABELS: Record<Job["type"], string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  remote: "Remote",
};

const TYPE_COLORS: Record<Job["type"], string> = {
  internship: "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]",
  full_time:  "bg-emerald-500/10 text-emerald-500",
  part_time:  "bg-amber-500/10 text-amber-500",
  contract:   "bg-violet-500/10 text-violet-500",
  remote:     "bg-sky-500/10 text-sky-500",
};

const FILTERS: Array<{ value: Job["type"] | "all" }> = [
  { value: "all" },
  { value: "internship" },
  { value: "full_time" },
  { value: "part_time" },
  { value: "contract" },
  { value: "remote" },
];

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Closed";
  if (diff === 0) return "Last day";
  return `${diff}d left`;
}

export default function JobsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Job["type"] | "all">("all");

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchType = filter === "all" || j.type === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company_name.toLowerCase().includes(q) ||
        (j.city ?? "").toLowerCase().includes(q) ||
        j.required_skills.some(s => s.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [jobs, filter, search]);

  const featured = filtered.filter(j => j.is_featured);
  const rest = filtered.filter(j => !j.is_featured);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Jobs</h1>
          <p className="text-[rgb(var(--muted-fg))]">
            {loading ? "Loading…" : `${jobs.length} active opening${jobs.length !== 1 ? "s" : ""} for Pakistani students`}
          </p>
        </div>
        <Link
          href="/jobs/post"
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0",
            "bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity active:scale-95"
          )}
        >
          <Plus className="w-4 h-4" /> Post a Job
        </Link>
      </motion.div>

      {/* Search + filter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, companies, skills…"
            className={cn(
              "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
              "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
            )}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 h-11 rounded-xl text-sm font-medium flex-shrink-0 capitalize transition-all duration-200",
                filter === f.value
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted)/0.7)]"
              )}
            >
              {f.value === "all" ? "All" : TYPE_LABELS[f.value as Job["type"]]}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="theme-card p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--muted))]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/2" />
                  <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/3" />
                  <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="font-semibold mb-1">No jobs found</p>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            {search ? `No results for "${search}"` : "Check back soon — new jobs are posted regularly."}
          </p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))] mb-3">
                Featured
              </h2>
              <div className="space-y-3">
                {featured.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} featured />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))] mb-3">
                  All Jobs
                </h2>
              )}
              <div className="space-y-3">
                {rest.map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job, index, featured = false }: { job: Job; index: number; featured?: boolean }) {
  const dl = daysLeft(job.deadline);
  const dlColor =
    dl === "Closed" ? "text-red-500" :
    dl === "Last day" ? "text-amber-500" :
    "text-[rgb(var(--muted-fg))]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/jobs/${job.id}`}
        className={cn(
          "theme-card p-5 flex gap-4 group",
          "hover:border-[rgb(var(--primary)/0.3)] hover:shadow-md transition-all duration-200",
          featured && "border-[rgb(var(--accent)/0.3)]"
        )}
      >
        {/* Company initials */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {job.company_name.slice(0, 2).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-[rgb(var(--primary))] transition-colors truncate">
                {job.title}
              </h3>
              <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                {job.company_name}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {featured && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] font-medium">
                  Featured
                </span>
              )}
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_COLORS[job.type])}>
                {TYPE_LABELS[job.type]}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgb(var(--muted-fg))]">
            {(job.city || job.is_remote) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.is_remote ? "Remote" : job.city}
              </span>
            )}
            {job.salary_min && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {job.salary_min.toLocaleString()}
                {job.salary_max ? `–${job.salary_max.toLocaleString()}` : "+"} {job.currency}/mo
              </span>
            )}
            {dl && (
              <span className={cn("flex items-center gap-1", dlColor)}>
                <Clock className="w-3 h-3" />
                {dl}
              </span>
            )}
          </div>

          {job.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.required_skills.slice(0, 4).map(skill => (
                <span
                  key={skill}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                  +{job.required_skills.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        <ExternalLink className="w-4 h-4 text-[rgb(var(--muted-fg))] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      </Link>
    </motion.div>
  );
}
