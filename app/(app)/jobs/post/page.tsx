"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X, Briefcase, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type JobType = Database["public"]["Tables"]["jobs"]["Row"]["type"];
type ApplyMethod = Database["public"]["Tables"]["jobs"]["Row"]["apply_method"];

const JOB_TYPES: Array<{ value: JobType; label: string }> = [
  { value: "internship", label: "Internship" },
  { value: "full_time",  label: "Full-time" },
  { value: "part_time",  label: "Part-time" },
  { value: "contract",   label: "Contract" },
  { value: "remote",     label: "Remote" },
];

const APPLY_METHODS: Array<{ value: ApplyMethod; label: string; placeholder: string }> = [
  { value: "url",      label: "Website / Form URL",  placeholder: "https://yourcompany.com/careers/apply" },
  { value: "email",    label: "Email address",        placeholder: "hr@yourcompany.com" },
  { value: "platform", label: "UniConnect Platform",  placeholder: "" },
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
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 px-3 h-10 rounded-xl text-sm bg-[rgb(var(--muted))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted)/0.7)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = cn(
  "w-full h-11 px-4 rounded-xl text-sm",
  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
);

export default function PostJobPage() {
  const router = useRouter();
  const supabase = createClient();

  const [roleChecked, setRoleChecked] = useState(false);
  const [canPost, setCanPost] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCanPost(profile?.role === "employer" || profile?.role === "admin");
      setRoleChecked(true);
    };
    checkRole();
  }, []);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<JobType>("internship");
  const [city, setCity] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [applyMethod, setApplyMethod] = useState<ApplyMethod>("url");
  const [applyValue, setApplyValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in."); setSubmitting(false); return; }

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        employer_id: user.id,
        title,
        company_name: company,
        type,
        city: isRemote ? null : city || null,
        is_remote: isRemote,
        experience_required: experience || null,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        required_skills: skills,
        description: description || null,
        apply_method: applyMethod,
        apply_value: applyMethod !== "platform" ? applyValue : null,
        deadline: deadline || null,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/jobs/${job.id}`);
  };

  const applyPlaceholder = APPLY_METHODS.find(m => m.value === applyMethod)?.placeholder ?? "";

  if (!roleChecked) return null;

  if (!canPost) {
    return (
      <div className="max-w-md mx-auto text-center space-y-5 py-16">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--muted))] flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-[rgb(var(--muted-fg))]" />
        </div>
        <h2 className="text-2xl font-bold">Employer Access Required</h2>
        <p className="text-[rgb(var(--muted-fg))] text-sm leading-relaxed">
          Only approved employers can post jobs on UniConnect.
          Submit an application and we&apos;ll review it within 24–48 hours.
        </p>
        <Link
          href="/employer/apply"
          className="inline-block px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Apply to Become an Employer
        </Link>
        <div>
          <Link href="/jobs" className="text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Post a Job</h1>
            <p className="text-sm text-[rgb(var(--muted-fg))]">Reach thousands of Pakistani university students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="theme-card p-6 space-y-5">
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <Field label="Job Title" required>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer Intern" className={inputClass} required />
          </Field>

          <Field label="Company Name" required>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Systems Ltd" className={inputClass} required />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Job Type" required>
              <select value={type} onChange={e => setType(e.target.value as JobType)} className={inputClass}>
                {JOB_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="City">
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                disabled={isRemote}
                placeholder={isRemote ? "Remote position" : "e.g. Karachi"}
                className={cn(inputClass, isRemote && "opacity-50")} />
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRemote(!isRemote)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                isRemote ? "bg-[rgb(var(--primary))]" : "bg-[rgb(var(--muted))]"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                isRemote && "translate-x-5"
              )} />
            </button>
            <span className="text-sm">Remote position</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Min Salary (PKR/month)">
              <input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
                placeholder="e.g. 50000" className={inputClass} min={0} />
            </Field>
            <Field label="Max Salary (PKR/month)">
              <input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
                placeholder="e.g. 100000" className={inputClass} min={0} />
            </Field>
          </div>

          <Field label="Experience Required">
            <input type="text" value={experience} onChange={e => setExperience(e.target.value)}
              placeholder="e.g. Freshers welcome, 1-2 years, Final year students" className={inputClass} />
          </Field>

          <ChipInput
            label="Required Skills"
            placeholder="Type a skill and press Enter"
            values={skills}
            onChange={setSkills}
          />

          <Field label="Job Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe responsibilities, requirements, perks…"
              rows={5}
              className={cn(inputClass, "h-auto py-3 resize-none")}
            />
          </Field>

          <Field label="How to Apply" required>
            <div className="space-y-3">
              <div className="flex gap-2">
                {APPLY_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => { setApplyMethod(m.value); setApplyValue(""); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-200",
                      applyMethod === m.value
                        ? "bg-[rgb(var(--primary)/0.1)] border-[rgb(var(--primary)/0.4)] text-[rgb(var(--primary))]"
                        : "border-[rgb(var(--border))] text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))]"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {applyMethod !== "platform" && (
                <input
                  type={applyMethod === "email" ? "email" : "url"}
                  value={applyValue}
                  onChange={e => setApplyValue(e.target.value)}
                  placeholder={applyPlaceholder}
                  className={inputClass}
                  required
                />
              )}
              {applyMethod === "platform" && (
                <p className="text-xs text-[rgb(var(--muted-fg))] px-1">
                  Students will apply directly through UniConnect and their profile will be sent to you.
                </p>
              )}
            </div>
          </Field>

          <Field label="Application Deadline">
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting || !title || !company}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              submitting || !title || !company
                ? "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
                : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 active:scale-[0.99]"
            )}
          >
            {submitting ? "Publishing…" : "Publish Job"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
