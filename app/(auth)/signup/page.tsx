"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, AtSign, CheckCircle, AlertTriangle,
  Loader2, ArrowUpRight, MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { signUpAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setUsernameError("3–20 characters: lowercase letters, numbers, underscores.");
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

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setResendMsg("");
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (resendError) {
      const msg = resendError.message.toLowerCase();
      setResendMsg(
        msg.includes("rate limit") || msg.includes("too many")
          ? "Too many emails sent. Please wait a few minutes before trying again."
          : resendError.message
      );
    } else {
      setResendMsg("Email resent. Check your inbox.");
      startCooldown();
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
        className="w-full max-w-[440px]"
      >
        <header className="mb-8">
          <span className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))] mb-6">
            <MailCheck className="w-6 h-6" strokeWidth={1.6} />
          </span>
          <p className="eyebrow mb-4">One more step</p>
          <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
            Check your inbox.
          </h1>
          <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
            We sent a verification link to{" "}
            <strong className="text-[rgb(var(--fg))] tracking-tight">{email}</strong>.
            Click it to activate your account.
          </p>
        </header>

        <div className="space-y-3">
          <Button
            variant="ghost"
            size="md"
            shape="pill"
            loading={resending}
            disabled={resendCooldown > 0}
            onClick={handleResend}
            className="w-full"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get the email? Resend"}
          </Button>
          {resendMsg && (
            <p className="text-xs text-center text-[rgb(var(--fg-3))]">{resendMsg}</p>
          )}
          <Link href="/login">
            <Button variant="outline" size="md" shape="pill" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  let usernameHint: string | undefined;
  let usernameErrMsg: string | null | undefined;
  if (usernameError) {
    usernameErrMsg = usernameError;
  } else if (usernameAvailable === true) {
    usernameHint = `@${username} is available.`;
  } else if (usernameChecking) {
    usernameHint = "Checking availability…";
  }

  const usernameSuffix = (() => {
    if (usernameChecking) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (usernameAvailable === true) return <CheckCircle className="w-4 h-4 text-[rgb(var(--positive))]" />;
    if (usernameAvailable === false) return <AlertTriangle className="w-4 h-4 text-[rgb(var(--destructive))]" />;
    return null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
      className="w-full max-w-[440px]"
    >
      <header className="mb-10">
        <p className="eyebrow mb-5">Join the issue</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          Create your <em className="italic text-[rgb(var(--accent))]">account.</em>
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Free for verified Pakistani university students. Always.
        </p>
      </header>

      <form onSubmit={handleSignup} className="space-y-5">
        <Field
          label="Full name"
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name as your university knows it"
          required
          prefix={<User className="w-4 h-4" />}
        />

        <Field
          label="Username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          placeholder="your_handle"
          required
          maxLength={20}
          className="font-mono"
          prefix={<AtSign className="w-4 h-4" />}
          suffix={usernameSuffix}
          hint={usernameHint}
          error={usernameErrMsg}
        />

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
          Create account
          <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
        </Button>

        <p className="text-center text-xs text-[rgb(var(--fg-3))] leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-[rgb(var(--fg-2))] link-grow">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-[rgb(var(--fg-2))] link-grow">Privacy Policy</Link>.
        </p>
      </form>

      <p className="text-center text-sm text-[rgb(var(--fg-2))] mt-8 pt-6 border-t border-[rgb(var(--line))]">
        Already have an account?{" "}
        <Link href="/login" className="text-[rgb(var(--fg))] font-medium link-grow">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
