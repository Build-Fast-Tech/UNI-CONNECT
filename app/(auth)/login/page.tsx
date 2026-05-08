"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { signInAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signInAction({ email, password });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
      className="w-full max-w-[440px]"
    >
      <header className="mb-10">
        <p className="eyebrow mb-5">Returning student</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          Welcome back.
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Pick up where you left off — your library, your chats, your AI.
        </p>
      </header>

      <form onSubmit={handleLogin} className="space-y-5">
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

        <Field
          label="Password"
          name="password"
          type={showPass ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 10 characters"
          required
          prefix={<Lock className="w-4 h-4" />}
          suffix={
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="hover:text-[rgb(var(--fg))] transition-colors"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between -mt-1">
          <span />
          <Link
            href="/forgot-password"
            className="text-xs text-[rgb(var(--fg-2))] link-grow"
          >
            Forgot password?
          </Link>
        </div>

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
          Sign in
          <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
        </Button>
      </form>

      <p className="text-center text-sm text-[rgb(var(--fg-2))] mt-10 pt-8 border-t border-[rgb(var(--line))]">
        New here?{" "}
        <Link href="/signup" className="text-[rgb(var(--fg))] font-medium link-grow">
          Create a free account
        </Link>
      </p>
    </motion.div>
  );
}
