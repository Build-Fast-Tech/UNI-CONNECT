"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AtSign, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUpAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // Username availability
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUsernameChange = (raw: string) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(v);
    setUsernameAvailable(null);
    setUsernameError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v) return;

    if (!USERNAME_REGEX.test(v)) {
      setUsernameError("3–20 chars: lowercase letters, numbers, underscores only.");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setUsernameChecking(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", v)
        .single();
      setUsernameChecking(false);
      setUsernameAvailable(!data);
      if (data) setUsernameError("That username is already taken.");
    }, 400);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username) { setError("Please choose a username."); return; }
    if (!USERNAME_REGEX.test(username)) { setError("Invalid username format."); return; }
    if (usernameAvailable === false) { setError("That username is already taken."); return; }
    if (password.length < 10) { setError("Password must be at least 10 characters."); return; }

    setLoading(true);
    try {
      const result = await signUpAction({ email, password, fullName, username });
      if (result.error) { setError(result.error); setLoading(false); return; }
      setDone(true);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResendMsg(resendError ? resendError.message : "Email resent! Check your inbox.");
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="theme-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto text-3xl">📬</div>
          <h2 className="text-2xl font-bold">Check your inbox</h2>
          <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">
            We sent a verification link to <strong className="text-[rgb(var(--fg))]">{email}</strong>.
            Click the link to activate your account.
          </p>
          <Button variant="ghost" size="sm" loading={resending} onClick={handleResend} className="w-full text-xs text-[rgb(var(--muted-fg))]">
            Didn&apos;t get the email? Resend
          </Button>
          {resendMsg && <p className="text-xs text-center text-[rgb(var(--muted-fg))]">{resendMsg}</p>}
          <Button variant="outline" size="md" onClick={() => window.location.href = "/login"} className="w-full">
            Back to login
          </Button>
        </div>
      </motion.div>
    );
  }

  const inputClass = cn(
    "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
  );

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
      <div className="theme-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Join UniConnect</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Free for all Pakistani university students</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name" required className={inputClass} />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Username <span className="text-[rgb(var(--primary))]">*</span>
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="text"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                required
                maxLength={20}
                className={cn(inputClass, "font-mono pr-10")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking && <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--muted-fg))]" />}
                {!usernameChecking && usernameAvailable === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {!usernameChecking && usernameAvailable === false && <AlertTriangle className="w-4 h-4 text-red-400" />}
              </span>
            </div>
            {usernameError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {usernameError}
              </p>
            )}
            {usernameAvailable && !usernameError && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> @{username} is available!
              </p>
            )}
            {!usernameError && !usernameAvailable && username && USERNAME_REGEX.test(username) && (
              <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">Checking availability…</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu.pk" required className={inputClass} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 10 characters"
                required
                className={cn(inputClass, "pr-11")}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg">
              {error}
            </motion.p>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Create account
          </Button>

          <p className="text-center text-xs text-[rgb(var(--muted-fg))]">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[rgb(var(--fg))]">Terms</Link>{" "}and{" "}
            <Link href="/privacy" className="underline hover:text-[rgb(var(--fg))]">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-center text-sm text-[rgb(var(--muted-fg))] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[rgb(var(--primary))] font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </motion.div>
  );
}
