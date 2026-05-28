"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F97316", "#DC2626", "#8B5CF6", "#EC4899"];

function AvatarStack() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {AVATAR_COLORS.map((color, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.08, duration: 0.3 }}
            className="w-8 h-8 rounded-full border-2 border-[#050509] flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {String.fromCharCode(65 + i)}
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="text-sm text-white/40"
      >
        Join Pakistani university students
      </motion.p>
    </div>
  );
}

const UNI_TAGS = [
  { label: "NUST", delay: 0 },
  { label: "LUMS", delay: 0.7 },
  { label: "FAST", delay: 1.4 },
  { label: "IBA",  delay: 2.1 },
  { label: "GIKI", delay: 2.8 },
  { label: "UET",  delay: 3.5 },
];

function LiquidRippleButton({ children, className = "", primary = false, href = "/" }: {
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
      className={`relative overflow-hidden inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
        primary
          ? "liquid-btn-primary text-white shadow-[0_0_30px_rgba(130,80,220,0.2)]"
          : "liquid-btn text-white/80 hover:text-white"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export function HeroSection() {
  const orbRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!orbRef.current) return;
      const rect = orbRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setMouse({
        x: (e.clientX - cx) * 0.03,
        y: (e.clientY - cy) * 0.03,
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Subtle ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="star-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              ["--twinkle-dur" as string]: `${2 + Math.random() * 4}s`,
              ["--twinkle-delay" as string]: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text */}
        <div className="space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-purple-500/20 bg-purple-500/[0.06] text-purple-300"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Built exclusively for Pakistani university students
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
            >
              One campus.{" "}
              <span className="iridescent-text">
                Every campus.
              </span>
            </h1>
          </motion.div>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/40 max-w-xl leading-relaxed"
          >
            The platform built for Pakistan&apos;s university students.
            Notes, chats, jobs, and an AI study partner — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap gap-3"
          >
            <LiquidRippleButton primary href="/signup">
              Join UniConnect Free
              <ArrowRight className="w-4 h-4" />
            </LiquidRippleButton>
            <LiquidRippleButton href="/login">
              Sign in
            </LiquidRippleButton>
          </motion.div>

          {/* Avatar stack */}
          <AvatarStack />
        </div>

        {/* Right: Liquid Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
            {/* Outer glow rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-12px] rounded-full border border-dashed border-purple-500/10"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-30px] rounded-full border border-dashed border-blue-500/[0.06]"
            />

            {/* The Orb */}
            <motion.div
              ref={orbRef}
              animate={{
                x: mouse.x,
                y: mouse.y,
              }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              className="hero-orb absolute inset-0"
            >
              {/* Center emoji */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-6xl select-none z-10"
                style={{ filter: "drop-shadow(0 0 30px rgba(130,80,220,0.3))" }}
              >
                🇵🇰
              </motion.div>
            </motion.div>

            {/* Floating university tags */}
            {UNI_TAGS.map((tag, i) => {
              const angle = (i / UNI_TAGS.length) * 2 * Math.PI - Math.PI / 2;
              const r = 170;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.12, type: "spring", stiffness: 180, damping: 15 }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0], x: [0, 3, 0] }}
                    transition={{
                      duration: 4 + i * 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.4,
                    }}
                    className="orb-tag"
                    style={{
                      animationDelay: `${tag.delay}s`,
                    }}
                  >
                    {tag.label}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
