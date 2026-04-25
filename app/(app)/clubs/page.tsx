"use client";

import { useState, useEffect } from "react";
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

  // Load universities once
  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

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

  // Load events when tab=events
  useEffect(() => {
    if (tab !== "events") return;
    setEventsLoading(true);
    supabase
      .from("society_posts")
      .select("id, title, content, type, event_date, image_url, likes, created_at, society:societies!society_id(id, name, logo_url), author:profiles!author_id(full_name, avatar_url)")
      .in("type", ["event", "announcement"])
      .order("event_date", { ascending: true, nullsFirst: false })
      .limit(50)
      .then(({ data }) => { setEvents((data as unknown as Event[]) ?? []); setEventsLoading(false); });
  }, [tab]);

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
          <Calendar className="w-4 h-4" /> Events
        </button>
      </div>

      {/* ── Societies Tab ───────────────────────────────────────────────────────── */}
      {tab === "societies" && (
        <>
          {/* University selector */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setSelectedUni("all")}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors border",
                selectedUni === "all"
                  ? "bg-[rgb(var(--primary))] text-white border-transparent"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
              All Universities
            </button>
            {universities.map(u => (
              <button key={u.id} onClick={() => setSelectedUni(u.id)}
                className={cn("px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors border",
                  selectedUni === u.id
                    ? "bg-[rgb(var(--primary))] text-white border-transparent"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]")}>
                {u.short_name}
              </button>
            ))}
          </div>

          {/* Category filter + search */}
          <div className="flex flex-col sm:flex-row gap-3">
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
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input value={societySearch} onChange={e => setSocietySearch(e.target.value)}
                placeholder="Search societies…"
                className="w-full sm:w-56 h-9 pl-9 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
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
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <Star className="w-3.5 h-3.5 fill-current" /> Joined
                      </span>
                    ) : (
                      <button onClick={() => join(s.id)} disabled={joining === s.id}
                        className="text-xs px-3 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium hover:bg-[rgb(var(--primary)/0.2)] transition-colors disabled:opacity-40">
                        {joining === s.id ? "Joining…" : "Join"}
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
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input value={eventSearch} onChange={e => setEventSearch(e.target.value)}
                placeholder="Search events…"
                className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]" />
            </div>
            <button
              onClick={() => setShowUpcomingOnly(p => !p)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                showUpcomingOnly
                  ? "bg-[rgb(var(--primary))] text-white border-transparent"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
              )}
            >
              <Clock className="w-4 h-4" /> Upcoming only
            </button>
          </div>

          {eventsLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="theme-card p-12 text-center">
              <Calendar className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No events found</p>
              <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
                Societies haven&apos;t posted any events yet. Join a society to stay updated!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev, i) => {
                const upcoming = isUpcoming(ev.event_date);
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className={cn(
                      "theme-card p-5 flex gap-4",
                      upcoming && "border-[rgb(var(--primary)/0.2)]"
                    )}
                  >
                    {/* Society logo */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                      {ev.society?.logo_url
                        ? <img src={ev.society.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                        : (ev.society?.name.charAt(0) ?? "?")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          {ev.title && <h3 className="font-semibold text-sm">{ev.title}</h3>}
                          <p className="text-xs text-[rgb(var(--muted-fg))] mt-0.5">
                            {ev.society && (
                              <Link href={`/societies/${ev.society.id}`}
                                className="text-[rgb(var(--primary))] hover:underline font-medium">
                                {ev.society.name}
                              </Link>
                            )}
                            {ev.author && <span> · by {ev.author.full_name}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {upcoming && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]">
                              Upcoming
                            </span>
                          )}
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                            ev.type === "announcement"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {ev.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[rgb(var(--muted-fg))] line-clamp-2">{ev.content}</p>

                      {ev.event_date && (
                        <p className="text-xs text-[rgb(var(--primary))] mt-2 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatEventDate(ev.event_date)}
                          {upcoming && (
                            <span className="text-[rgb(var(--muted-fg))] font-normal ml-1">
                              · in {Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / 86400000)}d
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
