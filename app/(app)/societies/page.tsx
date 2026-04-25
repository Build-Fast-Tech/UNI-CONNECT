"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Building2, Plus, Star } from "lucide-react";
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

export default function SocietiesPage() {
  const supabase = createClient();
  const { userId } = useCurrentUser();
  const [universities, setUniversities] = useState<University[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedUni, setSelectedUni] = useState<string>("all");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from("societies")
      .select("id, name, description, category, member_count, logo_url, university:universities!university_id(name, short_name)")
      .eq("status", "approved")
      .order("member_count", { ascending: false });
    if (selectedUni !== "all") q = q.eq("university_id", selectedUni);
    q.then(({ data }) => { setSocieties((data as unknown as Society[]) ?? []); setLoading(false); });
  }, [selectedUni]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("society_members").select("society_id").eq("user_id", userId)
      .then(({ data }) => setJoinedIds(new Set((data ?? []).map(m => m.society_id))));
  }, [userId]);

  const join = async (societyId: string) => {
    if (!userId) return;
    setJoining(societyId);
    await supabase.from("society_members").insert({ society_id: societyId, user_id: userId });
    const society = societies.find(s => s.id === societyId);
    if (society) {
      await supabase.from("societies").update({ member_count: society.member_count + 1 }).eq("id", societyId);
      setSocieties(p => p.map(s => s.id === societyId ? { ...s, member_count: s.member_count + 1 } : s));
    }
    setJoinedIds(p => new Set([...p, societyId]));
    setJoining(null);
  };

  const filtered = societies.filter(s => {
    const matchCat = category === "All" || s.category === category;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-[rgb(var(--primary))]" /> Societies
          </h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-0.5">Browse and join university societies</p>
        </div>
        <Link
          href="/societies/register"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Register Society
        </Link>
      </div>

      {/* University selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setSelectedUni("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors border",
            selectedUni === "all"
              ? "bg-[rgb(var(--primary))] text-white border-transparent"
              : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
          )}>
          All Universities
        </button>
        {universities.map(u => (
          <button key={u.id} onClick={() => setSelectedUni(u.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors border",
              selectedUni === u.id
                ? "bg-[rgb(var(--primary))] text-white border-transparent"
                : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
            )}>
            {u.short_name}
          </button>
        ))}
      </div>

      {/* Category + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-colors capitalize",
                category === c
                  ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}>
              {c}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search societies…"
            className="w-full sm:w-56 h-9 pl-9 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl bg-[rgb(var(--muted))] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-card p-12 text-center">
          <Users className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No societies found</p>
          <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">Try a different filter or register your own!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="theme-card p-5 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {s.logo_url
                    ? <img src={s.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                    : s.name.charAt(0)}
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                  CAT_COLORS[s.category] ?? CAT_COLORS.general
                )}>
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
                  <Users className="w-3.5 h-3.5" /> {s.member_count} members
                </span>
                {joinedIds.has(s.id) ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <Star className="w-3.5 h-3.5 fill-current" /> Joined
                  </span>
                ) : (
                  <button
                    onClick={() => join(s.id)}
                    disabled={joining === s.id}
                    className="text-xs px-3 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium hover:bg-[rgb(var(--primary)/0.2)] transition-colors disabled:opacity-40"
                  >
                    {joining === s.id ? "Joining…" : "Join"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
