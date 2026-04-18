"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (token_hash && type) {
      const supabase = createClient();
      supabase.auth
        .verifyOtp({ token_hash, type: type as "email" })
        .then(({ error }) => {
          if (error) { setStatus("error"); return; }
          setStatus("success");
          setTimeout(() => router.push("/onboarding"), 1500);
        });
    } else {
      setStatus("success");
    }
  }, [searchParams, router]);

  const resendEmail = async () => {
    setResending(true);
    setTimeout(() => setResending(false), 2000);
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
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md theme-card p-8 text-center space-y-4"
      >
        <div className="text-4xl">❌</div>
        <h2 className="text-xl font-bold">Link expired</h2>
        <p className="text-sm text-[rgb(var(--muted-fg))]">
          This verification link has expired or already been used.
        </p>
        <Button variant="primary" size="md" onClick={() => router.push("/signup")} className="w-full">
          Sign up again
        </Button>
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
        onClick={resendEmail}
        className="text-xs text-[rgb(var(--muted-fg))]"
      >
        Didn&apos;t get the email? Resend
      </Button>
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
