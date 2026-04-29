"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, Mail, FileText, Tag, GraduationCap,
  CheckCircle, ArrowLeft, AlertCircle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { cn } from "@/lib/utils";

interface University { id: string; name: string; short_name: string; }

const CATEGORIES = [
  { value: "academic",  label: "Academic",   desc: "Study groups, tutoring, subject clubs" },
  { value: "cultural",  label: "Cultural",   desc: "Arts, traditions, cultural exchange" },
  { value: "sports",    label: "Sports",     desc: "Athletics, fitness, outdoor activities" },
  { value: "tech",      label: "Tech",       desc: "Programming, robotics, engineering" },
  { value: "arts",      label: "Arts",       desc: "Music, photography, design, theatre" },
  { value: "community", label: "Community",  desc: "Volunteering, social impact, outreach" },
  { value: "general",   label: "General",    desc: "Other clubs and organizations" },
];

export default function RegisterSocietyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { userId, loaded } = useCurrentUser();

  const [universities, setUniversities] = useState<University[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    official_email: "",
    category: "",
    university_id: "",
    visibility: "public",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("universities").select("id, name, short_name").order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) { setError("You must be logged in to register a society."); return; }
    if (!form.name.trim()) { setError("Society name is required."); return; }
    if (!form.category) { setError("Please select a category."); return; }
    if (!form.official_email.trim()) { setError("Official email is required."); return; }
    if (!form.university_id) { setError("Please select your university."); return; }

    setSubmitting(true);

    const { error: dbErr } = await (supabase as any).from("societies").insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      official_email: form.official_email.trim(),
      category: form.category,
      university_id: form.university_id,
      admin_id: userId,
      status: "pending",
      visibility: form.visibility,
    });

    setSubmitting(false);

    if (dbErr) {
      if (dbErr.code === "42P01") {
        setError("Societies table not found — run migration 018 in Supabase SQL Editor first.");
      } else if (dbErr.code === "42501" || dbErr.message.includes("policy")) {
        setError("Permission denied — make sure you are logged in and the societies table has correct RLS policies.");
      } else if (dbErr.code === "23505") {
        setError("A society with that name already exists at your university.");
      } else {
        setError(dbErr.message);
      }
      return;
    }

    setDone(true);
  };

  if (!loaded) return null;

  if (!userId) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in required</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))] mb-4">You need to be logged in to register a society.</p>
        <Link href="/login" className="px-6 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-white font-semibold text-sm hover:opacity-90">
          Sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Application Submitted!</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed mb-2">
            Your society <span className="font-semibold text-[rgb(var(--fg))]">{form.name}</span> has been submitted for review.
          </p>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed mb-8">
            An admin will review your application and approve or reject it. You&apos;ll be notified once a decision is made.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/societies" className="px-6 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              Browse Societies
            </Link>
            <Link href="/feed" className="px-6 py-2.5 rounded-xl bg-[rgb(var(--muted))] text-sm font-medium hover:bg-[rgb(var(--border))] transition-colors">
              Go to Feed
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-16">
      {/* Back */}
      <Link href="/societies" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Societies
      </Link>

      <div className="theme-card p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--primary)/0.12)] flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Register a Society</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
            Submit your society for admin review. Once approved, students can find and join it from the Clubs &amp; Events page.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Society Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Society Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Computer Science Society"
                required
                maxLength={80}
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              />
            </div>
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              University <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <select
                value={form.university_id}
                onChange={set("university_id")}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] appearance-none"
              >
                <option value="">Select your university</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    form.category === cat.value
                      ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--fg))]"
                      : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)] text-[rgb(var(--muted-fg))]"
                  )}
                >
                  <p className={cn("text-sm font-semibold", form.category === cat.value && "text-[rgb(var(--primary))]")}>
                    {cat.label}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-tight">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Official Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Official Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="email"
                value={form.official_email}
                onChange={set("official_email")}
                placeholder="society@university.edu.pk"
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
              />
            </div>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">
              Use your society&apos;s official email address for verification.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Description <span className="text-[rgb(var(--muted-fg))] font-normal">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <textarea
                value={form.description}
                onChange={set("description")}
                placeholder="What does your society do? What events do you run? Who should join?"
                rows={4}
                maxLength={500}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[rgb(var(--input))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] resize-none"
              />
            </div>
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-1 text-right">
              {form.description.length}/500
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold mb-2">Society Visibility</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "public",  label: "Public",  desc: "Anyone can find and join" },
                { value: "private", label: "Private", desc: "Only invited members can see it" },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(p => ({ ...p, visibility: opt.value }))}
                  className={cn("p-3 rounded-xl border text-left transition-all",
                    form.visibility === opt.value
                      ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.08)]"
                      : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)] text-[rgb(var(--muted-fg))]")}>
                  <p className={cn("text-sm font-semibold", form.visibility === opt.value && "text-[rgb(var(--primary))]")}>{opt.label}</p>
                  <p className="text-[11px] mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div className="p-4 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))]">
            <p className="text-xs font-semibold text-[rgb(var(--muted-fg))] uppercase tracking-wider mb-2">What happens next</p>
            <div className="space-y-1.5">
              {[
                "Your application is reviewed by a UniConnect admin",
                "You'll be notified when it's approved or rejected",
                "Once approved, students can find and join your society",
                "You'll get access to post events and announcements",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[rgb(var(--muted-fg))]">
                  <span className="w-4 h-4 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[rgb(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit for Review →"
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
