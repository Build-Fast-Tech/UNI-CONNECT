"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Globe, Users, Calendar, GraduationCap,
  MessageSquare, BookOpen, UserCheck, ExternalLink, ArrowLeft, ArrowRight,
  Download, ThumbsUp, Upload,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type University = Database["public"]["Tables"]["universities"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Note = Database["public"]["Tables"]["notes"]["Row"];

const TABS = [
  { id: "chat",    label: "Chat",    icon: MessageSquare },
  { id: "notes",   label: "Notes",   icon: BookOpen },
  { id: "members", label: "Members", icon: Users },
] as const;

type TabId = typeof TABS[number]["id"];

export default function UniversityHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [uni, setUni] = useState<University | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("chat");
  const [isMember, setIsMember] = useState(false);
  const [uniChannelId, setUniChannelId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: uniData }, { data: { user } }] = await Promise.all([
        supabase.from("universities").select("*").eq("slug", slug).single(),
        supabase.auth.getUser(),
      ]);

      if (!uniData) { setLoading(false); return; }
      setUni(uniData);

      const [{ data: membersData }, { data: notesData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("university_id", uniData.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("notes")
          .select("*")
          .eq("university_id", uniData.id)
          .eq("status", "published")
          .order("downloads", { ascending: false })
          .limit(20),
      ]);

      setMembers(membersData || []);
      setNotes(notesData || []);

      // Resolve (or create) the one university chat channel
      let { data: channel } = await supabase
        .from("channels")
        .select("id")
        .eq("type", "university")
        .eq("university_id", uniData.id)
        .single();

      if (!channel) {
        const { data: created } = await supabase
          .from("channels")
          .insert({ type: "university", university_id: uniData.id, name: `${uniData.short_name} Chat` })
          .select("id")
          .single();
        channel = created;
      }
      if (channel) setUniChannelId(channel.id);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .single();
        setIsMember(profile?.university_id === uniData.id);
      }

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="theme-card h-40 animate-pulse" />
        <div className="theme-card p-6 animate-pulse">
          <div className="h-6 bg-[rgb(var(--muted))] rounded w-1/3 mb-2" />
          <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!uni) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="theme-card p-12 text-center">
          <GraduationCap className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
          <p className="text-[rgb(var(--muted-fg))]">University not found.</p>
          <Link href="/universities" className="mt-4 inline-flex items-center gap-2 text-sm text-[rgb(var(--primary))] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to universities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/universities"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All universities
      </Link>

      {/* Cover + header card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="theme-card overflow-hidden">
        {/* Cover banner */}
        <div
          className="h-32 sm:h-44 w-full relative"
          style={{
            background: uni.cover_url
              ? `url(${uni.cover_url}) center/cover`
              : `linear-gradient(135deg, rgb(var(--primary)/0.6), rgb(var(--accent)/0.4))`,
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Info row */}
        <div className="p-6">
          <div className="flex items-end gap-4 -mt-14 mb-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[rgb(var(--card))] border-4 border-[rgb(var(--card))] flex-shrink-0 z-10 relative">
              {uni.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uni.logo_url} alt={uni.short_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{uni.short_name.slice(0, 3)}</span>
                </div>
              )}
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

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm text-[rgb(var(--muted-fg))]">
            {uni.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {uni.city}
                {uni.province && `, ${uni.province}`}
              </span>
            )}
            {uni.total_students && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {uni.total_students.toLocaleString()} students
              </span>
            )}
            {uni.founding_year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Est. {uni.founding_year}
              </span>
            )}
            {uni.website && (
              <a
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[rgb(var(--primary))] hover:underline"
              >
                <Globe className="w-4 h-4" /> Website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {members.length} member{members.length !== 1 ? "s" : ""} on UniConnect
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="theme-card overflow-hidden"
      >
        {/* Tab bar */}
        <div className="flex border-b border-[rgb(var(--border))]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px",
                tab === id
                  ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))]"
                  : "border-transparent text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === "members" && members.length > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-[rgb(var(--muted))]">
                  {members.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === "chat" && (
            <div className="flex flex-col items-center text-center py-10 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[rgb(var(--primary))]" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">
                  {uni?.short_name} Chat Room
                </p>
                <p className="text-sm text-[rgb(var(--muted-fg))] max-w-sm">
                  One shared chat for all {uni?.short_name} students. Your campus badge
                  is shown next to your name so everyone knows which branch you&apos;re from.
                </p>
              </div>
              {uniChannelId ? (
                <Link
                  href={`/chat/${uniChannelId}`}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                    "bg-[rgb(var(--primary))] text-white hover:opacity-90 active:scale-95"
                  )}
                >
                  Open Chat <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="h-10 w-32 rounded-xl bg-[rgb(var(--muted))] animate-pulse" />
              )}
              <p className="text-xs text-[rgb(var(--muted-fg))]">
                {members.length} member{members.length !== 1 ? "s" : ""} · campus badge shown on every message
              </p>
            </div>
          )}

          {tab === "notes" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[rgb(var(--muted-fg))]">
                  {notes.length > 0
                    ? `${notes.length} note${notes.length !== 1 ? "s" : ""} from ${uni.short_name} students`
                    : `No notes from ${uni.short_name} yet`}
                </p>
                <Link
                  href="/notes/upload"
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </Link>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
                  <p className="text-sm text-[rgb(var(--muted-fg))] mb-3">
                    Be the first to share notes from {uni.short_name}!
                  </p>
                  <Link
                    href="/notes"
                    className="text-sm text-[rgb(var(--primary))] hover:underline inline-flex items-center gap-1"
                  >
                    Browse all notes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--muted)/0.5)] transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-[rgb(var(--primary))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-[rgb(var(--primary))] transition-colors">
                          {note.title}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">
                          {note.subject}{note.semester ? ` · ${note.semester}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-fg))] flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" /> {note.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {note.upvotes}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "members" && (
            <>
              {members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
                  <p className="text-[rgb(var(--muted-fg))]">No members yet. Be the first!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {members.map((m, i) => (
                    <MemberCard key={m.id} profile={m} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MemberCard({ profile, index }: { profile: Profile; index: number }) {
  const initials = profile.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        href={`/profile/${profile.id}`}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgb(var(--muted)/0.5)] transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-[rgb(var(--primary))] transition-colors">
            {profile.full_name}
          </p>
          {profile.department && (
            <p className="text-xs text-[rgb(var(--muted-fg))] truncate">{profile.department}</p>
          )}
        </div>
        {profile.is_verified && (
          <UserCheck className="w-4 h-4 text-[rgb(var(--primary))] flex-shrink-0" />
        )}
      </Link>
    </motion.div>
  );
}
