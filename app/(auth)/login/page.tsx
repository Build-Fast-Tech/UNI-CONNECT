"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
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

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  };

  const inputClass = cn(
    "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
    "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
    "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] transition-shadow"
  );

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="theme-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Log in to your UniConnect account
          </p>
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
          <span className="text-xs text-[rgb(var(--muted-fg))]">or continue with email</span>
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu.pk"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-[rgb(var(--primary))] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className={cn(inputClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg animate-fade-in">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-[rgb(var(--muted-fg))] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[rgb(var(--primary))] font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
