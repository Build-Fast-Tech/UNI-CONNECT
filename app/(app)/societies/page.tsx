"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Search, Building2, Plus, Star, Zap, Trash2, Pencil, MoreHorizontal, X, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface University { id: string; name: string; short_name: string; }
interface Society {
  id: string; name: string; description: string | null;
  category: string; member_count: number; follower_count: number; logo_url: string | null;
  visibility: string;
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
  const { userId, role } = useCurrentUser();
  const isPlatformAdmin = role === "admin";
  const [universities, setUniversities] = useState<University[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set()); // societies where user is admin_id
  const [selectedUni, setSelectedUni] = useState<string>("all");
  const [uniSearch, setUniSearch] = useState("");
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<string | null>(null);
  // Delete / edit state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  // Edit modal state
  const [editingSociety, setEditingSociety] = useState<Society | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [saving, setSaving] = useState(false);

  // Close uni dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setUniDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredUnis = universities.filter(u =>
    !uniSearch || u.name.toLowerCase().includes(uniSearch.toLowerCase()) || u.short_name.toLowerCase().includes(uniSearch.toLowerCase())
  );
  const selectedUniLabel = selectedUni === "all" ? "All Universities" : (universities.find(u => u.id === selectedUni)?.short_name ?? "All Universities");

  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = (supabase as any)
      .from("societies")
      .select("id, name, description, category, member_count, follower_count, logo_url, visibility, university:universities!university_id(name, short_name)")
      .eq("status", "approved")
      .order("follower_count", { ascending: false });
    if (selectedUni !== "all") q = q.eq("university_id", selectedUni);
    q.then(({ data }: { data: Society[] | null }) => { setSocieties((data as unknown as Society[]) ?? []); setLoading(false); });
  }, [selectedUni]);

  useEffect(() => {
    if (!userId) return;
    (supabase as any).from("society_members").select("society_id").eq("user_id", userId)
      .then(({ data }: { data: { society_id: string }[] | null }) =>
        setJoinedIds(new Set((data ?? []).map(m => m.society_id))));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    (supabase as any).from("society_followers").select("society_id").eq("user_id", userId)
      .then(({ data }: { data: { society_id: string }[] | null }) =>
        setFollowedIds(new Set((data ?? []).map(m => m.society_id))));
  }, [userId]);

  // Load societies where user is the admin_id
  useEffect(() => {
    if (!userId) return;
    supabase.from("societies").select("id").eq("admin_id", userId)
      .then(({ data }) => setAdminIds(new Set((data ?? []).map((s: any) => s.id))));
  }, [userId]);

  // Close action menu on outside click
  useEffect(() => {
    const h = () => setMenuOpen(null);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const deleteSociety = async (societyId: string) => {
    setDeleting(societyId);
    await supabase.from("societies").delete().eq("id", societyId);
    setSocieties(p => p.filter(s => s.id !== societyId));
    setConfirmDelete(null);
    setDeleting(null);
    setMenuOpen(null);
  };

  const openEdit = (s: Society) => {
    setEditingSociety(s);
    setEditName(s.name);
    setEditDesc(s.description ?? "");
    setEditCategory(s.category);
    setEditVisibility(s.visibility ?? "public");
    setMenuOpen(null);
  };

  const saveEdit = async () => {
    if (!editingSociety) return;
    setSaving(true);
    await (supabase as any).from("societies").update({
      name: editName.trim(),
      description: editDesc.trim() || null,
      category: editCategory,
      visibility: editVisibility,
    }).eq("id", editingSociety.id);
    setSocieties(p => p.map(s => s.id === editingSociety.id
      ? { ...s, name: editName.trim(), description: editDesc.trim() || null, category: editCategory }
      : s
    ));
    setSaving(false);
    setEditingSociety(null);
  };

  const join = async (societyId: string) => {
    if (!userId) return;
    setJoining(societyId);
    await (supabase as any).from("society_members").insert({ society_id: societyId, user_id: userId });
    const society = societies.find(s => s.id === societyId);
    if (society) {
      await supabase.from("societies").update({ member_count: society.member_count + 1 }).eq("id", societyId);
      setSocieties(p => p.map(s => s.id === societyId ? { ...s, member_count: s.member_count + 1 } : s));
    }
    setJoinedIds(p => new Set([...p, societyId]));
    setJoining(null);
  };

  const toggleFollow = useCallback(async (societyId: string) => {
    if (!userId) return;
    // Optimistic UI: update immediately, sync in background
    const wasFollowed = followedIds.has(societyId);
    setFollowedIds(p => {
      const n = new Set(p);
      wasFollowed ? n.delete(societyId) : n.add(societyId);
      return n;
    });
    setFollowing(societyId);
    if (wasFollowed) {
      await (supabase as any).from("society_followers").delete()
        .eq("society_id", societyId).eq("user_id", userId);
    } else {
      await (supabase as any).from("society_followers").insert({ society_id: societyId, user_id: userId });
    }
    setFollowing(null);
  }, [userId, followedIds, supabase]);

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
        <div className="flex items-center gap-2">
          <Link
            href="/societies/feed"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] text-sm font-medium hover:text-[rgb(var(--fg))] transition-colors border border-[rgb(var(--border))]"
          >
            <Zap className="w-4 h-4" /> Feed
          </Link>
          <Link
            href="/societies/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Register Society
          </Link>
        </div>
      </div>

      {/* Search + University filter row */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        {/* Society name search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search societies…"
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          />
        </div>

        {/* Searchable university dropdown */}
        <div ref={uniRef} className="relative w-full sm:w-56 flex-shrink-0">
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
            <span className={cn("truncate", selectedUni !== "all" ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted-fg))]")}>
              {selectedUniLabel}
            </span>
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
          </button>

          {uniDropdownOpen && (
            <div className="absolute top-12 left-0 right-0 z-30 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl overflow-hidden">
              <div className="p-2 border-b border-[rgb(var(--border))]">
                <input
                  autoFocus
                  value={uniSearch}
                  onChange={e => setUniSearch(e.target.value)}
                  placeholder="Type to search…"
                  className="w-full h-8 px-3 rounded-lg text-sm bg-[rgb(var(--muted))] outline-none"
                />
              </div>
              <div className="max-h-52 overflow-y-auto p-1">
                <button
                  onClick={() => { setSelectedUni("all"); setUniSearch(""); setUniDropdownOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedUni === "all"
                      ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] font-medium"
                      : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
                  )}
                >
                  All Universities
                </button>
                {filteredUnis.length === 0 && (
                  <p className="text-xs text-[rgb(var(--muted-fg))] text-center py-3">No results</p>
                )}
                {filteredUnis.map(u => (
                  <button key={u.id}
                    onClick={() => { setSelectedUni(u.id); setUniSearch(""); setUniDropdownOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedUni === u.id
                        ? "bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] font-medium"
                        : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--fg))]"
                    )}
                  >
                    <span className="font-medium">{u.short_name}</span>
                    <span className="text-[rgb(var(--muted-fg))] ml-1.5 text-xs">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category chips */}
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

      {/* University selector (Slider) */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted-fg))] px-1">Filter by University</span>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setSelectedUni("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all border",
              selectedUni === "all"
                ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent shadow-lg shadow-[rgb(var(--primary)/0.2)]"
                : "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)] hover:text-[rgb(var(--fg))]"
            )}>
            All Institutions
          </button>
          {universities.map(u => (
            <button key={u.id} onClick={() => setSelectedUni(u.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all border",
                selectedUni === u.id
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] border-transparent shadow-lg shadow-[rgb(var(--primary)/0.2)]"
                  : "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:border-[rgb(var(--primary)/0.5)] hover:text-[rgb(var(--fg))]"
              )}>
              {u.name}
            </button>
          ))}
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
          {filtered.map((s, i) => {
            const canManage = isPlatformAdmin || adminIds.has(s.id);
            return (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="theme-card p-5 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-colors group relative"
              >
                <Link href={`/societies/${s.id}`} className="absolute inset-0 z-0 rounded-2xl" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-white text-xl font-bold overflow-hidden pointer-events-none">
                    {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : s.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5 pointer-events-none">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", CAT_COLORS[s.category] ?? CAT_COLORS.general)}>
                      {s.category}
                    </span>
                    {canManage && (
                      <div className="relative pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                          className="p-1 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {menuOpen === s.id && (
                          <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl overflow-hidden">
                            <button onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[rgb(var(--muted))] transition-colors">
                              <Pencil className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" /> Edit
                            </button>
                            <button onClick={() => { setConfirmDelete(s.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete confirm */}
                {confirmDelete === s.id && (
                  <div className="absolute inset-0 z-20 rounded-2xl bg-[rgb(var(--card)/0.97)] flex flex-col items-center justify-center gap-3 p-4 border border-red-500/30">
                    <Trash2 className="w-8 h-8 text-red-400" />
                    <p className="text-sm font-semibold text-center">Delete <span className="text-red-400">{s.name}</span>?</p>
                    <p className="text-xs text-[rgb(var(--muted-fg))] text-center">This removes all members and posts. Cannot be undone.</p>
                    <div className="flex gap-2 w-full">
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl bg-[rgb(var(--muted))] text-sm">Cancel</button>
                      <button onClick={() => deleteSociety(s.id)} disabled={deleting === s.id}
                        className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                        {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 block relative z-10 pointer-events-none">
                  <h3 className="font-semibold group-hover:text-[rgb(var(--primary))] transition-colors">{s.name}</h3>
                  {s.university && (
                    <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3" />{s.university.short_name}
                    </p>
                  )}
                  {s.description && <p className="text-xs text-[rgb(var(--muted-fg))] mt-1.5 line-clamp-2">{s.description}</p>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))] relative z-10 pointer-events-none">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))]">
                      <Users className="w-3.5 h-3.5" /> {s.follower_count || 0} followers
                      {s.visibility === "private" && <Lock className="w-3 h-3 ml-1 text-amber-400" />}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-fg))]">
                      <Star className="w-3.5 h-3.5" /> {s.member_count || 0} society users
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    {followedIds.has(s.id) && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <Star className="w-3.5 h-3.5 fill-current" /> Following
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Society Modal */}
      {editingSociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md theme-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Society</h2>
              <button onClick={() => setEditingSociety(null)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1 block">Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={80}
                className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1 block">Description</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} maxLength={500}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1 block">Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]">
                  {["academic","cultural","sports","tech","arts","community","general"].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[rgb(var(--muted-fg))] mb-1 block">Visibility</label>
                <select value={editVisibility} onChange={e => setEditVisibility(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-[rgb(var(--muted))] border border-[rgb(var(--border))] outline-none focus:border-[rgb(var(--primary))]">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditingSociety(null)} className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--muted))] text-sm">Cancel</button>
              <button onClick={saveEdit} disabled={saving || !editName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
