"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App error]", error);

    // Chunk load errors happen after a new deployment when the client
    // tries to fetch a stale JS chunk. A hard reload fixes it.
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("chunkloaderror") || msg.includes("loading chunk") || msg.includes("failed to fetch")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-[rgb(var(--muted-fg))] max-w-md">
        We hit an unexpected error while loading this page. Try again or go back.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] text-[rgb(var(--fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Hard refresh
        </button>
      </div>
    </div>
  );
}
