"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle, MailCheck } from "lucide-react";
import Link from "next/link";
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

    if (errorParam) {
      setErrorDetail(decodeURIComponent(errorParam));
      setStatus("error");
      return;
    }

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

    setStatus("success");
  }, [searchParams, router]);

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
      setResendMsg("Email resent. Check your inbox.");
      startCooldown();
    }
  };

  if (status === "loading") {
    return (
      <div className="w-full max-w-[440px] flex flex-col items-start gap-5">
        <Loader2 className="w-7 h-7 text-[rgb(var(--primary))] animate-spin" />
        <p className="font-display text-3xl tracking-tight text-[rgb(var(--fg))]">Verifying your email…</p>
        <p className="text-sm text-[rgb(var(--fg-3))]">This shouldn&apos;t take more than a moment.</p>
      </div>
    );
  }

  if (status === "error") {
    const email = searchParams.get("email");
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.68, 0.32, 1] }}
        className="w-full max-w-[440px]"
      >
        <span className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[rgb(var(--destructive)/0.10)] text-[rgb(var(--destructive))] mb-6">
          <AlertCircle className="w-6 h-6" strokeWidth={1.6} />
        </span>
        <p className="eyebrow mb-4">Link expired</p>
        <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
          That link is <em className="italic text-[rgb(var(--fg-3))]">stale.</em>
        </h1>
        <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
          Verification links live for an hour. Request a fresh one and we&apos;ll send it right out.
        </p>

        {errorDetail && (
          <p className="mt-5 text-xs text-[rgb(var(--destructive))] bg-[rgb(var(--destructive)/0.06)] border border-[rgb(var(--destructive)/0.20)] rounded-xl px-3 py-2">
            {errorDetail}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {email ? (
            <>
              <Button
                variant="primary"
                size="lg"
                shape="pill"
                loading={resending}
                disabled={resendCooldown > 0}
                onClick={resendEmail}
                className="w-full"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification link"}
              </Button>
              {resendMsg && (
                <p className={`text-xs text-center ${resendMsg.toLowerCase().includes("resent") ? "text-[rgb(var(--positive))]" : "text-[rgb(var(--destructive))]"}`}>
                  {resendMsg}
                </p>
              )}
            </>
          ) : (
            <Link href="/signup">
              <Button variant="primary" size="lg" shape="pill" className="w-full">
                Back to sign up
              </Button>
            </Link>
          )}
        </div>
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
      <motion.span
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
        className="inline-flex w-14 h-14 rounded-full items-center justify-center bg-[rgb(var(--positive)/0.12)] text-[rgb(var(--positive))] mb-6"
      >
        <CheckCircle className="w-6 h-6" strokeWidth={1.6} />
      </motion.span>
      <p className="eyebrow mb-4">Email verified</p>
      <h1 className="font-display text-[44px] sm:text-[52px] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
        Welcome aboard.
      </h1>
      <p className="mt-4 text-[15px] text-[rgb(var(--fg-2))] leading-relaxed">
        Taking you to your profile setup…
      </p>

      <div className="mt-8 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[rgb(var(--primary))]"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, delay: i * 0.18, repeat: Infinity }}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        shape="pill"
        loading={resending}
        disabled={resendCooldown > 0}
        onClick={resendEmail}
        className="mt-10 text-xs text-[rgb(var(--fg-3))]"
      >
        <MailCheck className="w-3.5 h-3.5" />
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get the email? Resend"}
      </Button>
      {resendMsg && (
        <p className="text-xs text-[rgb(var(--fg-3))] mt-2">{resendMsg}</p>
      )}
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[440px] flex flex-col items-start gap-4">
          <Loader2 className="w-7 h-7 text-[rgb(var(--primary))] animate-spin" />
          <p className="text-sm text-[rgb(var(--fg-3))]">Loading…</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
