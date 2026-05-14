import Link from "next/link";

const FOOTER_LINKS = {
  Product:  [
    { label: "Features",     href: "#features" },
    { label: "Universities", href: "/universities" },
    { label: "Notes",        href: "/notes" },
    { label: "Jobs",         href: "/jobs" },
    { label: "AI Chat",      href: "/ai" },
  ],
  Company:  [
    { label: "About",   href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Blog",    href: "/blog" },
    { label: "Careers", href: "/careers" },
  ],
  Legal:    [
    { label: "Privacy Policy",    href: "/privacy" },
    { label: "Terms of Service",  href: "/terms" },
    { label: "Cookie Policy",     href: "/cookies" },
  ],
  Socials:  [
    { label: "Twitter / X",  href: "https://x.com" },
    { label: "Instagram",    href: "https://instagram.com" },
    { label: "LinkedIn",     href: "https://linkedin.com" },
    { label: "GitHub",       href: "https://github.com" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border))] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))] mb-4">
                {section}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="pt-8 border-t border-[rgb(var(--border))] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[rgb(var(--muted-fg))]">
            © 2026{" "}
            <span className="text-[rgb(var(--fg))] font-medium">UniConnect</span>
            {" "}· Made with care in{" "}
            <span className="text-[rgb(var(--primary))]">Pakistan</span> 🇵🇰
          </p>
          <p className="text-xs text-[rgb(var(--muted-fg))]">
            Stack: Next.js · Supabase · Google Gemini · Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
