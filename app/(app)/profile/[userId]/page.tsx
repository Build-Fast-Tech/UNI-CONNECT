"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, GitBranch, Link2, Globe, GraduationCap,
  MapPin, Calendar, ExternalLink, UserCheck, MessageCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type University = Database["public"]["Tables"]["universities"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate"];

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isSocietyHead, setIsSocietyHead] = useState(false);
  const [friendship, setFriendship] = useState<{ id: string; sender_id: string; receiver_id: string; status: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data: profileData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ]);

      if (user?.id === userId) setIsOwnProfile(true);

      if (user) {
        setCurrentUserId(user.id);
        if (user.id !== userId) {
          const { data: friendData } = await supabase
            .from("friend_requests")
            .select("id, sender_id, receiver_id, status")
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
            .maybeSingle();

          setFriendship(friendData as any);
        }
      }

      if (profileData) {
        setProfile(profileData);
        await Promise.all([
          profileData.university_id
            ? Promise.resolve(supabase.from("universities").select("*").eq("id", profileData.university_id).single())
                .then(({ data }) => setUniversity(data))
            : Promise.resolve(),
          profileData.branch_id
            ? Promise.resolve(supabase.from("branches").select("*").eq("id", profileData.branch_id).single())
                .then(({ data }) => setBranch(data))
            : Promise.resolve(),
        ]);

        // Check if employer (role === "employer" or has posted jobs)
        if (profileData.role === "employer") {
          setIsEmployer(true);
        } else {
          (supabase as any).from("jobs").select("id", { count: "exact", head: true }).eq("employer_id", profileData.id)
            .then(({ count }: any) => { if ((count ?? 0) > 0) setIsEmployer(true); });
        }

        // Check if society head
        (supabase as any).from("societies").select("id", { count: "exact", head: true }).eq("admin_id", profileData.id).eq("status", "approved")
          .then(({ count }: any) => { if ((count ?? 0) > 0) setIsSocietyHead(true); });
      }
      setLoading(false);
    })();
  }, [userId]);
  const handleAddFriend = async () => {
    if (!currentUserId || actionLoading) return;
    setActionLoading(true);
    const { data } = await supabase
      .from("friend_requests")
      .insert({
        sender_id: currentUserId,
        receiver_id: userId,
        status: "pending"
      })
      .select()
      .single();
    if (data) setFriendship(data as any);
    setActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!friendship || actionLoading) return;
    setActionLoading(true);
    const { data } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", friendship.id)
      .select()
      .single();
    if (data) setFriendship(data as any);
    setActionLoading(false);
  };

  const handleCancelOrRemove = async () => {
    if (!friendship || actionLoading) return;
    setActionLoading(true);
    await supabase
      .from("friend_requests")
      .delete()
      .eq("id", friendship.id);
    setFriendship(null);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="theme-card p-6 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[rgb(var(--muted))]" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-5 bg-[rgb(var(--muted))] rounded w-1/2" />
                <div className="h-4 bg-[rgb(var(--muted))] rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="theme-card p-12 text-center">
          <p className="text-[rgb(var(--muted-fg))]">User not found.</p>
        </div>
      </div>
    );
  }

  const initials = profile.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-card p-6"
      >
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center flex-shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{profile.full_name}</h1>
                {profile.username && (
                  <p className="text-sm text-[rgb(var(--muted-fg))]">@{profile.username}</p>
                )}
              </div>
              {isOwnProfile ? (
                <Link href="/profile">
                  <button className="text-xs text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.3)] px-3 py-1.5 rounded-lg hover:bg-[rgb(var(--primary)/0.08)] transition-colors">
                    Edit profile
                  </button>
                </Link>
              ) : (
                <div className="flex gap-2">
                  {/* Friend Request Button */}
                  {(() => {
                    if (!friendship) {
                      return (
                        <button
                          onClick={handleAddFriend}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 text-xs border border-[rgb(var(--primary)/0.3)] text-[rgb(var(--primary))] px-3 py-1.5 rounded-lg hover:bg-[rgb(var(--primary)/0.08)] transition-colors disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Friend
                        </button>
                      );
                    }
                    if (friendship.status === "pending") {
                      if (friendship.sender_id === currentUserId) {
                        return (
                          <button
                            onClick={handleCancelOrRemove}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 text-xs border border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] px-3 py-1.5 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-50"
                          >
                            Cancel Request
                          </button>
                        );
                      } else {
                        return (
                          <button
                            onClick={handleAcceptRequest}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 text-xs bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            Accept Request
                          </button>
                        );
                      }
                    }
                    if (friendship.status === "accepted") {
                      return (
                        <button
                          onClick={handleCancelOrRemove}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-transparent transition-colors disabled:opacity-50"
                        >
                          Friends
                        </button>
                      );
                    }
                    return null;
                  })()}

                  <Link href={`/inbox?dm=${userId}`}>
                    <button className="flex items-center gap-1.5 text-xs bg-[rgb(var(--muted))] text-[rgb(var(--fg))] px-3 py-1.5 rounded-lg hover:bg-[rgb(var(--border))] transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" /> Message
                    </button>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {university && (
                <Link
                  href={`/universities/${university.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] transition-colors"
                >
                  <GraduationCap className="w-3 h-3" />
                  {university.short_name}
                </Link>
              )}
              {branch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                  <MapPin className="w-3 h-3" />
                  {branch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-[rgb(var(--muted-fg))] leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          {profile.department && (
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))]">
              <BookOpen className="w-3.5 h-3.5" />
              {profile.department}
            </span>
          )}
          {profile.year_of_study && (
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))]">
              <Calendar className="w-3.5 h-3.5" />
              {YEARS[(profile.year_of_study - 1)] || `Year ${profile.year_of_study}`}
            </span>
          )}
          {branch && (
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))]">
              <MapPin className="w-3.5 h-3.5" />
              {branch.name}
            </span>
          )}
          {profile.is_verified && (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--primary)/0.12)] text-[rgb(var(--primary))]">
              <UserCheck className="w-3 h-3" /> Verified
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {profile.role === "admin" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] font-medium capitalize">
                Admin
              </span>
            )}
            {profile.role === "moderator" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))] font-medium capitalize">
                Moderator
              </span>
            )}
            {isEmployer && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium capitalize">
                Employer
              </span>
            )}
            {isSocietyHead && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium capitalize">
                Society Head
              </span>
            )}
            {profile.role !== "admin" && profile.role !== "moderator" && !isEmployer && !isSocietyHead && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] capitalize">
                Student
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="theme-card p-6"
      >
        <h2 className="text-sm font-semibold mb-4">Links</h2>
        <div className="space-y-2">
          {[
            { label: "LinkedIn",  value: profile.linkedin,      icon: Link2 },
            { label: "GitHub",    value: profile.github,        icon: GitBranch },
            { label: "Portfolio", value: profile.portfolio_url, icon: Globe },
          ].filter(l => l.value).map(({ label, value, icon: Icon }) => (
            <a
              key={label}
              href={value!.startsWith("http") ? value! : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-[rgb(var(--primary))] hover:underline"
            >
              <Icon className="w-4 h-4" />
              {label}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          ))}
          {!profile.linkedin && !profile.github && !profile.portfolio_url && (
            <p className="text-sm text-[rgb(var(--muted-fg))]">No links added yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
