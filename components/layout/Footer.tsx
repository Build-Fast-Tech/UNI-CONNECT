import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features",     href: "#features" },
    { label: "Universities", href: "/universities" },
    { label: "Library",      href: "/notes" },
    { label: "Careers",      href: "/jobs" },
    { label: "AI Tutor",     href: "/ai" },
  ],
  Company: [
    { label: "About",   href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog",    href: "/blog" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy",   href: "/privacy" },
    { label: "Terms",     href: "/terms" },
    { label: "Cookies",   href: "/cookies" },
    { label: "Security",  href: "/security" },
  ],
  Social: [
    { label: "Twitter / X", href: "https://x.com",       external: true },
    { label: "Instagram",   href: "https://instagram.com", external: true },
    { label: "LinkedIn",    href: "https://linkedin.com",  external: true },
    { label: "GitHub",      href: "https://github.com",    external: true },
  ],
};

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-[rgb(var(--line))]">
      {/* Hero word — magazine masthead */}
      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Big mark */}
          <div className="md:col-span-5">
            <p className="eyebrow mb-5">Issue №01 — 2026</p>
            <h3 className="font-display text-[clamp(48px,8vw,120px)] leading-[0.92] tracking-[-0.02em] text-[rgb(var(--fg))]">
              Made for the <em className="italic text-[rgb(var(--accent))]">student</em>,
              by the <em className="italic">student</em>.
            </h3>
            <p className="text-[rgb(var(--fg-2))] mt-6 max-w-md leading-relaxed">
              UniConnect is the editorial home for Pakistani university life.
              Curated. Quiet. Free to join.
            </p>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h4 className="eyebrow mb-4">{section}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={"external" in link && link.external ? "_blank" : undefined}
                        rel={"external" in link && link.external ? "noopener noreferrer" : undefined}
                        className="link-grow text-sm text-[rgb(var(--fg-2))] hover:text-[rgb(var(--fg))] transition-colors inline-flex items-center gap-1"
                      >
                        {link.label}
                        {"external" in link && link.external && (
                          <ArrowUpRight className="w-3 h-3 opacity-50" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colophon strip */}
      <div className="border-t border-[rgb(var(--line))]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[rgb(var(--fg-3))]">
          <p>
            © 2026 UniConnect. Made with care across Pakistan.
          </p>
          <p className="font-mono tracking-tight">
            Next.js · Supabase · Gemini · Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
