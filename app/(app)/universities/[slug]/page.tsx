"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Globe, Users, Calendar, GraduationCap,
  MessageSquare, BookOpen, UserCheck, ExternalLink, ArrowLeft, ArrowRight,
  Download, ThumbsUp, Upload, Star, Send, Pencil, Trash2, Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type University = Database["public"]["Tables"]["universities"]["Row"];
type Profile    = Database["public"]["Tables"]["profiles"]["Row"];
type Note       = Database["public"]["Tables"]["notes"]["Row"];

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; avatar_url: string | null; department: string | null } | null;
}

const TABS = [
  { id: "chat",    label: "Chat",    icon: MessageSquare },
  { id: "notes",   label: "Notes",   icon: BookOpen },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "members", label: "Members", icon: Users },
] as const;

type TabId = typeof TABS[number]["id"];

/* ── Star rating widget ─────────────────────────────────────── */
function StarPicker({
  value, onChange, size = "md", readonly = false,
}: {
  value: number; onChange?: (v: number) => void; size?: "sm"|"md"|"lg"; readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  const active = hovered || value;
  return (
    <div className={cn("flex gap-0.5", !readonly && "cursor-pointer")}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110 active:scale-95")}>
          <Star className={cn(sz, "transition-colors")}
            fill={star <= active ? "rgb(var(--warning))" : "none"}
            stroke={star <= active ? "rgb(var(--warning))" : "rgb(var(--border))"}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

/* ── Rating breakdown bar ───────────────────────────────────── */
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-[rgb(var(--muted-fg))]">{label}</span>
      <Star className="w-3 h-3 shrink-0" fill="rgb(var(--warning))" stroke="rgb(var(--warning))" />
      <div className="flex-1 h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
        <motion.div className="h-full rounded-full bg-amber-400"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
      </div>
      <span className="w-6 text-right text-[rgb(var(--muted-fg))]">{count}</span>
    </div>
  );
}

/* ── Review card ────────────────────────────────────────────── */
function ReviewCard({
  review, isOwn, onEdit, onDelete,
}: {
  review: Review; isOwn: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const name     = review.profiles?.full_name || "Anonymous";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const date     = new Date(review.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.2)] space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center shrink-0">
            {review.profiles?.avatar_url
              ? <img src={review.profiles.avatar_url} alt={name} className="w-full h-full object-cover" />
              : <span className="text-[10px] font-bold text-white">{initials}</span>}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{name}</p>
            {review.profiles?.department && (
              <p className="text-[11px] text-[rgb(var(--muted-fg))]">{review.profiles.department}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[rgb(var(--muted-fg))]">{date}</span>
          {isOwn && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-500/10 text-[rgb(var(--muted-fg))] hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <StarPicker value={review.rating} readonly size="sm" />
      {review.review_text && (
        <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">{review.review_text}</p>
      )}
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function UniversityHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const supabase = createClient();
  const router   = useRouter();

  const [uni, setUni]               = useState<University | null>(null);
  const [members, setMembers]       = useState<Profile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<TabId>("chat");
  const [isMember, setIsMember]     = useState(false);
  const [uniChannelId, setUniChannelId] = useState<string | null>(null);
  const [notes, setNotes]           = useState<Note[]>([]);
  const [userId, setUserId]         = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myRating, setMyRating]     = useState(0);
  const [myText, setMyText]         = useState("");
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: uniData }, { data: { user } }] = await Promise.all([
        supabase.from("universities").select("*").eq("slug", slug).single(),
        supabase.auth.getUser(),
      ]);
      if (!uniData) { setLoading(false); return; }
      setUni(uniData);
      setUserId(user?.id ?? null);

      const [{ data: membersData }, { data: notesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("university_id", uniData.id).eq("status", "active").order("created_at", { ascending: false }).limit(50),
        supabase.from("notes").select("*").eq("university_id", uniData.id).eq("status", "published").order("downloads", { ascending: false }).limit(20),
      ]);
      setMembers(membersData || []);
      setNotes(notesData || []);

      let { data: channel } = await supabase.from("channels").select("id").eq("type", "university").eq("university_id", uniData.id).single();
      if (!channel) {
        const { data: created } = await supabase.from("channels").insert({ type: "university", university_id: uniData.id, name: `${uniData.short_name} Chat` }).select("id").single();
        channel = created;
      }
      if (channel) setUniChannelId(channel.id);

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single();
        setIsMember(profile?.university_id === uniData.id);
      }

      setLoading(false);
    })();
  }, [slug]);

  // Load reviews when tab opens
  useEffect(() => {
    if (tab !== "reviews" || !uni) return;
    loadReviews();
  }, [tab, uni]);

  const loadReviews = async () => {
    if (!uni) return;
    setReviewsLoading(true);
    const { data } = await (supabase as any)
      .from("university_reviews")
      .select("*, profiles(full_name, avatar_url, department)")
      .eq("university_id", uni.id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setReviewsLoading(false);

    // Pre-fill if user has a review
    if (userId) {
      const mine = (data || []).find((r: Review) => r.user_id === userId);
      if (mine) { setMyRating(mine.rating); setMyText(mine.review_text || ""); setEditingId(mine.id); }
      else { setMyRating(0); setMyText(""); setEditingId(null); }
    }
  };

  const submitReview = async () => {
    if (!uni || !userId) return;
    if (myRating === 0) { setReviewError("Please select a star rating."); return; }
    setReviewError("");
    setSubmitting(true);

    if (editingId) {
      await (supabase as any).from("university_reviews").update({ rating: myRating, review_text: myText.trim() || null, updated_at: new Date().toISOString() }).eq("id", editingId);
    } else {
      await (supabase as any).from("university_reviews").insert({ university_id: uni.id, user_id: userId, rating: myRating, review_text: myText.trim() || null });
    }
    await loadReviews();
    setSubmitting(false);
  };

  const deleteReview = async (id: string) => {
    await (supabase as any).from("university_reviews").delete().eq("id", id);
    setMyRating(0); setMyText(""); setEditingId(null);
    await loadReviews();
  };

  // Aggregate stats
  const totalReviews = reviews.length;
  const avgRating    = totalReviews > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews : 0;
  const breakdown    = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="theme-card h-40 animate-pulse" />
        <div className="theme-card p-6 animate-pulse"><div className="h-6 bg-[rgb(var(--muted))] rounded w-1/3 mb-2" /><div className="h-4 bg-[rgb(var(--muted))] rounded w-1/2" /></div>
      </div>
    );
  }

  if (!uni) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="theme-card p-12 text-center">
          <GraduationCap className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="text-[rgb(var(--muted-fg))]">University not found.</p>
          <Link href="/universities" className="mt-4 inline-flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline"><ArrowLeft className="w-4 h-4" /> Back to universities</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/universities" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> All universities
      </Link>

      {/* Cover + header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="theme-card overflow-hidden">
        <div className="h-32 sm:h-44 w-full relative"
          style={{ background: uni.cover_url ? `url(${uni.cover_url}) center/cover` : `linear-gradient(135deg, rgb(var(--primary)/0.6), rgb(var(--accent)/0.4))` }}>
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="p-6">
          <div className="flex items-end gap-4 -mt-14 mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[rgb(var(--card))] border-4 border-[rgb(var(--card))] flex-shrink-0 z-10 relative">
              {uni.logo_url
                ? <img src={uni.logo_url} alt={uni.short_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center"><span className="text-xl font-bold text-white">{uni.short_name.slice(0, 3)}</span></div>}
            </div>
            <div className="flex-1 min-w-0 pt-12">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold leading-tight">{uni.name}</h1>
                  <p className="text-sm text-[rgb(var(--primary))] font-semibold">{uni.short_name}</p>
                </div>
                {isMember && (
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]">
                    <UserCheck className="w-3 h-3" /> Your university
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[rgb(var(--muted-fg))]">
            {uni.city && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {uni.city}{uni.province && `, ${uni.province}`}</span>}
            {uni.founding_year && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Est. {uni.founding_year}</span>}
            {uni.website && (
              <a href={uni.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[rgb(var(--primary))] hover:underline">
                <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {members.length} member{members.length !== 1 ? "s" : ""}</span>
            {totalReviews > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4" fill="rgb(var(--warning))" stroke="rgb(var(--warning))" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-[rgb(var(--muted-fg))]">({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="theme-card overflow-hidden">
        <div className="flex border-b border-[rgb(var(--border))] overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px whitespace-nowrap",
                tab === id ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))]" : "border-transparent text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}>
              <Icon className="w-4 h-4" />
              {label}
              {id === "members" && members.length > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--muted))]">{members.length}</span>
              )}
              {id === "reviews" && totalReviews > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--muted))]">{totalReviews}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── CHAT ── */}
          {tab === "chat" && (
            <div className="flex flex-col items-center text-center py-10 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[rgb(var(--primary))]" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">{uni.short_name} Chat Room</p>
                <p className="text-sm text-[rgb(var(--muted-fg))] max-w-sm">One shared chat for all {uni.short_name} students.</p>
              </div>
              {uniChannelId
                ? <Link href={`/chat/${uniChannelId}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 active:scale-95">Open Chat <ArrowRight className="w-4 h-4" /></Link>
                : <div className="h-10 w-32 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />}
              <p className="text-xs text-[rgb(var(--muted-fg))]">{members.length} member{members.length !== 1 ? "s" : ""} · campus badge shown on every message</p>
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === "notes" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[rgb(var(--muted-fg))]">{notes.length > 0 ? `${notes.length} note${notes.length !== 1 ? "s" : ""} from ${uni.short_name} students` : `No notes from ${uni.short_name} yet`}</p>
                <Link href="/notes/upload" className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </Link>
              </div>
              {notes.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
                  <p className="text-sm text-[rgb(var(--muted-fg))] mb-3">Be the first to share notes from {uni.short_name}!</p>
                  <Link href="/notes" className="text-sm text-[rgb(var(--primary))] hover:underline inline-flex items-center gap-1">Browse all notes <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map(note => (
                    <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--muted)/0.5)] transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-[rgb(var(--primary))]" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[rgb(var(--primary))]">{note.title}</p>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">{note.subject}{note.semester ? ` · ${note.semester}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {note.downloads}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {note.upvotes}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {tab === "reviews" && (
            <div className="space-y-6">

              {/* Aggregate summary */}
              {totalReviews > 0 && (
                <div className="flex gap-6 p-5 rounded-2xl bg-[rgb(var(--muted)/0.3)] border border-[rgb(var(--border))]">
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <span className="text-5xl font-bold">{avgRating.toFixed(1)}</span>
                    <StarPicker value={Math.round(avgRating)} readonly size="sm" />
                    <span className="text-xs text-[rgb(var(--muted-fg))] mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                    {breakdown.map(({ star, count }) => (
                      <RatingBar key={star} label={String(star)} count={count} total={totalReviews} />
                    ))}
                  </div>
                </div>
              )}

              {/* Write / Edit review */}
              {userId ? (
                <div className="p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.2)] space-y-4">
                  <h3 className="font-semibold text-sm">
                    {editingId ? "Edit Your Review" : "Write a Review"}
                  </h3>

                  {/* Stars — mandatory */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[rgb(var(--muted-fg))]">
                      Rating <span className="text-red-400">*</span>
                    </label>
                    <StarPicker value={myRating} onChange={v => { setMyRating(v); setReviewError(""); }} size="lg" />
                    {reviewError && (
                      <p className="text-xs text-red-400">{reviewError}</p>
                    )}
                  </div>

                  {/* Review text */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-[rgb(var(--muted-fg))]">Review <span className="text-[rgb(var(--muted-fg))]">(optional)</span></label>
                    <textarea
                      value={myText}
                      onChange={e => setMyText(e.target.value)}
                      placeholder={`Share your experience at ${uni.short_name}…`}
                      rows={3}
                      maxLength={600}
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] resize-none"
                    />
                    <p className="text-xs text-[rgb(var(--muted-fg))] text-right">{myText.length}/600</p>
                  </div>

                  <button onClick={submitReview} disabled={submitting || myRating === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-40 transition-opacity">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? "Saving…" : editingId ? "Update Review" : "Post Review"}
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-[rgb(var(--border))] text-center text-sm text-[rgb(var(--muted-fg))]">
                  <Link href="/login" className="text-[rgb(var(--primary))] hover:underline font-medium">Sign in</Link> to write a review
                </div>
              )}

              {/* Reviews list */}
              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-[rgb(var(--muted-fg))]">No reviews yet. Be the first to review {uni.short_name}!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <ReviewCard key={r.id} review={r} isOwn={r.user_id === userId}
                      onEdit={() => { setMyRating(r.rating); setMyText(r.review_text || ""); setEditingId(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      onDelete={() => deleteReview(r.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MEMBERS ── */}
          {tab === "members" && (
            members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
                <p className="text-[rgb(var(--muted-fg))]">No members yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {members.map((m, i) => <MemberCard key={m.id} profile={m} index={i} />)}
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MemberCard({ profile, index }: { profile: Profile; index: number }) {
  const initials = profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
      <Link href={`/profile/${profile.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--muted)/0.5)] transition-colors group">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
          {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-white">{initials}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-[rgb(var(--primary))]">{profile.full_name}</p>
          {profile.department && <p className="text-xs text-[rgb(var(--muted-fg))] truncate">{profile.department}</p>}
        </div>
        {profile.is_verified && <UserCheck className="w-4 h-4 text-[rgb(var(--primary))] flex-shrink-0" />}
      </Link>
    </motion.div>
  );
}
