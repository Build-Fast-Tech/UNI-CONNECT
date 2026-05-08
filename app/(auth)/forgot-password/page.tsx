"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, ArrowUpRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
        className="w-full max-w-[440px]"
      >
        <span className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))] mb-6">
          <MailCheck className="w-6 h-6" strokeWidth={1.6} />
        </span>
        <p className="eyebrow mb-4">Check your inbox</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          A link is on the way.
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          We sent a password reset link to{" "}
          <strong className="text-[rgb(var(--fg))]">{email}</strong>.
          The link expires in one hour.
        </p>

        <Link href="/login" className="block mt-10">
          <Button variant="outline" size="md" shape="pill" className="w-full">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
      className="w-full max-w-[440px]"
    >
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-2))] hover:text-[rgb(var(--fg))] mb-8 link-grow"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>

      <header className="mb-10">
        <p className="eyebrow mb-5">Locked out</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          Forgot your <em className="italic text-[rgb(var(--accent))]">password?</em>
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Enter your email and we&apos;ll send you a fresh reset link. Happens to the best of us.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu.pk"
          required
          prefix={<Mail className="w-4 h-4" />}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.08)] border border-[rgb(var(--destructive)/0.20)] px-3.5 py-2.5 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          shape="pill"
          loading={loading}
          className="w-full group"
        >
          Send reset link
          <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
        </Button>
      </form>
    </motion.div>
  );
}
