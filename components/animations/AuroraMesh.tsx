"use client";

import { cn } from "@/lib/utils";

/**
 * Drifting aurora gradient mesh. Drop into any section as an
 * absolute-positioned background layer. Auto-tints from theme vars,
 * It is token-driven, so it adapts to light/dark automatically.
 */
export function AuroraMesh({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div
        className="aurora-blob-a absolute -top-32 -left-24 w-[60vw] h-[60vw] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--primary) / 0.55), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob-b absolute -bottom-40 -right-20 w-[55vw] h-[55vw] rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--accent) / 0.55), transparent 70%)",
        }}
      />
      <div
        className="aurora-blob-a absolute top-1/3 left-1/3 w-[40vw] h-[40vw] rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--primary) / 0.4), transparent 70%)",
          animationDelay: "-9s",
        }}
      />
    </div>
  );
}
