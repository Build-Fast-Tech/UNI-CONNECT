import Link from "next/link";

/**
 * Public information pages (About, Pricing, Blog, Careers, Legal + policies).
 *
 * Self-contained monochrome shell — black & white only (uses --fg / --bg, not
 * the brass --primary), to match the redesigned landing. Public: none of these
 * routes are gated by the auth middleware.
 */

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Legal", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Slim nav */}
      <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg)/0.85)] backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-12 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-tight text-[rgb(var(--fg))]">
            Uni<span className="opacity-60">Connect</span>
          </Link>
          <nav className="flex items-center gap-1.5 text-sm">
            <Link href="/login" className="px-3 py-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">Log in</Link>
            <Link href="/signup" className="px-3 py-1.5 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] font-semibold hover:opacity-90 transition-opacity">
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-12 sm:py-16">{children}</main>

      {/* Centered footer */}
      <footer className="border-t border-[rgb(var(--border))] py-12">
        <div className="max-w-4xl mx-auto px-5 flex flex-col items-center text-center gap-5">
          <Link href="/" className="font-bold tracking-tight">
            Uni<span className="opacity-60">Connect</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-sm">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Made with <span role="img" aria-label="love">❤️</span> in Pakistan
          </p>
          <p className="text-xs text-[rgb(var(--muted-fg))]">© 2026 UniConnect</p>
        </div>
      </footer>
    </div>
  );
}
