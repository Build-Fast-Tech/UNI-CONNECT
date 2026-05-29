"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features",      label: "Features", accent: true },
  { href: "#universities",  label: "Universities" },
  { href: "/jobs",          label: "Jobs" },
  { href: "/notes",         label: "Notes" },
  { href: "/ai",            label: "AI" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[95%] max-w-6xl rounded-2xl",
        scrolled
          ? "bg-[rgba(10,10,20,0.6)] backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_40px_rgba(130,80,220,0.08)]"
          : "bg-[rgba(10,10,20,0.3)] backdrop-blur-xl border border-white/[0.04]"
      )}
    >
      <nav className="px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-lg tracking-tight text-white/90">
            Uni
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-500">
              Connect
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "nav-item-liquid px-3.5 py-2 rounded-xl text-sm font-medium",
                  "text-white/50 hover:text-white/90",
                  "transition-colors duration-300",
                  link.accent && "text-emerald-400/90 hover:text-emerald-300"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <button className="liquid-btn px-4 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Log in
            </button>
          </Link>
          <Link href="/signup">
            <button className="liquid-btn-primary px-4 py-1.5 rounded-xl text-sm font-semibold text-white">
              Sign up free
            </button>
          </Link>
          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-white/60"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-white/[0.06]"
          >
            <ul className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-white/[0.06]">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full liquid-btn py-2.5 text-sm font-medium text-white/70">Log in</button>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
