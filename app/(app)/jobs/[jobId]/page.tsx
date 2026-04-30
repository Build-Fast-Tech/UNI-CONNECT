"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Clock, Building2, Calendar,
  Send, ExternalLink, Briefcase, Users, Zap,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Job = Database["public"]["Tables"]["jobs"]["Row"];

const TYPE_LABELS: Record<Job["type"], string> = {
  internship: "Internship",
  full_time:  "Full-time",
  part_time:  "Part-time",
  contract:   "Contract",
  remote:     "Remote",
};

const TYPE_COLORS: Record<Job["type"], string> = {
  internship: "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]",
  full_time:  "bg-emerald-500/10 text-emerald-500",
  part_time:  "bg-amber-500/10 text-amber-500",
  contract:   "bg-violet-500/10 text-violet-500",
  remote:     "bg-sky-500/10 text-sky-500",
};

function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Deadline passed", color: "text-red-500" };
  if (diff === 0) return { label: "Closes today", color: "text-amber-500" };
  return { label: `${diff} days left`, color: "text-[rgb(var(--muted-fg))]" };
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const supabase = createClient();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      setJob(data);

      if (data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: existing } = await supabase
            .from("job_applications")
            .select("id")
            .eq("job_id", jobId)
            .eq("applicant_id", user.id)
            .single();
          if (existing) setApplied(true);
        }
      }
      setLoading(false);
    })();
  }, [jobId]);

  const handleApply = async () => {
    if (!job || applied || applying) return;
    if (job.apply_method === "url" && job.apply_value) {
      window.open(job.apply_value, "_blank");
      return;
    }
    if (job.apply_method === "email" && job.apply_value) {
      window.open(`mailto:${job.apply_value}?subject=Application for ${job.title}`, "_blank");
      return;
    }
    setApplying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setApplying(false); return; }
    await supabase.from("job_applications").insert({
      job_id: job.id,
      applicant_id: user.id,
    });
    setApplied(true);
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-[rgb(var(--muted))] rounded" />
        <div className="theme-card p-6 space-y-4">
          <div className="h-7 bg-[rgb(var(--muted))] rounded w-2/3" />
          <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/3" />
          <div className="h-32 bg-[rgb(var(--muted))] rounded" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="theme-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="text-[rgb(var(--muted-fg))]">Job not found.</p>
          <Link href="/jobs" className="mt-4 inline-flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const dl = daysLeft(job.deadline);
  const isClosed = job.status !== "active" || (dl?.label === "Deadline passed");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All jobs
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="theme-card p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">{job.company_name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">{job.title}</h1>
            <p className="text-[rgb(var(--primary))] font-medium flex items-center gap-1.5 mt-1">
              <Building2 className="w-4 h-4" /> {job.company_name}
            </p>
          </div>
          {job.is_featured && (
            <span className="text-xs px-2 py-1 rounded-full bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] font-medium flex-shrink-0">
              Featured
            </span>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", TYPE_COLORS[job.type])}>
            {TYPE_LABELS[job.type]}
          </span>
          {(job.city || job.is_remote) && (
            <span className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.is_remote ? "Remote" : job.city}
            </span>
          )}
          {job.salary_min && (
            <span className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] flex items-center gap-1">
              <Zap className="w-3 h-3" />
              PKR {job.salary_min.toLocaleString()}
              {job.salary_max ? `–${job.salary_max.toLocaleString()}` : "+"}/mo
            </span>
          )}
          {job.deadline && dl && (
            <span className={cn("text-xs px-3 py-1 rounded-full bg-[rgb(var(--muted))] flex items-center gap-1", dl.color)}>
              <Clock className="w-3 h-3" />
              {dl.label}
            </span>
          )}
          {job.deadline && (
            <span className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Deadline: {new Date(job.deadline).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {job.experience_required && (
            <span className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] flex items-center gap-1">
              <Users className="w-3 h-3" />
              {job.experience_required}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.required_skills.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map(skill => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--primary))] font-medium border border-[rgb(var(--primary)/0.15)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div>
            <h3 className="text-sm font-semibold mb-3">About the Role</h3>
            <div className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>
        )}

        {/* Apply */}
        <div className="pt-2 border-t border-[rgb(var(--border))]">
          <button
            onClick={handleApply}
            disabled={isClosed || applying}
            className={cn(
              "w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              isClosed
                ? "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
                : applied
                ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 active:scale-95"
            )}
          >
            {isClosed ? (
              <>Job Closed</>
            ) : applied ? (
              <>Applied ✓</>
            ) : job.apply_method === "url" ? (
              <><ExternalLink className="w-4 h-4" /> Apply on Website</>
            ) : job.apply_method === "email" ? (
              <><Send className="w-4 h-4" /> Apply via Email</>
            ) : (
              <><Send className="w-4 h-4" /> Apply Now</>
            )}
          </button>
          {!isClosed && !applied && (
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-2">
              {job.apply_method === "platform"
                ? "Your profile will be submitted to the employer."
                : "You will be redirected to complete your application."}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
