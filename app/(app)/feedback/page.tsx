"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus, CheckCircle, Lightbulb, Bug,
  Megaphone, HelpCircle, Clock, XCircle, Inbox,
  RefreshCw, AlertCircle, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "suggestion", label: "Suggestion", icon: Lightbulb,  desc: "An idea to improve UniConnect" },
  { value: "bug",        label: "Bug Report", icon: Bug,        desc: "Something isn't working right" },
  { value: "feature",    label: "Feature",    icon: Megaphone,  desc: "A new feature you'd like to see" },
  { value: "other",      label: "Other",      icon: HelpCircle, desc: "Anything else on your mind" },
];

type FeedbackStatus = "pending" | "solved" | "rejected";

interface Submission {
  id: string;
  type: string;
  message: string;
  status: FeedbackStatus;
  rejection_reason: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "Pending",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20",     icon: Clock },
  solved:   { label: "Solved",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-400/10 border-red-400/20",             icon: XCircle },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  suggestion: Lightbulb,
  bug:        Bug,
  feature:    Megaphone,
  other:      HelpCircle,
};

export default function FeedbackPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"submit" | "mine">("submit");

  // Submit tab state
  const [type, setType]       = useState("suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  // My submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading]   = useState(false);

  const loadSubmissions = async () => {
    setSubLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubLoading(false); return; }
    const { data } = await (supabase as any)
      .from("suggestions")
      .select("id, type, message, status, rejection_reason, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSubmissions((data as Submission[]) ?? []);
    setSubLoading(false);
  };

  useEffect(() => {
    if (tab !== "mine") return;
    loadSubmissions();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`feedback-user-${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "suggestions",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setSubmissions(prev =>
            prev.map(s =>
              s.id === payload.new.id
                ? { ...s, ...(payload.new as Partial<Submission>) }
                : s
            )
          );
        })
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, [tab]);

  const handleSubmit = async () => {
    if (!message.trim()) { setError("Please write your message."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="theme-card p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-[rgb(var(--success))]" />
          </div>
          <h2 className="text-2xl font-bold">Thank you!</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
            Your feedback is saved and sent to the UniConnect team. We read every message.
          </p>
          <div className="flex gap-3 pt-2 justify-center">
            <Button variant="outline" size="md" onClick={() => { setDone(false); setMessage(""); }}>
              Send another
            </Button>
            <Button variant="primary" size="md" onClick={() => { setDone(false); setMessage(""); setTab("mine"); }}>
              View my submissions
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
            <MessageSquarePlus className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold">Feedback</h1>
        </div>
        <p className="text-sm text-[rgb(var(--muted-fg))] ml-[52px]">
          Share your thoughts or track your previous submissions.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[rgb(var(--muted))]">
        {([
          { key: "submit", label: "Submit Feedback" },
          { key: "mine",   label: "My Submissions"  },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.key
                ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Submit tab */}
        {tab === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="theme-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3">What kind of feedback?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(({ value, label, icon: Icon, desc }) => (
                    <button key={value} onClick={() => setType(value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                        type === value
                          ? "bg-[rgb(var(--primary)/0.08)] border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                          : "border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
                      )}>
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium leading-none mb-0.5">{label}</p>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your message</label>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind…"
                  rows={5} maxLength={1000}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-sm resize-none",
                    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  )} />
                <p className="text-xs text-[rgb(var(--muted-fg))] text-right mt-1">{message.length}/1000</p>
              </div>

              {error && (
                <p className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </p>
              )}

              <Button variant="primary" size="lg" className="w-full"
                loading={loading} disabled={!message.trim()} onClick={handleSubmit}>
                Send feedback
              </Button>
            </div>
          </motion.div>
        )}

        {/* My Submissions tab */}
        {tab === "mine" && (
          <motion.div key="mine" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[rgb(var(--muted-fg))]">
                  {submissions.length} submission{submissions.length !== 1 ? "s" : ""} — status updates in real time
                </p>
                <Link href="/status" className="text-xs font-bold text-[rgb(var(--primary))] hover:underline flex items-center gap-1">
                   Detailed Tracking <ChevronRight className="w-3 h-3" />
                </Link>
                <button onClick={loadSubmissions} disabled={subLoading}
                  className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">
                  <RefreshCw className={cn("w-3.5 h-3.5 text-[rgb(var(--muted-fg))]", subLoading && "animate-spin")} />
                </button>
              </div>

              {subLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="theme-card p-4 h-20 animate-pulse" />)}
                </div>
              ) : submissions.length === 0 ? (
                <div className="theme-card p-10 text-center text-[rgb(var(--muted-fg))]">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No submissions yet.</p>
                  <button onClick={() => setTab("submit")}
                    className="mt-3 text-xs text-[rgb(var(--primary))] hover:underline">
                    Submit your first feedback →
                  </button>
                </div>
              ) : (
                submissions.map(sub => {
                  const cfg = STATUS_CONFIG[sub.status ?? "pending"];
                  const TypeIcon = TYPE_ICONS[sub.type] ?? HelpCircle;
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div key={sub.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="theme-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[rgb(var(--muted))] flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-xs font-semibold capitalize">{sub.type}</span>
                            <span className={cn(
                              "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              cfg.color
                            )}>
                              <StatusIcon className="w-3 h-3" />{cfg.label}
                            </span>
                            <span className="text-[11px] text-[rgb(var(--muted-fg))] ml-auto flex-shrink-0">
                              {new Date(sub.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-[rgb(var(--muted-fg))] line-clamp-2 leading-relaxed">{sub.message}</p>
                          {sub.status === "rejected" && sub.rejection_reason && (
                            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs">
                              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                              <span><strong>Reason: </strong>{sub.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
