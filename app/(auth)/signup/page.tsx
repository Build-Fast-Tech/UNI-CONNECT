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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}

const oauthBtnClass = cn(
  "w-full h-11 flex items-center justify-center gap-3 rounded-xl text-sm font-medium transition-all",
  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
  "text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))] hover:border-[rgb(var(--ring)/0.5)]",
  "disabled:opacity-50"
);

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

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

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Join UniConnect</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">Free for all Pakistani university students</p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            disabled={!!oauthLoading}
            onClick={() => handleOAuth("google")}
            className={oauthBtnClass}
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
          <button
            type="button"
            disabled={!!oauthLoading}
            onClick={() => handleOAuth("github")}
            className={oauthBtnClass}
          >
            <GitHubIcon />
            {oauthLoading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
          <span className="text-xs text-[rgb(var(--muted-fg))]">or sign up with email</span>
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
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
