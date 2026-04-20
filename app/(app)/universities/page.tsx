"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, GraduationCap, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type University = Database["public"]["Tables"]["universities"]["Row"];

const PROVINCES = ["All", "Punjab", "Sindh", "KPK", "Balochistan", "Islamabad", "AJK", "GB"];

export default function UniversitiesPage() {
  const supabase = createClient();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("All");

  useEffect(() => {
    supabase
      .from("universities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name")
      .then(({ data }) => {
        setUniversities(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return universities.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.short_name.toLowerCase().includes(search.toLowerCase()) ||
        (u.city || "").toLowerCase().includes(search.toLowerCase());
      const matchProvince =
        province === "All" || (u.province || "").toLowerCase() === province.toLowerCase();
      return matchSearch && matchProvince;
    });
  }, [universities, search, province]);

  const featured = filtered.filter(u => u.is_featured);
  const rest = filtered.filter(u => !u.is_featured);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">Universities</h1>
        <p className="text-[rgb(var(--muted-fg))]">
          Explore {universities.length > 0 ? universities.length : ""} Pakistani universities on UniConnect.
        </p>
      </motion.div>

      {/* Search + filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search NUST, LUMS, FAST…"
            className={cn(
              "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
              "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
              "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
              "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
            )}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {PROVINCES.map(p => (
            <button
              key={p}
              onClick={() => setProvince(p)}
              className={cn(
                "px-4 h-11 rounded-xl text-sm font-medium flex-shrink-0 transition-all duration-200",
                province === p
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted)/0.7)]"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="theme-card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--muted))]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4" />
                  <div className="h-3 bg-[rgb(var(--muted))] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && search === "" && province === "All" && (
            <section>
              <h2 className="text-sm font-semibold text-[rgb(var(--muted-fg))] uppercase tracking-wider mb-3">
                Featured
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((uni, i) => (
                  <UniversityCard key={uni.id} uni={uni} index={i} featured />
                ))}
              </div>
            </section>
          )}

          {/* All results */}
          {rest.length > 0 || (featured.length === 0) ? (
            <section>
              {featured.length > 0 && search === "" && province === "All" && (
                <h2 className="text-sm font-semibold text-[rgb(var(--muted-fg))] uppercase tracking-wider mb-3">
                  All Universities
                </h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(search !== "" || province !== "All" ? filtered : rest).map((uni, i) => (
                  <UniversityCard key={uni.id} uni={uni} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {filtered.length === 0 && (
            <div className="theme-card p-12 text-center">
              <GraduationCap className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
              <p className="text-[rgb(var(--muted-fg))]">No universities found for &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UniversityCard({
  uni,
  index,
  featured = false,
}: {
  uni: University;
  index: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        href={`/universities/${uni.slug}`}
        className={cn(
          "theme-card p-5 flex flex-col gap-3 h-full",
          "hover:border-[rgb(var(--primary)/0.3)] hover:shadow-lg transition-all duration-200 group"
        )}
      >
        {/* Logo / initials */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            {uni.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={uni.logo_url} alt={uni.short_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{uni.short_name.slice(0, 3)}</span>
            )}
          </div>
          {featured && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] font-medium flex-shrink-0">
              Featured
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight group-hover:text-[rgb(var(--primary))] transition-colors">
            {uni.name}
          </h3>
          <p className="text-xs text-[rgb(var(--primary))] font-medium mt-0.5">{uni.short_name}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-fg))]">
          {uni.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {uni.city}
            </span>
          )}
          {uni.website && (
            <span className="ml-auto flex items-center gap-1 text-[rgb(var(--primary))]">
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
