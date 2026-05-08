import Link from "next/link";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { AuroraMesh } from "@/components/animations/AuroraMesh";

export const dynamic = "force-dynamic";

const QUOTES = [
  {
    text: "Found notes for my Networks midterm in thirty seconds. The AI explained the bits I'd missed without making me feel stupid.",
    name: "Zainab Malik",
    uni: "NUST · SEECS",
  },
];

const UNIS = [
  "NUST", "LUMS", "FAST-NUCES", "COMSATS", "IBA", "GIKI",
  "UET Lahore", "QAU", "NED", "Air University", "Habib", "BZU",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const quote = QUOTES[0];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "rgb(var(--bg))" }}>
      {/* Header */}
      <header className="h-16 px-5 sm:px-8 flex items-center justify-between flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-[14px] font-display">
            U
            <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-[rgb(var(--accent))] border-2 border-[rgb(var(--bg))]" />
          </span>
          <span className="font-display text-[20px] leading-none mt-0.5 hidden sm:inline">UniConnect</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-[rgb(var(--fg-3))] font-mono">Issue №01 — 2026</span>
          <ThemeSwitcher />
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-2 gap-0 min-h-0">
        {/* Form column */}
        <main className="flex items-center justify-center px-4 sm:px-8 py-10 lg:py-12">
          {children}
        </main>

        {/* Editorial cover column */}
        <aside className="hidden lg:flex relative items-end overflow-hidden border-l border-[rgb(var(--line))] bg-[rgb(var(--bg-sunk))]">
          <AuroraMesh />

          {/* Top eyebrow */}
          <div className="absolute top-10 left-12 right-12 flex items-center justify-between text-[rgb(var(--fg-3))]">
            <p className="eyebrow">Vol. 01 — Spring 2026</p>
            <p className="eyebrow">A campus, in your pocket</p>
          </div>

          {/* Display quote */}
          <div className="relative px-12 pb-16 pt-32 max-w-[640px]">
            <span
              aria-hidden
              className="font-display italic text-[140px] leading-none text-[rgb(var(--accent))] select-none"
              style={{ display: "block", marginLeft: "-12px", marginBottom: "-32px" }}
            >
              &ldquo;
            </span>
            <p className="font-display text-[clamp(28px,3.4vw,44px)] leading-[1.1] tracking-[-0.01em] text-[rgb(var(--fg))]">
              {quote.text}
            </p>
            <footer className="mt-10 flex items-center gap-3">
              <span className="h-px w-10 bg-[rgb(var(--fg-3))]" />
              <div>
                <p className="text-sm font-medium text-[rgb(var(--fg))] tracking-tight">
                  {quote.name}
                </p>
                <p className="text-[11px] font-mono text-[rgb(var(--fg-3))]">
                  {quote.uni}
                </p>
              </div>
            </footer>

            {/* University list */}
            <div className="mt-14 pt-8 border-t border-[rgb(var(--line))]">
              <p className="eyebrow mb-4">Across {UNIS.length}+ universities</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[rgb(var(--fg-2))]">
                {UNIS.map((u) => (
                  <span key={u}>{u}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-12 px-5 sm:px-8 flex items-center justify-between text-xs text-[rgb(var(--fg-3))] flex-shrink-0 border-t border-[rgb(var(--line))]">
        <p>© 2026 UniConnect</p>
        <p className="font-mono tracking-tight hidden sm:block">
          Made with care across Pakistan
        </p>
      </footer>
    </div>
  );
}
