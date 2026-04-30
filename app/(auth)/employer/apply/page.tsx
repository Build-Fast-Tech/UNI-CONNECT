"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full h-11 px-4 rounded-xl text-sm",
  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
);

export default function EmployerApplyPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/employer/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, companyName, companyUrl, description }),
    });

    const text = await res.text();

    if (res.status === 409) {
      setError(
        text === "already_approved"
          ? "This email is already approved as an employer. Please log in."
          : "An application with this email has already been submitted. We'll be in touch soon."
      );
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      setError(text || "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-[rgb(var(--muted-fg))] text-sm leading-relaxed">
          We&apos;ve received your employer application for <strong>{companyName}</strong>.
          You&apos;ll get an email at <strong>{email}</strong> once it&apos;s reviewed — usually within 24–48 hours.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 text-sm text-[rgb(var(--primary))] hover:underline"
        >
          Back to UniConnect
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-[rgb(var(--primary))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Become an Employer</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Post jobs for Pakistani university students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="theme-card p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Work Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Company Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Systems Ltd"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Company Website</label>
          <input
            type="url"
            value={companyUrl}
            onChange={e => setCompanyUrl(e.target.value)}
            placeholder="https://yourcompany.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">About Your Company</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of what your company does and what roles you typically hire for…"
            rows={4}
            className={cn(inputClass, "h-auto py-3 resize-none")}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !fullName || !email || !companyName}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200",
            submitting || !fullName || !email || !companyName
              ? "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))] cursor-not-allowed"
              : "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] hover:opacity-90 active:scale-[0.99]"
          )}
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>

        <p className="text-xs text-[rgb(var(--muted-fg))] text-center">
          Already approved?{" "}
          <Link href="/login" className="text-[rgb(var(--primary))] hover:underline">
            Log in here
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
