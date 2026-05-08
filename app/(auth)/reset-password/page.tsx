"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // session is active — user can now update password
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/feed"), 2000);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
        className="w-full max-w-[440px]"
      >
        <motion.span
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
          className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[rgb(var(--positive)/0.12)] text-[rgb(var(--positive))] mb-6"
        >
          <CheckCircle className="w-6 h-6" strokeWidth={1.6} />
        </motion.span>
        <p className="eyebrow mb-4">Password updated</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          You&apos;re back in.
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Redirecting you to your feed…
        </p>
      </motion.div>
    );
  }

  const checks = [
    { label: "10+ characters", ok: password.length >= 10 },
    { label: "Letter",         ok: /[a-zA-Z]/.test(password) },
    { label: "Number",         ok: /[0-9]/.test(password) },
    { label: "Match",          ok: confirm.length > 0 && password === confirm },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
      className="w-full max-w-[440px]"
    >
      <header className="mb-10">
        <p className="eyebrow mb-5">Choose carefully</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          Set a new <em className="italic text-[rgb(var(--accent))]">password.</em>
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Pick something you can actually remember. We&apos;ll keep the rest.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="New password"
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
        <Field
          label="Confirm password"
          name="confirm"
          type={showPass ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat it"
          required
          prefix={<Lock className="w-4 h-4" />}
        />

        <div className="grid grid-cols-4 gap-2">
          {checks.map(({ label, ok }) => (
            <div
              key={label}
              className={cn(
                "h-7 px-2 rounded-full text-[10px] font-mono tracking-tight flex items-center justify-center transition-colors duration-[var(--dur-quick)]",
                ok
                  ? "bg-[rgb(var(--positive)/0.10)] text-[rgb(var(--positive))] border border-[rgb(var(--positive)/0.22)]"
                  : "bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg-3))] border border-[rgb(var(--line))]"
              )}
            >
              {label}
            </div>
          ))}
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
          Update password
          <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
        </Button>
      </form>
    </motion.div>
  );
}
