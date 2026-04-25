"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Building2, Mail,
  AlertTriangle, Search, RefreshCw, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

type SocietyStatus = "pending" | "approved" | "rejected" | "suspended";

interface Society {
  id: string;
  name: string;
  description: string | null;
  official_email: string | null;
  category: string;
  status: SocietyStatus;
  member_count: number;
  rejection_note: string | null;
  created_at: string;
  university: { name: string; short_name: string } | null;
  admin: { full_name: string; email: string } | null;
}

const STATUS_CONFIG: Record<SocietyStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-amber-400 bg-amber-400/10",    icon: Clock },
  approved:  { label: "Approved",  color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "text-red-400 bg-red-400/10",        icon: XCircle },
  suspended: { label: "Suspended", color: "text-gray-400 bg-gray-400/10",      icon: AlertTriangle },
};

const TABS: { value: SocietyStatus; label: string }[] = [
  { value: "pending",  label: "Pending"  },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: SocietyStatus }) {
  const { label, color, icon: Icon } = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full", color)}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function AdminSocietiesPage() {
  const { userId, role, loaded } = useCurrentUser();
  const supabase = createClient();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SocietyStatus>("pending");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSocieties = async () => {
    const { data } = await supabase
      .from("societies")
      .select(`
        id, name, description, official_email, category, status,
        member_count, rejection_note, created_at,
        university:universities!university_id(name, short_name),
        admin:profiles!admin_id(full_name, email)
      `)
      .order("created_at", { ascending: false });
    setSocieties((data as unknown as Society[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!loaded || role !== "admin") { setLoading(false); return; }
    fetchSocieties();

    const channel = supabase
      .channel("admin-societies-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "societies" }, () => {
        fetchSocieties();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, role]);

  const approve = async (id: string) => {
    if (!userId) return;
    setProcessing(id);
    await supabase.from("societies").update({
      status: "approved",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      rejection_note: null,
    }).eq("id", id);
    setSocieties(p => p.map(s => s.id === id ? { ...s, status: "approved" as SocietyStatus } : s));
    setProcessing(null);
  };

  const reject = async (id: string) => {
    if (!userId) return;
    setProcessing(id);
    await supabase.from("societies").update({
      status: "rejected",
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      rejection_note: rejectNote || "Does not meet requirements.",
    }).eq("id", id);
    setSocieties(p => p.map(s => s.id === id
      ? { ...s, status: "rejected" as SocietyStatus, rejection_note: rejectNote }
      : s
    ));
    setRejectingId(null);
    setRejectNote("");
    setProcessing(null);
  };

  if (loaded && role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-sm text-[rgb(var(--muted-fg))]">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const displayed = societies
    .filter(s => s.status === tab)
    .filter(s => !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.official_email?.includes(search)
    );

  const counts = {
    pending:  societies.filter(s => s.status === "pending").length,
    approved: societies.filter(s => s.status === "approved").length,
    rejected: societies.filter(s => s.status === "rejected").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[rgb(var(--primary))]" /> Society Approvals
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">
            Review and manage society registration requests
          </p>
        </div>
        <button
          onClick={fetchSocieties}
          className="p-2 rounded-xl bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] w-fit">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
              tab === t.value
                ? "bg-[rgb(var(--bg))] shadow-sm text-[rgb(var(--fg))]"
                : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
            )}>
            {t.label}
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              tab === t.value
                ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]"
                : "bg-[rgb(var(--border))] text-[rgb(var(--muted-fg))]"
            )}>
              {(counts as Record<string, number>)[t.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="theme-card p-12 text-center">
          <Building2 className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No {tab} societies</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
            {search ? "No results for your search." : `No societies are currently ${tab}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(society => (
            <motion.div
              key={society.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="theme-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.12)] flex items-center justify-center text-[rgb(var(--primary))] font-bold text-lg flex-shrink-0">
                    {society.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-semibold text-sm">{society.name}</h3>
                      <StatusBadge status={society.status} />
                      <span className="text-[10px] text-[rgb(var(--muted-fg))] capitalize bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded-md">
                        {society.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-fg))] flex-wrap">
                      {society.university && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{society.university.short_name}
                        </span>
                      )}
                      {society.official_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />{society.official_email}
                        </span>
                      )}
                      {society.admin && <span>by {society.admin.full_name}</span>}
                    </div>
                    {society.description && (
                      <p className="text-xs text-[rgb(var(--muted-fg))] mt-1.5 line-clamp-2">
                        {society.description}
                      </p>
                    )}
                    {society.rejection_note && society.status === "rejected" && (
                      <p className="text-xs text-red-400 mt-1.5 bg-red-500/10 px-2 py-1 rounded-lg">
                        Rejection reason: {society.rejection_note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {society.status === "pending" && (
                    <>
                      <button
                        onClick={() => approve(society.id)}
                        disabled={processing === society.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(society.id); setRejectNote(""); }}
                        disabled={processing === society.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {society.status === "rejected" && (
                    <button
                      onClick={() => approve(society.id)}
                      disabled={processing === society.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                    >
                      Re-approve
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection note input */}
              <AnimatePresence>
                {rejectingId === society.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 border-t border-[rgb(var(--border))] pt-3"
                  >
                    <p className="text-xs text-[rgb(var(--muted-fg))] mb-2">Reason for rejection (optional):</p>
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. Duplicate society, invalid email domain…"
                      className="w-full bg-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => reject(society.id)}
                        disabled={processing === society.id}
                        className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40"
                      >
                        {processing === society.id ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-1.5 rounded-xl bg-[rgb(var(--muted))] text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
