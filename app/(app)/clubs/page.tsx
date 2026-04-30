"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, Building2, Search, Plus, Star,
  Clock, ExternalLink, ImageIcon, X, Send, ChevronDown,
  Megaphone, Zap, Trash2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface University { id: string; name: string; short_name: string; }

interface Society {
  id: string; name: string; description: string | null;
  category: string; member_count: number; logo_url: string | null;
  university: { name: string; short_name: string } | null;
}

interface AdminSociety { id: string; name: string; logo_url: string | null; }

interface Event {
  id: string; title: string | null; content: string;
  post_type: string; event_date: string | null;
  image_url: string | null; image_urls: string[];
  likes: number; created_at: string;
  society: { id: string; name: string; logo_url: string | null } | null;
  author: { full_name: string; avatar_url: string | null } | null;
}

const CATEGORIES = ["All","academic","cultural","sports","tech","arts","community","general"];
const CAT_COLORS: Record<string, string> = {
  academic: "bg-blue-500/10 text-blue-400", cultural: "bg-pink-500/10 text-pink-400",
  sports: "bg-emerald-500/10 text-emerald-400", tech: "bg-violet-500/10 text-violet-400",
  arts: "bg-amber-500/10 text-amber-400", community: "bg-orange-500/10 text-orange-400",
  general: "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]",
};
const POST_TYPES = [
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "text-blue-400" },
  { value: "event",        label: "Event",        icon: Calendar,  color: "text-violet-400" },
  { value: "update",       label: "Update",       icon: Zap,       color: "text-amber-400" },
];

function formatEventDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function isUpcoming(d: string | null) { return !!d && new Date(d) > new Date(); }

/* ── Facebook-style image grid ─────────────────────────────────── */
function ImageGrid({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (!urls.length) return null;

  const show = urls.slice(0, 5);
  const extra = urls.length - 5;

  const gridClass =
    show.length === 1 ? "grid-cols-1" :
    show.length === 2 ? "grid-cols-2" :
    show.length >= 3  ? "grid-cols-2" : "grid-cols-1";

  return (
    <>
      <div className={cn("grid gap-0.5 rounded-xl overflow-hidden", gridClass)}>
        {show.map((url, i) => {
          const isLast = i === 4 && extra > 0;
          const spanFull = show.length === 3 && i === 0;
          return (
            <div
              key={i}
              onClick={() => setLightbox(i)}
              className={cn(
                "relative cursor-pointer overflow-hidden bg-[rgb(var(--muted))] group",
                show.length === 1 ? "aspect-[16/9]" : "aspect-square",
                spanFull && "row-span-2",
              )}
            >
              <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{extra}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 text-2xl"
              onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? Math.max(0, l - 1) : 0); }}
            >‹</button>
            <button
              className="absolute right-12 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 text-2xl"
              onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? Math.min(urls.length - 1, l + 1) : 0); }}
            >›</button>
            <motion.img
              key={lightbox}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={urls[lightbox]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <p className="absolute bottom-4 text-white/60 text-sm">{lightbox + 1} / {urls.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ClubsEventsPage() {
  const supabase = createClient();
  const { userId, role } = useCurrentUser();
  const isPlatformAdmin = role === "admin";
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"societies" | "events">("societies");

  // Societies state
  const [universities, setUniversities] = useState<University[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedUni, setSelectedUni] = useState("all");
  const [uniSearch, setUniSearch] = useState("");
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("All");
  const [societySearch, setSocietySearch] = useState("");
  const [societiesLoading, setSocietiesLoading] = useState(true);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joining, setJoining] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [eventsPage, setEventsPage] = useState(0);

  // Create post state
  const [adminSocieties, setAdminSocieties] = useState<AdminSociety[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postSocietyId, setPostSocietyId] = useState("");
  const [postType, setPostType] = useState("announcement");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postEventDate, setPostEventDate] = useState("");
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postPreviews, setPostPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  // Close uni dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (uniRef.current && !uniRef.current.contains(e.target as Node)) setUniDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  const filteredUnis = universities.filter(u =>
    !uniSearch || u.name.toLowerCase().includes(uniSearch.toLowerCase()) || u.short_name.toLowerCase().includes(uniSearch.toLowerCase())
  );
  const selectedUniLabel = selectedUni === "all" ? "All Universities" : (universities.find(u => u.id === selectedUni)?.short_name ?? "All Universities");

  useEffect(() => {
    if (tab !== "societies") return;
    setSocietiesLoading(true);
    let q = supabase.from("societies")
      .select("id, name, description, category, member_count, logo_url, university:universities!university_id(name, short_name)")
      .eq("status", "approved").order("member_count", { ascending: false });
    if (selectedUni !== "all") q = q.eq("university_id", selectedUni);
    q.then(({ data }) => { setSocieties((data as unknown as Society[]) ?? []); setSocietiesLoading(false); });
  }, [tab, selectedUni]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("society_members").select("society_id").eq("user_id", userId)
      .then(({ data }) => setJoinedIds(new Set((data ?? []).map((m: any) => m.society_id))));
    // Load societies where user is admin
    supabase.from("societies").select("id, name, logo_url").eq("admin_id", userId).eq("status", "approved")
      .then(({ data }) => { setAdminSocieties((data as AdminSociety[]) ?? []); if (data?.[0]) setPostSocietyId(data[0].id); });
  }, [userId]);

  const fetchEvents = async (page: number, append = false) => {
    if (joinedIds.size === 0) { setEvents([]); setEventsLoading(false); setHasMoreEvents(false); return; }
    setEventsLoading(true);
    const PAGE_SIZE = 10;
    const { data, error } = await (supabase as any)
      .from("society_posts")
      .select("id, title, content, post_type, event_date, image_url, image_urls, likes, created_at, society:societies!society_id(id, name, logo_url), author:profiles!author_id(full_name, avatar_url)")
      .in("society_id", Array.from(joinedIds))
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (!error && data) {
      const typed = data as Event[];
      append ? setEvents(p => [...p, ...typed]) : setEvents(typed);
      setHasMoreEvents(typed.length === PAGE_SIZE);
    }
    setEventsLoading(false);
  };

  useEffect(() => {
    if (tab === "events") { setEventsPage(0); fetchEvents(0, false); }
  }, [tab, joinedIds]);

  useEffect(() => {
    if (tab !== "events" || !hasMoreEvents) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !eventsLoading) {
        const next = eventsPage + 1; setEventsPage(next); fetchEvents(next, true);
      }
    }, { threshold: 0.1 });
    const el = document.getElementById("events-end-trigger");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [tab, hasMoreEvents, eventsLoading, eventsPage]);

  const adminSocietyIds = new Set(adminSocieties.map(s => s.id));

  const deletePost = async (postId: string) => {
    await (supabase as any).from("society_posts").delete().eq("id", postId);
    setEvents(p => p.filter(e => e.id !== postId));
  };

  const join = async (societyId: string) => {
    if (!userId) return;
    setJoining(societyId);
    // Optimistic UI
    const soc = societies.find(s => s.id === societyId);
    setJoinedIds(p => new Set([...p, societyId]));
    if (soc) setSocieties(p => p.map(s => s.id === societyId ? { ...s, member_count: s.member_count + 1 } : s));
    await supabase.from("society_members").insert({ society_id: societyId, user_id: userId });
    if (soc) await supabase.from("societies").update({ member_count: soc.member_count + 1 }).eq("id", societyId);
    setJoining(null);
  };

  const leave = async (societyId: string) => {
    if (!userId) return;
    setJoining(societyId);
    // Optimistic UI
    const soc = societies.find(s => s.id === societyId);
    setJoinedIds(p => { const n = new Set(p); n.delete(societyId); return n; });
    if (soc) setSocieties(p => p.map(s => s.id === societyId ? { ...s, member_count: Math.max(0, s.member_count - 1) } : s));
    await supabase.from("society_members").delete().eq("society_id", societyId).eq("user_id", userId);
    if (soc) await supabase.from("societies").update({ member_count: Math.max(0, soc.member_count - 1) }).eq("id", societyId);
    setJoining(null);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 30 - postImages.length;
    const picked = files.slice(0, remaining);
    setPostImages(p => [...p, ...picked]);
    setPostPreviews(p => [...p, ...picked.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(postPreviews[i]);
    setPostImages(p => p.filter((_, idx) => idx !== i));
    setPostPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const submitPost = async () => {
    if (!userId || !postSocietyId || !postContent.trim()) return;
    setPosting(true); setPostError("");
    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of postImages) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("society-posts").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("society-posts").getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      const { error: dbErr } = await (supabase as any).from("society_posts").insert({
        society_id: postSocietyId,
        author_id: userId,
        title: postTitle.trim() || null,
        content: postContent.trim(),
        post_type: postType,
        event_date: postEventDate || null,
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls,
      });
      if (dbErr) throw dbErr;

      // Reset + refresh
      setPostTitle(""); setPostContent(""); setPostEventDate(""); setPostImages([]); setPostPreviews([]); setShowCreatePost(false);
      fetchEvents(0, false);
    } catch (err: any) {
      setPostError(err.message ?? "Failed to post.");
    } finally {
      setPosting(false);
    }
  };

  const filteredSocieties = societies.filter(s => {
    const matchCat = category === "All" || s.category === category;
    const matchSearch = !societySearch || s.name.toLowerCase().includes(societySearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredEvents = events.filter(e => {
    const matchSearch = !eventSearch ||
      (e.title ?? "").toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.content.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (e.society?.name ?? "").toLowerCase().includes(eventSearch.toLowerCase());
    return matchSearch && (!showUpcomingOnly || isUpcoming(e.event_date));
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[rgb(var(--primary))]" /> Clubs & Events
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">Join societies and stay on top of campus events</p>
        </div>
        <Link href="/societies/register"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Register Society
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] w-fit">
        {([["societies","Societies",Building2],["events","Events Feed",Calendar]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors",
              tab === key ? "bg-[rgb(var(--bg))] shadow-sm text-[rgb(var(--fg))]" : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Societies tab ── */}
      {tab === "societies" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))] px-1">Category</span>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-medium capitalize flex-shrink-0 transition-colors",
                      category === c ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]" : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full sm:w-64 sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))] pointer-events-none" />
              <input value={societySearch} onChange={e => setSocietySearch(e.target.value)} placeholder="Search societies…"
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
          </div>

          <div ref={uniRef} className="relative w-full sm:w-64">
            <button onClick={() => setUniDropdownOpen(p => !p)}
              className={cn("w-full h-10 pl-3 pr-8 rounded-xl text-sm text-left border transition-colors flex items-center gap-2",
                uniDropdownOpen ? "border-[rgb(var(--primary))] bg-[rgb(var(--muted))]" : "border-[rgb(var(--border))] bg-[rgb(var(--muted))] hover:border-[rgb(var(--primary)/0.4)]")}>
              <Building2 className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))] flex-shrink-0" />
              <span className={cn("truncate flex-1", selectedUni !== "all" ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))]")}>{selectedUniLabel}</span>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
            </button>
            {uniDropdownOpen && (
              <div className="absolute top-12 left-0 right-0 z-30 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl overflow-hidden">
                <div className="p-2 border-b border-[rgb(var(--border))]">
                  <input autoFocus value={uniSearch} onChange={e => setUniSearch(e.target.value)} placeholder="Type to search…"
                    className="w-full h-8 px-3 rounded-lg text-sm bg-[rgb(var(--muted))] outline-none" />
                </div>
                <div className="max-h-52 overflow-y-auto p-1">
                  <button onClick={() => { setSelectedUni("all"); setUniSearch(""); setUniDropdownOpen(false); }}
                    className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedUni === "all" ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] font-medium" : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--fg))]")}>
                    All Universities
                  </button>
                  {filteredUnis.length === 0 && <p className="text-xs text-[rgb(var(--muted-fg))] text-center py-3">No results</p>}
                  {filteredUnis.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUni(u.id); setUniSearch(""); setUniDropdownOpen(false); }}
                      className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedUni === u.id ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] font-medium" : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--fg))]")}>
                      <span className="font-medium">{u.short_name}</span>
                      <span className="text-[rgb(var(--muted-fg))] ml-1.5 text-xs">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {societiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />)}
            </div>
          ) : filteredSocieties.length === 0 ? (
            <div className="theme-card p-12 text-center">
              <Building2 className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No societies found</p>
              <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">Try a different filter or register your own!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSocieties.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="theme-card p-5 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                      {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : s.name.charAt(0)}
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", CAT_COLORS[s.category] ?? CAT_COLORS.general)}>{s.category}</span>
                  </div>
                  <div className="flex-1">
                    <Link href={`/societies/${s.id}`}>
                      <h3 className="font-semibold group-hover:text-[rgb(var(--primary))] transition-colors">{s.name}</h3>
                    </Link>
                    {s.university && <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" />{s.university.short_name}</p>}
                    {s.description && <p className="text-xs text-[rgb(var(--muted-fg))] mt-1.5 line-clamp-2">{s.description}</p>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))]"><Users className="w-3.5 h-3.5" /> {s.member_count}</span>
                    <div className="flex items-center gap-2">
                      {joinedIds.has(s.id) && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <Star className="w-3.5 h-3.5 fill-current" /> Joined
                        </span>
                      )}
                      <Link href={`/societies/${s.id}`}
                        className="text-xs px-3 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium hover:bg-[rgb(var(--primary)/0.2)] transition-colors">
                        Open →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Events tab ── */}
      {tab === "events" && (
        <div className="space-y-4">

          {/* Create Post — only for society admins */}
          {adminSocieties.length > 0 && (
            <div className="theme-card overflow-hidden">
              <button
                onClick={() => setShowCreatePost(p => !p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--muted)/0.5)] transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-[rgb(var(--primary))]" />
                </div>
                <span className="text-sm text-[rgb(var(--muted-fg))] flex-1 text-left">Share photos, announcements, events…</span>
                <Plus className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
              </button>

              <AnimatePresence>
                {showCreatePost && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3 border-t border-[rgb(var(--border))]">

                      {/* Society selector */}
                      {adminSocieties.length > 1 && (
                        <div className="pt-3">
                          <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Posting as</label>
                          <select value={postSocietyId} onChange={e => setPostSocietyId(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]">
                            {adminSocieties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Post type */}
                      <div className={adminSocieties.length > 1 ? "" : "pt-3"}>
                        <div className="flex gap-2">
                          {POST_TYPES.map(pt => (
                            <button key={pt.value} onClick={() => setPostType(pt.value)}
                              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border flex-1 justify-center",
                                postType === pt.value ? "bg-[rgb(var(--primary)/0.12)] border-[rgb(var(--primary)/0.3)] text-[rgb(var(--primary))]" : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                              <pt.icon className={cn("w-3.5 h-3.5", postType === pt.value && pt.color)} />
                              {pt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="Title (optional)"
                        className="w-full h-9 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]" />

                      {/* Content */}
                      <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
                        placeholder="What's happening at your society?" rows={3}
                        className="w-full px-3 py-2 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] resize-none" />

                      {/* Event date (only for events) */}
                      {postType === "event" && (
                        <div>
                          <label className="text-xs text-[rgb(var(--muted-fg))] mb-1 block">Event date & time</label>
                          <input type="datetime-local" value={postEventDate} onChange={e => setPostEventDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]" />
                        </div>
                      )}

                      {/* Image previews */}
                      {postPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {postPreviews.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[rgb(var(--muted))]">
                              <img src={src} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(i)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {postImages.length < 30 && (
                            <button onClick={() => fileRef.current?.click()}
                              className="aspect-square rounded-lg border-2 border-dashed border-[rgb(var(--border))] flex items-center justify-center text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.4)] hover:text-[rgb(var(--primary))] transition-colors">
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Actions row */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => fileRef.current?.click()} disabled={postImages.length >= 30}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors disabled:opacity-40">
                          <ImageIcon className="w-3.5 h-3.5" /> Add Photos {postImages.length > 0 && `(${postImages.length}/30)`}
                        </button>
                        <div className="flex-1" />
                        {postError && <p className="text-xs text-red-400">{postError}</p>}
                        <button onClick={() => setShowCreatePost(false)}
                          className="px-3 py-2 rounded-xl text-xs text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] transition-colors">
                          Cancel
                        </button>
                        <button onClick={submitPost} disabled={posting || !postContent.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 disabled:opacity-40 transition-opacity">
                          {posting ? "Posting…" : <><Send className="w-3.5 h-3.5" /> Post</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))] pointer-events-none" />
              <input value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Search posts…"
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
            <button onClick={() => setShowUpcomingOnly(p => !p)}
              className={cn("flex items-center gap-2 px-4 py-2 h-10 rounded-xl text-sm font-medium transition-all border flex-shrink-0",
                showUpcomingOnly ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent" : "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)]")}>
              <Clock className="w-4 h-4" /> Upcoming only
            </button>
          </div>

          {/* Feed */}
          {events.length === 0 && !eventsLoading ? (
            <div className="theme-card p-12 text-center">
              <Calendar className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No posts yet</p>
              <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
                {joinedIds.size === 0 ? "Follow some societies to see their updates here!" : "The societies you follow haven't posted anything yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev, i) => {
                const upcoming = isUpcoming(ev.event_date);
                const imgs = ev.image_urls?.length ? ev.image_urls : (ev.image_url ? [ev.image_url] : []);
                const typeLabel = ev.post_type ?? "update";
                return (
                  <motion.article key={ev.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className={cn("theme-card overflow-hidden", upcoming && "border-[rgb(var(--primary)/0.2)]")}>

                    {/* Post header */}
                    <div className="flex items-center gap-3 p-4 pb-3">
                      <Link href={`/societies/${ev.society?.id}`} className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold text-base overflow-hidden">
                          {ev.society?.logo_url ? <img src={ev.society.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : (ev.society?.name.charAt(0) ?? "?")}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/societies/${ev.society?.id}`} className="font-bold text-sm hover:text-[rgb(var(--primary))] transition-colors">{ev.society?.name}</Link>
                        <p className="text-[10px] text-[rgb(var(--muted-fg))]">{ev.author?.full_name} · {new Date(ev.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {upcoming && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Upcoming</span>}
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                          typeLabel === "announcement" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          typeLabel === "event" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
                          {typeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="px-4 pb-3 space-y-1.5">
                      {ev.title && <h3 className="font-bold text-base leading-tight">{ev.title}</h3>}
                      <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed whitespace-pre-line">{ev.content}</p>
                      {ev.event_date && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--primary))] mt-1">
                          <Calendar className="w-3.5 h-3.5" />{formatEventDate(ev.event_date)}
                        </div>
                      )}
                    </div>

                    {/* Image grid */}
                    {imgs.length > 0 && (
                      <div className="px-0">
                        <ImageGrid urls={imgs} />
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[rgb(var(--border))]">
                      <button className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
                        <Star className="w-4 h-4" /> {ev.likes}
                      </button>
                      <div className="flex items-center gap-3">
                        {(isPlatformAdmin || adminSocietyIds.has(ev.society?.id ?? "")) && (
                          <button onClick={() => deletePost(ev.id)}
                            className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))] hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        )}
                        <Link href={`/societies/${ev.society?.id}`}
                          className="text-xs font-medium text-[rgb(var(--primary))] hover:opacity-80 flex items-center gap-1">
                          View Society <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}

              <div id="events-end-trigger" className="h-10 flex items-center justify-center">
                {eventsLoading && <div className="w-5 h-5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />}
                {!hasMoreEvents && events.length > 0 && <p className="text-xs text-[rgb(var(--muted-fg))]">You&apos;ve reached the end of the feed.</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
