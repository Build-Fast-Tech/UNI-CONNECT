"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features",      label: "Features" },
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[rgb(var(--bg)/0.85)] backdrop-blur-xl border-b border-[rgb(var(--border))] shadow-[0_2px_20px_rgb(0,0,0,0.3)]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-xl tracking-tight text-[rgb(var(--fg))]">
            Uni
            <span className="text-[rgb(var(--primary))] group-hover:text-[rgb(var(--accent))] transition-colors duration-300">
              Connect
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  "text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))]",
                  "hover:bg-[rgb(var(--muted))] transition-all duration-200"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">Sign up free</Button>
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
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
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-[rgb(var(--bg)/0.95)] backdrop-blur-xl border-b border-[rgb(var(--border))]"
          >
            <ul className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted))] transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-[rgb(var(--border))]">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="md" className="w-full">Log in</Button>
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
