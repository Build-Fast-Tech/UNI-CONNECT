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
    <footer className="relative mt-24">
      <div className="section-divider" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-4">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="footer-link-reveal text-sm text-white/30 hover:text-white/70 transition-colors duration-300"
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
        <div className="section-divider mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/25">
            © 2026{" "}
            <span className="text-white/50 font-medium">UniConnect</span>
            {" "}· Made with care in{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Pakistan</span> 🇵🇰
          </p>
          <p className="text-xs text-white/15">
            Stack: Next.js · Supabase · Google Gemini · Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
