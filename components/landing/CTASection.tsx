"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function RippleBtn({ children, className = "", primary = false, href = "/" }: {
  children: React.ReactNode;
  className?: string;
  primary?: boolean;
  href?: string;
}) {
  const btnRef = useRef<HTMLAnchorElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }, []);

  return (
    <Link
      ref={btnRef}
      href={href}
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex items-center gap-2 rounded-2xl font-semibold transition-all duration-300 ${
        primary
          ? "liquid-btn-primary text-white shadow-[0_0_40px_rgba(130,80,220,0.25)] px-8 py-4 text-base"
          : "liquid-btn text-white/70 hover:text-white px-7 py-4 text-base"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export function CTASection() {
  return (
    <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Radial glow behind text */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(130,80,220,0.15) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(60,100,240,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight cta-pulse"
          style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
        >
          Ready to{" "}
          <span className="iridescent-text">connect?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-xl text-white/35 mb-12 max-w-2xl mx-auto"
        >
          Join 2,400+ students from across Pakistan who are already sharing notes, chatting, and landing jobs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <RippleBtn primary href="/signup">
            Join UniConnect Free
            <ArrowRight className="w-5 h-5" />
          </RippleBtn>
          <RippleBtn href="/universities">
            Browse Universities
          </RippleBtn>
        </motion.div>
      </div>
    </section>
  );
}
