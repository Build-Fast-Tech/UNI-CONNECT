"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileUser, X, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes } from "@/lib/utils";

const AVAILABILITY_OPTIONS = [
  { value: "immediate",    label: "Available immediately" },
  { value: "one_month",    label: "1 month notice" },
  { value: "three_months", label: "3 months notice" },
  { value: "not_looking",  label: "Not actively looking" },
];

const VISIBILITY_OPTIONS = [
  { value: "public",         label: "Public", desc: "Anyone on UniConnect" },
  { value: "employers_only", label: "Employers only", desc: "Only verified employers" },
  { value: "private",        label: "Private", desc: "Only you" },
];

function ChipInput({
  label, placeholder, values, onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.2)]">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={cn(
            "flex-1 h-10 px-3 rounded-xl text-sm",
            "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
            "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
          )}
        />
        <button type="button" onClick={add}
          className="flex items-center gap-1 px-3 h-10 rounded-xl text-sm bg-[rgb(var(--muted))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted)/0.7)] transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

const inputClass = cn(
  "w-full h-11 px-4 rounded-xl text-sm",
  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
);

export default function CvUploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [availability, setAvailability] = useState("immediate");
  const [visibility, setVisibility] = useState("employers_only");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") setFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setSubmitting(false); return; }

    let fileUrl: string | null = null;

    if (file) {
      const path = `${user.id}/cv_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) { setError(uploadError.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { data: existing } = await supabase
      .from("cvs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("cvs").update({
        ...(fileUrl && { file_url: fileUrl }),
        headline: headline || null,
        skills,
        preferred_roles: roles,
        preferred_cities: cities,
        availability,
        visibility: visibility as "public" | "employers_only" | "private",
      }).eq("id", existing.id);
    } else {
      await supabase.from("cvs").insert({
        user_id: user.id,
        file_url: fileUrl,
        headline: headline || null,
        skills,
        preferred_roles: roles,
        preferred_cities: cities,
        availability,
        visibility: visibility as "public" | "employers_only" | "private",
      });
    }

    router.push("/cvs");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/cvs" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
            <FileUser className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Upload CV</h1>
            <p className="text-sm text-[rgb(var(--muted-fg))]">Let employers find you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="theme-card p-6 space-y-6">
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* File drop zone */}
          <div>
            <label className="block text-sm font-medium mb-2">CV File (PDF)</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200",
                dragOver
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary)/0.05)]"
                  : "border-[rgb(var(--border))] hover:border-[rgb(var(--primary)/0.4)] hover:bg-[rgb(var(--muted)/0.3)]"
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileUser className="w-8 h-8 text-[rgb(var(--primary))]" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-[rgb(var(--muted-fg))]">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="ml-2 text-[rgb(var(--muted-fg))] hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-[rgb(var(--muted-fg))] mx-auto mb-3" />
                  <p className="text-sm font-medium">Drop your PDF here or click to browse</p>
                  <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">PDF only · Max 10 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium mb-2">Headline</label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Final-year CS student at NUST, open to internships"
              className={inputClass}
              maxLength={120}
            />
            <p className="text-xs text-[rgb(var(--muted-fg))] mt-1 text-right">{headline.length}/120</p>
          </div>

          <ChipInput label="Skills" placeholder="e.g. React, Python, SQL" values={skills} onChange={setSkills} />
          <ChipInput label="Preferred Roles" placeholder="e.g. Software Engineer, Data Analyst" values={roles} onChange={setRoles} />
          <ChipInput label="Preferred Cities" placeholder="e.g. Karachi, Islamabad" values={cities} onChange={setCities} />

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium mb-2">Availability</label>
            <select value={availability} onChange={e => setAvailability(e.target.value)} className={inputClass}>
              {AVAILABILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {VISIBILITY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setVisibility(o.value)}
                  className={cn(
                    "p-3 rounded-xl text-left border transition-all duration-200",
                    visibility === o.value
                      ? "bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.4)]"
                      : "border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"
                  )}
                >
                  <p className={cn("text-xs font-semibold", visibility === o.value ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--fg))]")}>
                    {o.label}
                  </p>
                  <p className="text-[10px] text-[rgb(var(--muted-fg))] mt-0.5">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              submitting
                ? "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
                : "bg-[rgb(var(--primary))] text-white hover:opacity-90 active:scale-[0.99]"
            )}
          >
            {submitting ? "Saving…" : "Save CV"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
