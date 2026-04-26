"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, MessageSquarePlus,
  Search, RefreshCw, Shield, Lightbulb, Bug, Megaphone, HelpCircle,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

type FeedbackStatus = "pending" | "solved" | "rejected";

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  status: FeedbackStatus;
  rejection_reason: string | null;
  created_at: string;
  user_id: string;
  submitter: { full_name: string; email: string } | null;
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

const FILTER_TABS: { value: "all" | FeedbackStatus; label: string }[] = [
  { value: "all",      label: "All"      },
  { value: "pending",  label: "Pending"  },
  { value: "solved",   label: "Solved"   },
  { value: "rejected", label: "Rejected" },
];

export default function AdminFeedbackPage() {
  const supabase = createClient();
  const { userId, loaded } = useCurrentUser();

  const [isAdmin,  setIsAdmin]  = useState(false);
  const [items,    setItems]    = useState<FeedbackItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | FeedbackStatus>("pending");
  const [search,   setSearch]   = useState("");
  const [acting,   setActing]   = useState<string | null>(null);

  // Per-item reject reason input state
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loaded || !userId) return;
    const init = async () => {
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", userId).single();
      if (profile?.role !== "admin") { setLoading(false); return; }
      setIsAdmin(true);
      await fetchItems();
    };
    init();
  }, [loaded, userId]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("suggestions")
      .select("id, type, message, status, rejection_reason, created_at, user_id, submitter:profiles!user_id(full_name, email)")
      .order("created_at", { ascending: false });
    setItems((data as FeedbackItem[]) ?? []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: FeedbackStatus, reason?: string) => {
    if (status === "rejected" && !reason?.trim()) return;
    setActing(id);
    await (supabase as any)
      .from("suggestions")
      .update({
        status,
        rejection_reason: status === "rejected" ? reason : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? { ...it, status, rejection_reason: status === "rejected" ? (reason ?? null) : null }
          : it
      )
    );
    setShowRejectInput(p => ({ ...p, [id]: false }));
    setRejectReasons(p => ({ ...p, [id]: "" }));
    setActing(null);
  };

  const filtered = items.filter(it => {
    if (filter !== "all" && it.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        it.message.toLowerCase().includes(q) ||
        (it.submitter?.full_name ?? "").toLowerCase().includes(q) ||
        it.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all:      items.length,
    pending:  items.filter(i => i.status === "pending").length,
    solved:   items.filter(i => i.status === "solved").length,
    rejected: items.filter(i => i.status === "rejected").length,
  };

  // Not admin
  if (!loading && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="theme-card p-12 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--muted-fg))] opacity-40" />
          <p className="font-semibold">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Feedback Management</h1>
          <p className="text-xs text-[rgb(var(--muted-fg))]">{counts.pending} pending · {items.length} total</p>
        </div>
        <button onClick={fetchItems} disabled={loading}
          className="ml-auto p-2 rounded-xl hover:bg-[rgb(var(--muted))] transition-colors">
          <RefreshCw className={cn("w-4 h-4 text-[rgb(var(--muted-fg))]", loading && "animate-spin")} />
        </button>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-2xl bg-[rgb(var(--muted))] flex-shrink-0">
          {FILTER_TABS.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap",
                filter === t.value
                  ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                  : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}>
              {t.label}
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                filter === t.value ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]" : "bg-[rgb(var(--border))]")}>
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, type, or content…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm outline-none focus:border-[rgb(var(--primary))]" />
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="theme-card p-5 h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-card p-10 text-center text-[rgb(var(--muted-fg))]">
          <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No feedback matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const cfg = STATUS_CONFIG[item.status ?? "pending"];
            const TypeIcon = TYPE_ICONS[item.type] ?? HelpCircle;
            const StatusIcon = cfg.icon;
            const isActing = acting === item.id;
            const showReject = showRejectInput[item.id];

            return (
              <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="theme-card p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgb(var(--muted))] flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold truncate">
                        {item.submitter?.full_name ?? "Unknown User"}
                      </span>
                      <span className="text-[11px] text-[rgb(var(--muted-fg))]">{item.submitter?.email}</span>
                      <span className={cn(
                        "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-auto flex-shrink-0",
                        cfg.color
                      )}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] capitalize">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-[rgb(var(--muted-fg))]">
                        {new Date(item.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-wrap break-words">
                      {item.message}
                    </p>
                    {item.status === "rejected" && item.rejection_reason && (
                      <p className="text-xs text-red-400 mt-1 bg-red-500/10 px-2 py-1.5 rounded-lg">
                        Rejection reason: {item.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[rgb(var(--border))] flex-wrap">
                  <p className="text-xs text-[rgb(var(--muted-fg))] mr-auto">Update status:</p>
                  <button
                    onClick={() => updateStatus(item.id, "pending")}
                    disabled={isActing || item.status === "pending"}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                      item.status === "pending"
                        ? "bg-amber-500/20 text-amber-400 cursor-default"
                        : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-amber-500/10 hover:text-amber-400"
                    )}>
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </button>
                  <button
                    onClick={() => updateStatus(item.id, "solved")}
                    disabled={isActing || item.status === "solved"}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                      item.status === "solved"
                        ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                        : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-emerald-500/10 hover:text-emerald-400"
                    )}>
                    <CheckCircle className="w-3.5 h-3.5" /> Solved
                  </button>
                  <button
                    onClick={() => setShowRejectInput(p => ({ ...p, [item.id]: !p[item.id] }))}
                    disabled={isActing}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                      item.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-red-500/10 hover:text-red-400"
                    )}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showReject && "rotate-180")} />
                  </button>
                </div>

                {/* Reject reason input */}
                <AnimatePresence>
                  {showReject && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-2 pt-1">
                        <input
                          value={rejectReasons[item.id] ?? ""}
                          onChange={e => setRejectReasons(p => ({ ...p, [item.id]: e.target.value }))}
                          placeholder="Reason for rejection (required)…"
                          className="flex-1 bg-[rgb(var(--muted))] border border-red-500/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400"
                        />
                        <button
                          onClick={() => updateStatus(item.id, "rejected", rejectReasons[item.id])}
                          disabled={!rejectReasons[item.id]?.trim() || isActing}
                          className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                          {isActing ? "…" : "Confirm"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
