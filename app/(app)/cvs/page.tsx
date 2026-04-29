"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileUser, Plus, Download, Eye, Briefcase,
  GraduationCap, MapPin, Star, Search, Upload,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface CV {
  id: string;
  user_id: string;
  file_url: string | null;
  headline: string | null;
  skills: string[];
  preferred_roles: string[];
  preferred_cities: string[];
  availability: string | null;
  visibility: "public" | "employers_only" | "private";
  views: number;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
    department: string | null;
    year_of_study: number | null;
    university?: { name: string; short_name: string } | null;
  };
}

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate:    "Available Now",
  one_month:    "1 Month Notice",
  three_months: "3 Months Notice",
  not_looking:  "Not Looking",
};

export default function CVsPage() {
  const supabase = createClient();
  const [myId, setMyId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("student");
  const [myCv, setMyCv] = useState<CV | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setMyId(user.id);

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      const userRole = profile?.role ?? "student";
      setRole(userRole);

      // Always load own CV for students
      if (userRole === "student") {
        const { data: own } = await supabase
          .from("cvs").select("*").eq("user_id", user.id).maybeSingle();
        setMyCv(own as CV | null);
      }

      // Load all public CVs for browsing
      const visibilities: ("public" | "employers_only" | "private")[] = userRole === "employer" || userRole === "admin"
        ? ["public", "employers_only"]
        : ["public"];

      const { data } = await supabase
        .from("cvs")
        .select(`*, profile:profiles!user_id(full_name, avatar_url, department, year_of_study, university:universities!university_id(name, short_name))`)
        .in("visibility", visibilities)
        .order("created_at", { ascending: false })
        .limit(60);

      // For students, exclude their own CV from the listing (shown separately above)
      const list = (data as CV[] ?? []).filter(c => c.user_id !== user.id);
      setCvs(list);
      setLoading(false);
    })();
  }, []);

  const filteredCvs = cvs.filter(cv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (cv.profile?.full_name ?? "").toLowerCase().includes(q) ||
      cv.skills.some(s => s.toLowerCase().includes(q)) ||
      (cv.profile?.university?.short_name ?? "").toLowerCase().includes(q) ||
      (cv.headline ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-[rgb(var(--muted))] rounded w-32" />
        <div className="h-28 bg-[rgb(var(--muted))] rounded-2xl" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="theme-card p-5 h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">CVs</h1>
        <p className="text-[rgb(var(--muted-fg))]">Upload your CV and browse student profiles.</p>
      </motion.div>

      {/* ── My CV section (students only) ── */}
      {role === "student" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {myCv ? (
            <div className="theme-card p-5 flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                <FileUser className="w-6 h-6 text-[rgb(var(--primary))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{myCv.headline || "My Resume"}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-[rgb(var(--muted-fg))] flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {myCv.views} views
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--muted))]">
                    {myCv.visibility === "public" ? "Public" : myCv.visibility === "employers_only" ? "Employers only" : "Private"}
                  </span>
                  {myCv.availability && AVAILABILITY_LABELS[myCv.availability] && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      {AVAILABILITY_LABELS[myCv.availability]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {myCv.file_url && (
                  <a href={myCv.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity">
                    <Download className="w-4 h-4" /> Download
                  </a>
                )}
                <Link href="/cvs/upload"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors">
                  <Upload className="w-4 h-4" /> Update
                </Link>
              </div>
            </div>
          ) : (
            <div className="theme-card p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                <FileUser className="w-6 h-6 text-[rgb(var(--primary))]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">You haven&apos;t uploaded a CV yet</p>
                <p className="text-sm text-[rgb(var(--muted-fg))]">Upload your CV so employers can find you by skills, university, and availability.</p>
              </div>
              <Link href="/cvs/upload"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-[rgb(var(--primary))] text-white font-medium hover:opacity-90 transition-opacity flex-shrink-0">
                <Plus className="w-4 h-4" /> Upload CV
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Browse all CVs ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-bold">Browse CVs
            <span className="ml-2 text-sm font-normal text-[rgb(var(--muted-fg))]">{filteredCvs.length} students</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, university, skill…"
              className={cn("w-full h-10 pl-10 pr-4 rounded-xl text-sm",
                "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]")} />
          </div>
        </div>

        {filteredCvs.length === 0 ? (
          <div className="theme-card p-12 text-center">
            <FileUser className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
            <p className="text-[rgb(var(--muted-fg))]">No CVs found{search ? ` for "${search}"` : ""}.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCvs.map((cv, i) => (
              <CvCard key={cv.id} cv={cv} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CvCard({ cv, index }: { cv: CV; index: number }) {
  const supabase = createClient();
  const profile = cv.profile;
  const initials = profile?.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}>
      <div className="theme-card p-5 flex flex-col gap-3 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-white">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile?.full_name ?? "Student"}</p>
            {profile?.university && (
              <p className="text-xs text-[rgb(var(--primary))]">{profile.university.short_name}</p>
            )}
          </div>
        </div>

        {cv.headline && (
          <p className="text-xs text-[rgb(var(--muted-fg))] line-clamp-2">{cv.headline}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted-fg))]">
          {profile?.department && (
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{profile.department}</span>
          )}
          {cv.preferred_cities.length > 0 && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cv.preferred_cities[0]}</span>
          )}
          {cv.preferred_roles.length > 0 && (
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{cv.preferred_roles[0]}</span>
          )}
        </div>

        {cv.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cv.skills.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">{s}</span>
            ))}
            {cv.skills.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">+{cv.skills.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
          {cv.availability && AVAILABILITY_LABELS[cv.availability] ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
              {AVAILABILITY_LABELS[cv.availability]}
            </span>
          ) : <span />}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[rgb(var(--muted-fg))] flex items-center gap-1">
              <Eye className="w-3 h-3" />{cv.views}
            </span>
            {cv.file_url && (
              <a href={cv.file_url} target="_blank" rel="noopener noreferrer"
                onClick={async () => { await supabase.from("cvs").update({ views: cv.views + 1 }).eq("id", cv.id); }}
                className="flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline">
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
