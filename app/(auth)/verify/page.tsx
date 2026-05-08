"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorDetail, setErrorDetail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type       = searchParams.get("type");
    const errorParam = searchParams.get("error");

    // Came from callback route with an error
    if (errorParam) {
      setErrorDetail(decodeURIComponent(errorParam));
      setStatus("error");
      return;
    }

    // OTP link came directly to verify page (not via callback)
    if (token_hash && type) {
      const supabase = createClient();
      supabase.auth
        .verifyOtp({ token_hash, type: type as "email" })
        .then(({ error }) => {
          if (error) { setErrorDetail(error.message); setStatus("error"); return; }
          setStatus("success");
          setTimeout(() => router.push("/onboarding"), 1500);
        });
      return;
    }

    // No params — user landed here after signing up (show "check your email" state)
    setStatus("success");
  }, [searchParams, router]);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const resendEmail = async () => {
    const email = searchParams.get("email");
    if (!email) { router.push("/signup"); return; }
    if (resendCooldown > 0) return;
    setResending(true);
    setResendMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (error) {
      setResendMsg(error.message);
    } else {
      setResendMsg("Email resent! Check your inbox.");
      startCooldown();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[rgb(var(--primary))] animate-spin" />
        <p className="text-sm text-[rgb(var(--muted-fg))]">Verifying your email…</p>
      </div>
    );
  }

  if (status === "error") {
    const email = searchParams.get("email");
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md theme-card p-8 text-center space-y-4"
      >
        <div className="text-4xl">🔗</div>
        <h2 className="text-xl font-bold">Link expired</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))]">
          This verification link has expired or already been used. Request a new one below.
        </p>
        {errorDetail && (
          <p className="text-xs text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.08)] rounded-xl px-3 py-2">
            {errorDetail}
          </p>
        )}
        {email ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="md"
              loading={resending}
              disabled={resendCooldown > 0}
              onClick={resendEmail}
              className="w-full"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
            </Button>
            {resendMsg && (
              <p className={`text-xs ${resendMsg.includes("resent") || resendMsg.includes("Check") ? "text-green-500" : "text-[rgb(var(--destructive))]"}`}>
                {resendMsg}
              </p>
            )}
          </div>
        ) : (
          <Button variant="primary" size="md" onClick={() => router.push("/signup")} className="w-full">
            Back to sign up
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md theme-card p-8 text-center space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-[rgb(var(--success)/0.15)] flex items-center justify-center mx-auto"
      >
        <CheckCircle className="w-8 h-8 text-[rgb(var(--success))]" />
      </motion.div>
      <h2 className="text-2xl font-bold">Email verified!</h2>
      <p className="text-sm text-[rgb(var(--muted-fg))]">
        Redirecting you to setup your profile…
      </p>
      <div className="flex gap-2 justify-center mt-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        loading={resending}
        disabled={resendCooldown > 0}
        onClick={resendEmail}
        className="text-xs text-[rgb(var(--muted-fg))]"
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get the email? Resend"}
      </Button>
      {resendMsg && <p className="text-xs text-center text-[rgb(var(--muted-fg))] mt-1">{resendMsg}</p>}
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[rgb(var(--primary))] animate-spin" />
        <p className="text-sm text-[rgb(var(--muted-fg))]">Loading…</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
