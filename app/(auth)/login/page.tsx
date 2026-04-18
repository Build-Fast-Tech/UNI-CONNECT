"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/feed");
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/feed` },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="theme-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            Log in to your UniConnect account
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          className={cn(
            "w-full flex items-center justify-center gap-3 h-11 rounded-xl mb-6",
            "border border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.5)]",
            "text-sm font-medium hover:bg-[rgb(var(--muted))] transition-colors"
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[rgb(var(--border))]" />
          <span className="text-xs text-[rgb(var(--muted-fg))]">or</span>
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
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-xl text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                  "transition-shadow"
                )}
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
                className={cn(
                  "w-full h-11 pl-10 pr-11 rounded-xl text-sm",
                  "bg-[rgb(var(--input))] border border-[rgb(var(--border))]",
                  "text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]",
                  "transition-shadow"
                )}
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
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.1)] px-3 py-2 rounded-lg"
            >
              {error}
            </motion.p>
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
    </motion.div>
  );
}
