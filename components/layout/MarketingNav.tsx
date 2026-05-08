"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features",     label: "Features" },
  { href: "#universities", label: "Universities" },
  { href: "/notes",        label: "Library" },
  { href: "/jobs",         label: "Careers" },
  { href: "/ai",           label: "AI" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pointer-events-auto">
        <motion.nav
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0.32, 1] }}
          className={cn(
            "mt-3 sm:mt-4 flex items-center justify-between gap-2",
            "h-14 px-3 sm:px-4 rounded-full transition-all",
            "duration-[var(--dur-base)] ease-[var(--ease-out-soft)]",
            scrolled
              ? "bg-[rgb(var(--bg-elev)/0.85)] backdrop-blur-2xl border border-[rgb(var(--line))] shadow-[var(--shadow-md)]"
              : "bg-[rgb(var(--bg)/0.0)] border border-transparent"
          )}
        >
          {/* Logo (left) */}
          <Link
            href="/"
            className="flex items-center gap-2 pl-2 pr-3 group flex-shrink-0"
            data-magnet
          >
            <Logomark />
            <span className="font-display text-[19px] leading-none mt-0.5 hidden sm:block">
              UniConnect
            </span>
          </Link>

          {/* Center pills */}
          <ul className="hidden md:flex items-center gap-1 bg-[rgb(var(--bg-sunk)/0.6)] rounded-full p-1 border border-[rgb(var(--line))]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-magnet
                  className={cn(
                    "inline-flex items-center px-3.5 h-8 rounded-full text-[13px] font-medium",
                    "text-[rgb(var(--fg-2))] hover:text-[rgb(var(--fg))]",
                    "hover:bg-[rgb(var(--bg-elev))] transition-colors duration-[var(--dur-quick)]"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" shape="pill">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:block">
              <Button variant="primary" size="sm" shape="pill" className="group">
                Join free
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
              </Button>
            </Link>
            <button
              className="md:hidden h-9 w-9 rounded-full border border-[rgb(var(--line))] bg-[rgb(var(--bg-elev))] flex items-center justify-center text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sunk))] transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <Menu className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 0.68, 0.32, 1] }}
              className="md:hidden mt-2 mx-2 rounded-3xl border border-[rgb(var(--line))] bg-[rgb(var(--bg-elev)/0.95)] backdrop-blur-2xl shadow-[var(--shadow-lg)] overflow-hidden"
            >
              <ul className="p-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl text-base font-medium text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg-sunk))] transition-colors"
                    >
                      {link.label}
                      <ArrowUpRight className="w-4 h-4 text-[rgb(var(--fg-3))]" />
                    </Link>
                  </li>
                ))}
                <li className="grid grid-cols-2 gap-2 mt-2 p-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="md" shape="pill" className="w-full">Sign in</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="md" shape="pill" className="w-full">Join free</Button>
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function Logomark() {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-[13px] font-display"
    >
      U
      <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-[rgb(var(--accent))] border-2 border-[rgb(var(--bg))]" />
    </span>
  );
}
