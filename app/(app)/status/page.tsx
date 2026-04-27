"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle, XCircle, Building2, Briefcase,
  MessageSquare, ChevronRight, AlertCircle, RefreshCw, Inbox
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "solved";

interface Submission {
  id: string;
  type: "society" | "employer" | "feedback";
  title: string;
  status: Status;
  date: string;
  rejection_reason?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:  { label: "Pending",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20",     icon: Clock },
  approved: { label: "Approved", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  solved:   { label: "Solved",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20",             icon: XCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  society:  { label: "Society Registration", icon: Building2,     color: "text-blue-400 bg-blue-400/10" },
  employer: { label: "Employer Access",      icon: Briefcase,     color: "text-indigo-400 bg-indigo-400/10" },
  feedback: { label: "Feedback/Bug",         icon: MessageSquare, color: "text-pink-400 bg-pink-400/10" },
};

export default function StatusTrackingPage() {
  const { userId, loaded } = useCurrentUser();
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const [socRes, empRes, feedRes] = await Promise.all([
        supabase.from("societies").select("id, name, status, rejection_note, created_at").eq("admin_id", userId),
        supabase.from("employer_applications").select("id, company_name, status, rejection_reason, created_at").eq("user_id", userId),
        supabase.from("suggestions").select("id, message, status, rejection_reason, created_at").eq("user_id", userId),
      ]);

      const all: Submission[] = [];

      socRes.data?.forEach(s => all.push({
        id: s.id, type: "society", title: s.name, status: s.status as Status,
        date: s.created_at, rejection_reason: s.rejection_note
      }));

      empRes.data?.forEach(e => all.push({
        id: e.id, type: "employer", title: e.company_name, status: e.status as Status,
        date: e.created_at, rejection_reason: e.rejection_reason
      }));

      feedRes.data?.forEach(f => all.push({
        id: f.id, type: "feedback", title: f.message.slice(0, 40) + (f.message.length > 40 ? "..." : ""),
        status: f.status as Status, date: f.created_at, rejection_reason: f.rejection_reason
      }));

      setSubmissions(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loaded && userId) fetchSubmissions();
  }, [loaded, userId]);

  if (!loaded) return null;

  if (!userId) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in required</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">You need to be logged in to track your submissions.</p>
        <Link href="/login" className="px-6 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-white font-semibold text-sm hover:opacity-90">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Status Tracking</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Monitor your applications and feedback requests</p>
        </div>
        <button onClick={fetchSubmissions} disabled={loading}
          className="p-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors">
          <RefreshCw className={cn("w-4 h-4 text-[rgb(var(--muted-fg))]", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="theme-card p-5 h-24 animate-pulse" />)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="theme-card p-12 text-center text-[rgb(var(--muted-fg))]">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-lg text-[rgb(var(--fg))]">No submissions found</p>
          <p className="text-sm mt-1">You haven&apos;t submitted any society applications, employer requests, or feedback yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub, i) => {
            const type = TYPE_CONFIG[sub.type];
            const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
            const Icon = type.icon;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="theme-card p-5 group hover:border-[rgb(var(--primary)/0.3)] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", type.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))]">
                        {type.label}
                      </span>
                      <span className="text-[11px] text-[rgb(var(--muted-fg))]">
                        {new Date(sub.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-bold text-[rgb(var(--fg))] truncate mb-2">{sub.title}</h3>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border",
                        status.color
                      )}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                      
                      {sub.status === "rejected" && sub.rejection_reason && (
                        <div className="flex-1 min-w-0">
                           <p className="text-xs text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg border border-red-500/10 truncate">
                             <strong>Reason:</strong> {sub.rejection_reason}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Helper */}
      <div className="p-5 rounded-2xl bg-[rgb(var(--primary)/0.05)] border border-[rgb(var(--primary)/0.1)] flex gap-4">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div className="text-xs text-[rgb(var(--muted-fg))] leading-relaxed">
          <p className="font-bold text-[rgb(var(--fg))] mb-1">Need help with an application?</p>
          If your application has been pending for more than 48 hours, feel free to submit a feedback report under the &quot;Other&quot; category.
        </div>
      </div>
    </div>
  );
}
