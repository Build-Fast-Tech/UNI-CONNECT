"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Edit2, Save, X, Camera, GitBranch, Link2,
  Globe, GraduationCap, MapPin, Calendar, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type University = Database["public"]["Tables"]["universities"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

export default function MyProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loadingDone, setLoadingDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingDone(true); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setBio(data.bio || "");
        setLinkedin(data.linkedin || "");
        setGithub(data.github || "");
        setPortfolio(data.portfolio_url || "");
        setAvatarPreview(data.avatar_url || "");

        const fetches: Promise<any>[] = [];
        if (data.university_id) {
          fetches.push(
            supabase.from("universities").select("*").eq("id", data.university_id).single()
              .then(({ data: uni }) => setUniversity(uni))
          );
        }
        if (data.branch_id) {
          fetches.push(
            supabase.from("branches").select("*").eq("id", data.branch_id).single()
              .then(({ data: br }) => setBranch(br))
          );
        }
        await Promise.all(fetches);
      }
      setLoadingDone(true);
    })();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    let avatar_url = profile.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (uploadErr) {
        alert("Avatar upload failed: " + uploadErr.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatar_url = urlData.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ bio, linkedin, github, portfolio_url: portfolio, avatar_url })
      .eq("id", profile.id);

    if (updateErr) {
      alert("Profile save failed: " + updateErr.message);
      setSaving(false);
      return;
    }

    setProfile({ ...profile, bio, linkedin, github, portfolio_url: portfolio, avatar_url });
    setAvatarFile(null);
    setEditing(false);
    setSaving(false);
  };

  const handleCancel = () => {
    if (profile) {
      setBio(profile.bio || "");
      setLinkedin(profile.linkedin || "");
      setGithub(profile.github || "");
      setPortfolio(profile.portfolio_url || "");
      setAvatarPreview(profile.avatar_url || "");
    }
    setAvatarFile(null);
    setEditing(false);
  };

  if (!loadingDone) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="theme-card p-6 animate-pulse">
            <div className="h-4 bg-[rgb(var(--muted))] rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="theme-card p-8 text-center space-y-4">
          <p className="text-lg font-semibold">Profile not set up yet</p>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Complete onboarding to set up your profile.</p>
          <a href="/onboarding" className="inline-block mt-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-medium">
            Complete Onboarding
          </a>
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
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-card p-6"
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{initials}</span>
              )}
            </div>
            {editing && (
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{profile.full_name}</h1>
                {profile.username && (
                  <p className="text-sm text-[rgb(var(--muted-fg))]">@{profile.username}</p>
                )}
              </div>
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              )}
            </div>

            {/* University + branch tags */}
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

        {/* Bio */}
        <div className="mt-5">
          {editing ? (
            <div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell other students about yourself…"
                rows={3}
                maxLength={160}
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm resize-none",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                )}
              />
              <p className="text-xs text-[rgb(var(--muted-fg))] text-right mt-1">{bio.length}/160</p>
            </div>
          ) : (
            <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
              {bio || "No bio yet."}
            </p>
          )}
        </div>

        {/* Meta info */}
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
          {university?.city && (
            <span className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-fg))]">
              <MapPin className="w-3.5 h-3.5" />
              {university.city}
            </span>
          )}
          <span className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full capitalize",
            profile.role === "admin" ? "bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))]" :
            profile.role === "moderator" ? "bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]" :
            "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]"
          )}>
            {profile.role}
          </span>
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
        {editing ? (
          <div className="space-y-3">
            {[
              { label: "LinkedIn", value: linkedin, set: setLinkedin, icon: Link2, placeholder: "linkedin.com/in/yourname" },
              { label: "GitHub",   value: github,   set: setGithub,   icon: GitBranch,   placeholder: "github.com/yourname" },
              { label: "Portfolio",value: portfolio, set: setPortfolio, icon: Globe,   placeholder: "yourportfolio.com" },
            ].map(({ label, value, set, icon: Icon, placeholder }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[rgb(var(--muted-fg))] flex-shrink-0" />
                <input
                  type="url"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "flex-1 h-9 px-3 rounded-lg text-sm",
                    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
                  )}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: "LinkedIn", value: profile.linkedin, icon: Link2 },
              { label: "GitHub",   value: profile.github,   icon: GitBranch },
              { label: "Portfolio",value: profile.portfolio_url, icon: Globe },
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
        )}
      </motion.div>

      {/* Settings link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="theme-card p-4 flex items-center justify-between"
      >
        <p className="text-sm text-[rgb(var(--muted-fg))]">Theme, password, and account settings</p>
        <Link href="/profile/settings">
          <Button variant="outline" size="sm">Settings</Button>
        </Link>
      </motion.div>
    </div>
  );
}
