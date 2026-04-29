"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users, Calendar, Building2, Search, Plus, Star,
  MapPin, Clock, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface University { id: string; name: string; short_name: string; }

interface Society {
  id: string;
  name: string;
  description: string | null;
  category: string;
  member_count: number;
  logo_url: string | null;
  university: { name: string; short_name: string } | null;
}

interface Event {
  id: string;
  title: string | null;
  content: string;
  type: string;
  event_date: string | null;
  image_url: string | null;
  likes: number;
  created_at: string;
  society: { id: string; name: string; logo_url: string | null } | null;
  author: { full_name: string; avatar_url: string | null } | null;
}

const CATEGORIES = ["All","academic","cultural","sports","tech","arts","community","general"];
const CAT_COLORS: Record<string, string> = {
  academic:  "bg-blue-500/10 text-blue-400",
  cultural:  "bg-pink-500/10 text-pink-400",
  sports:    "bg-emerald-500/10 text-emerald-400",
  tech:      "bg-violet-500/10 text-violet-400",
  arts:      "bg-amber-500/10 text-amber-400",
  community: "bg-orange-500/10 text-orange-400",
  general:   "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]",
};

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) > new Date();
}

export default function ClubsEventsPage() {
  const supabase = createClient();
  const { userId } = useCurrentUser();

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
  const [eventsPage, setEventsPage] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);

  // Load events when tab=events
  const fetchEvents = async (page: number, append = false) => {
    if (tab !== "events") return;
    if (joinedIds.size === 0) {
      setEvents([]);
      setEventsLoading(false);
      setHasMoreEvents(false);
      return;
    }
    
    setEventsLoading(true);
    const PAGE_SIZE = 10;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from("society_posts")
      .select("id, title, content, type, event_date, image_url, likes, created_at, society:societies!society_id(id, name, logo_url), author:profiles!author_id(full_name, avatar_url)")
      .in("society_id", Array.from(joinedIds))
      .order("created_at", { ascending: false })
      .range(from, to);

    const { data, error } = await q;
    
    if (error) {
      console.error("Error fetching events:", error);
      setEventsLoading(false);
      return;
    }

    const newEvents = (data as unknown as Event[]) ?? [];
    if (append) {
      setEvents(p => [...p, ...newEvents]);
    } else {
      setEvents(newEvents);
    }
    
    setHasMoreEvents(newEvents.length === PAGE_SIZE);
    setEventsLoading(false);
  };

  useEffect(() => {
    if (tab === "events") {
      setEventsPage(0);
      fetchEvents(0, false);
    }
  }, [tab, joinedIds]);

  const loadMoreEvents = () => {
    if (eventsLoading || !hasMoreEvents) return;
    const nextPage = eventsPage + 1;
    setEventsPage(nextPage);
    fetchEvents(nextPage, true);
  };

  // Close uni dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setUniDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load universities once
  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  const filteredUnis = universities.filter(u =>
    !uniSearch || u.name.toLowerCase().includes(uniSearch.toLowerCase()) || u.short_name.toLowerCase().includes(uniSearch.toLowerCase())
  );
  const selectedUniLabel = selectedUni === "all" ? "All Universities" : (universities.find(u => u.id === selectedUni)?.short_name ?? "All Universities");

  // Load societies when tab=societies or university changes
  useEffect(() => {
    if (tab !== "societies") return;
    setSocietiesLoading(true);
    let q = supabase
      .from("societies")
      .select("id, name, description, category, member_count, logo_url, university:universities!university_id(name, short_name)")
      .eq("status", "approved")
      .order("member_count", { ascending: false });
    if (selectedUni !== "all") q = q.eq("university_id", selectedUni);
    q.then(({ data }) => { setSocieties((data as unknown as Society[]) ?? []); setSocietiesLoading(false); });
  }, [tab, selectedUni]);

  // Load joined society ids
  useEffect(() => {
    if (!userId) return;
    supabase.from("society_members").select("society_id").eq("user_id", userId)
      .then(({ data }) => setJoinedIds(new Set((data ?? []).map(m => m.society_id))));
  }, [userId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (tab !== "events" || !hasMoreEvents) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !eventsLoading) {
        loadMoreEvents();
      }
    }, { threshold: 0.1 });

    const el = document.getElementById("events-end-trigger");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [tab, hasMoreEvents, eventsLoading, eventsPage]);

  const join = async (societyId: string) => {
    if (!userId) return;
    setJoining(societyId);
    await supabase.from("society_members").insert({ society_id: societyId, user_id: userId });
    const soc = societies.find(s => s.id === societyId);
    if (soc) {
      await supabase.from("societies").update({ member_count: soc.member_count + 1 }).eq("id", societyId);
      setSocieties(p => p.map(s => s.id === societyId ? { ...s, member_count: s.member_count + 1 } : s));
    }
    setJoinedIds(p => new Set([...p, societyId]));
    setJoining(null);
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
      e.society?.name.toLowerCase().includes(eventSearch.toLowerCase());
    const matchUpcoming = !showUpcomingOnly || isUpcoming(e.event_date);
    return matchSearch && matchUpcoming;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[rgb(var(--primary))]" /> Clubs & Events
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">
            Join societies and stay on top of campus events
          </p>
        </div>
        <Link
          href="/societies/register"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Register Society
        </Link>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--muted))] w-fit">
        <button
          onClick={() => setTab("societies")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors",
            tab === "societies"
              ? "bg-[rgb(var(--bg))] shadow-sm text-[rgb(var(--fg))]"
              : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <Building2 className="w-4 h-4" /> Societies
        </button>
        <button
          onClick={() => setTab("events")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors",
            tab === "events"
              ? "bg-[rgb(var(--bg))] shadow-sm text-[rgb(var(--fg))]"
              : "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <Calendar className="w-4 h-4" /> Events Feed
        </button>
      </div>

      {/* ── Societies Tab ───────────────────────────────────────────────────────── */}
      {tab === "societies" && (
        <>
          {/* Category filter + search */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))] px-1">Category</span>
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-medium capitalize flex-shrink-0 transition-colors",
                      category === c
                        ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]"
                        : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative w-full sm:w-64 sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))] pointer-events-none" />
              <input value={societySearch} onChange={e => setSocietySearch(e.target.value)}
                placeholder="Search societies…"
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
          </div>

          {/* University searchable dropdown */}
          <div ref={uniRef} className="relative w-full sm:w-64">
            <button
              onClick={() => setUniDropdownOpen(p => !p)}
              className={cn(
                "w-full h-10 pl-3 pr-8 rounded-xl text-sm text-left border transition-colors flex items-center gap-2",
                uniDropdownOpen
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--muted))]"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--muted))] hover:border-[rgb(var(--primary)/0.4)]"
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))] flex-shrink-0" />
              <span className={cn("truncate flex-1", selectedUni !== "all" ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))]")}>
                {selectedUniLabel}
              </span>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
            </button>
            {uniDropdownOpen && (
              <div className="absolute top-12 left-0 right-0 z-30 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl overflow-hidden">
                <div className="p-2 border-b border-[rgb(var(--border))]">
                  <input autoFocus value={uniSearch} onChange={e => setUniSearch(e.target.value)}
                    placeholder="Type to search…"
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

          {/* Grid */}
          {societiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />)}
            </div>
          ) : filteredSocieties.length === 0 ? (
            <div className="theme-card p-12 text-center">
              <Building2 className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No societies found</p>
              <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">Try a different filter or register your own!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSocieties.map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="theme-card p-5 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                      {s.logo_url
                        ? <img src={s.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                        : s.name.charAt(0)}
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                      CAT_COLORS[s.category] ?? CAT_COLORS.general)}>
                      {s.category}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Link href={`/societies/${s.id}`}>
                      <h3 className="font-semibold group-hover:text-[rgb(var(--primary))] transition-colors">{s.name}</h3>
                    </Link>
                    {s.university && (
                      <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />{s.university.short_name}
                      </p>
                    )}
                    {s.description && (
                      <p className="text-xs text-[rgb(var(--muted-fg))] mt-1.5 line-clamp-2">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))]">
                      <Users className="w-3.5 h-3.5" /> {s.member_count}
                    </span>
                    {joinedIds.has(s.id) ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-current" /> Following
                      </span>
                    ) : (
                      <button onClick={() => join(s.id)} disabled={joining === s.id}
                        className="text-xs px-4 py-1.5 rounded-lg bg-[rgb(var(--primary))] text-white font-medium hover:opacity-90 transition-all disabled:opacity-40">
                        {joining === s.id ? "Following…" : "Follow"}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Events Tab ──────────────────────────────────────────────────────────── */}
      {tab === "events" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))] pointer-events-none" />
              <input value={eventSearch} onChange={e => setEventSearch(e.target.value)}
                placeholder="Search posts…"
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
            <button
              onClick={() => setShowUpcomingOnly(p => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 h-10 rounded-xl text-sm font-medium transition-all border flex-shrink-0",
                showUpcomingOnly
                  ? "bg-[rgb(var(--primary))] text-white border-transparent"
                  : "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)]"
              )}
            >
              <Clock className="w-4 h-4" /> Upcoming only
            </button>
            <div className="sm:ml-auto text-xs text-[rgb(var(--muted-fg))] px-1">
              Showing posts from <span className="text-[rgb(var(--fg))] font-bold">{joinedIds.size}</span> societies you follow
            </div>
          </div>

          {events.length === 0 && !eventsLoading ? (
            <div className="theme-card p-12 text-center">
              <Calendar className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No posts found</p>
              <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
                {joinedIds.size === 0 
                  ? "Follow some societies to see their updates here!" 
                  : "The societies you follow haven't posted anything yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((ev, i) => {
                const upcoming = isUpcoming(ev.event_date);
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className={cn(
                      "theme-card p-0 overflow-hidden flex flex-col sm:flex-row hover:border-[rgb(var(--primary)/0.3)] transition-all group",
                      upcoming && "border-[rgb(var(--primary)/0.2)]"
                    )}
                  >
                    {ev.image_url && (
                      <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-[rgb(var(--muted))]">
                        <img src={ev.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden">
                            {ev.society?.logo_url
                              ? <img src={ev.society.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                              : (ev.society?.name.charAt(0) ?? "?")}
                          </div>
                          <div>
                            <Link href={`/societies/${ev.society?.id}`} className="font-bold text-sm hover:text-[rgb(var(--primary))] transition-colors">
                              {ev.society?.name}
                            </Link>
                            <p className="text-[10px] text-[rgb(var(--muted-fg))] flex items-center gap-1">
                              {ev.author?.full_name} · {new Date(ev.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {upcoming && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Upcoming
                            </span>
                          )}
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                            ev.type === "announcement" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            ev.type === "event" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                            "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
                          )}>
                            {ev.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        {ev.title && <h3 className="font-bold text-lg mb-1 leading-tight">{ev.title}</h3>}
                        <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed line-clamp-3">{ev.content}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[rgb(var(--border))] flex items-center justify-between">
                        {ev.event_date ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--primary))]">
                            <Calendar className="w-4 h-4" />
                            {formatEventDate(ev.event_date)}
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-3">
                           <button className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
                             <Star className="w-4 h-4" /> {ev.likes}
                           </button>
                           <Link href={`/societies/${ev.society?.id}`} className="text-xs font-bold text-[rgb(var(--primary))] hover:opacity-80 flex items-center gap-1">
                             View Details <ExternalLink className="w-3 h-3" />
                           </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* End of list trigger */}
              <div id="events-end-trigger" className="h-10 flex items-center justify-center">
                {eventsLoading && hasMoreEvents && (
                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-fg))]">
                    <div className="w-4 h-4 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                    Loading more updates…
                  </div>
                )}
                {!hasMoreEvents && events.length > 0 && (
                  <p className="text-xs text-[rgb(var(--muted-fg))]">You&apos;ve reached the end of the feed.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
