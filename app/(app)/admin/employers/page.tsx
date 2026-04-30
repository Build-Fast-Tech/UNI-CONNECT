"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Building2, ExternalLink, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  company_url: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_id: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_ICONS = {
  pending:  <Clock className="w-3.5 h-3.5" />,
  approved: <CheckCircle className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
};

export default function AdminEmployersPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      const { data } = await (supabase as any)
        .from("employer_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setApps(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAction = async (appId: string, action: "approve" | "reject") => {
    const reason = rejectReasons[appId];
    if (action === "reject" && !reason?.trim()) return;

    setActing(appId);
    const res = await fetch("/api/employer/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId, action, reason }),
    });

    if (res.ok) {
      setApps(prev =>
        prev.map(a =>
          a.id === appId
            ? { ...a, status: action === "approve" ? "approved" : "rejected", reviewed_at: new Date().toISOString() }
            : a
        )
      );
      setShowRejectInput(p => ({ ...p, [appId]: false }));
    }
    setActing(null);
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);
  const counts = {
    all: apps.length,
    pending: apps.filter(a => a.status === "pending").length,
    approved: apps.filter(a => a.status === "approved").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="theme-card p-5 h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[rgb(var(--muted-fg))]">
        <XCircle className="w-10 h-10 mb-3 opacity-40" />
        <p className="font-medium">Access Denied</p>
        <p className="text-sm">This page is only accessible to admins.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Employer Applications</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">{counts.pending} pending review</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
              filter === f
                ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
                : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted)/0.7)]"
            )}
          >
            {f} <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="theme-card p-10 text-center text-[rgb(var(--muted-fg))]">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No {filter === "all" ? "" : filter} applications.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(app => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="theme-card p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{app.company_name}</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                    STATUS_STYLES[app.status]
                  )}>
                    {STATUS_ICONS[app.status]}
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-fg))]">
                  <span>{app.full_name}</span>
                  <span>·</span>
                  <a
                    href={`mailto:${app.email}`}
                    className="inline-flex items-center gap-1 hover:text-[rgb(var(--fg))] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {app.email}
                  </a>
                  {app.company_url && (
                    <>
                      <span>·</span>
                      <a
                        href={app.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[rgb(var(--fg))] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Website
                      </a>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-[rgb(var(--muted-fg))] whitespace-nowrap">
                {new Date(app.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {app.description && (
              <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed border-t border-[rgb(var(--border))] pt-3">
                {app.description}
              </p>
            )}

            {app.user_id && (
              <p className="text-xs text-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)] px-3 py-1.5 rounded-lg">
                This applicant has a UniConnect account — approving will instantly grant employer access.
              </p>
            )}

            {app.status === "rejected" && app.rejection_reason && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                <strong>Rejection Reason:</strong> {app.rejection_reason}
              </p>
            )}

            {app.status === "pending" && (
              <div className="space-y-3">
                <div className="flex gap-2 pt-1 border-t border-[rgb(var(--border))] pt-3">
                  <button
                    onClick={() => handleAction(app.id, "approve")}
                    disabled={acting === app.id}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      "bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20",
                      acting === app.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {acting === app.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => setShowRejectInput(p => ({ ...p, [app.id]: !p[app.id] }))}
                    disabled={acting === app.id}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
                      acting === app.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>

                {showRejectInput[app.id] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="flex gap-2">
                    <input
                      value={rejectReasons[app.id] ?? ""}
                      onChange={e => setRejectReasons(p => ({ ...p, [app.id]: e.target.value }))}
                      placeholder="Reason for rejection…"
                      className="flex-1 bg-[rgb(var(--muted))] border border-red-500/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
                    />
                    <button
                      onClick={() => handleAction(app.id, "reject")}
                      disabled={!rejectReasons[app.id]?.trim() || acting === app.id}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Confirm
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
