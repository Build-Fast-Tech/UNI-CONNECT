"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="theme-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto text-3xl">
            📬
          </div>
          <h2 className="text-2xl font-bold">Check your inbox</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
            We sent a password reset link to{" "}
            <strong className="text-[rgb(var(--fg))]">{email}</strong>.
            Click the link within 1 hour to reset your password.
          </p>
          <Link href="/login">
            <Button variant="outline" size="md" className="w-full mt-2">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="theme-card p-8">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
          <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu.pk"
                required
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
                )}
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
