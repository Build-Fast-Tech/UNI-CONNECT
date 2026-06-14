"use client";

import { useEffect } from "react";

/**
 * Error boundary for auth + onboarding routes. Keeps users out of a blank/black
 * screen if signup, login, or onboarding throws — offers retry + a safe exit,
 * and auto-recovers from stale-chunk errors after a deploy.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth error]", error);
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("chunkloaderror") || msg.includes("loading chunk") || msg.includes("failed to fetch")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center px-4 py-16 max-w-md mx-auto">
      <h2 className="text-xl font-bold">We hit a snag</h2>
      <p className="text-sm text-[rgb(var(--muted-fg))]">
        Something went wrong during sign-in. This is usually temporary — please try again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/login")}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-[rgb(var(--fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
