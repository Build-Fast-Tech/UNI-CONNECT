"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F97316", "#DC2626", "#8B5CF6", "#EC4899"];

function AvatarStack() {
  return (
    <div className="flex flex-col gap-2 mt-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex -space-x-2.5">
            {AVATAR_COLORS.map((color, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.08, duration: 0.3 }}
                className="w-7 h-7 rounded-full border border-black/40 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-black/20"
                style={{ backgroundColor: color }}
              >
                {String.fromCharCode(65 + i)}
              </motion.div>
            ))}
          </div>
          {/* Glowing strip under avatar stack */}
          <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-[1px] opacity-80" />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-xs font-medium text-white/50 tracking-wide"
        >
          Join Pakistani university students
        </motion.p>
      </div>
    </div>
  );
}

const ORB_BADGES = [
  { label: "UET", color: "rgba(236, 72, 153, 0.8)", top: "25%", left: "70%", delay: 0 },
  { label: "PK", color: "rgba(255, 255, 255, 0.95)", top: "45%", left: "55%", delay: 1.5, textDark: true },
  { label: "UET", color: "rgba(236, 72, 153, 0.8)", top: "40%", left: "15%", delay: 0.8 },
  { label: "UET", color: "rgba(219, 39, 119, 0.9)", top: "52%", left: "72%", delay: 2.2 },
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
      className={`relative overflow-hidden inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
        primary
          ? "bg-white/10 hover:bg-white/15 text-white border border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.2)]"
          : "bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10"
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
        x: (e.clientX - cx) * 0.02,
        y: (e.clientY - cy) * 0.02,
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden">
      {/* Background Star field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="star-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              ["--twinkle-dur" as string]: `${3 + Math.random() * 3}s`,
              ["--twinkle-delay" as string]: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center w-full">
        {/* Left Column (Content) */}
        <div className="space-y-6 lg:col-span-7 z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full text-xs font-semibold border border-white/10 bg-white/[0.03] text-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Built exclusively for Pakistani university students
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-1"
          >
            <h1
              className="text-[44px] sm:text-[60px] lg:text-[76px] font-bold leading-[1.1] tracking-tight text-white/95"
              style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
            >
              One campus.<br />
              <span className="iridescent-text font-normal italic">
                Every campus.
              </span>
            </h1>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap gap-3.5 pt-2"
          >
            <LiquidRippleButton primary href="/signup">
              Join UniConnect Free <span className="ml-1 text-xs">→</span>
            </LiquidRippleButton>
            <LiquidRippleButton href="/login">
              Sign in
            </LiquidRippleButton>
          </motion.div>

          {/* Avatar Stack */}
          <AvatarStack />
        </div>

        {/* Right Column (Molten Orb) */}
        <div className="lg:col-span-5 flex items-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-[420px] lg:h-[420px]"
          >
            {/* Swirling glow elements behind orb */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-500/10 to-cyan-500/20 blur-3xl pointer-events-none" />

            {/* The Main Glass Orb Container */}
            <motion.div
              ref={orbRef}
              animate={{
                x: mouse.x,
                y: mouse.y,
              }}
              transition={{ type: "spring", stiffness: 60, damping: 22 }}
              className="absolute inset-0 select-none cursor-pointer"
            >
              {/* Molten glass orb render */}
              <img
                src="/liquid_glass_orb.png"
                alt="Liquid Glass Orb"
                className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
              />

              {ORB_BADGES.map((badge, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    y: [0, -10, 0],
                    x: [0, 4, 0],
                  }}
                  transition={{
                    duration: 4 + idx * 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: badge.delay,
                  }}
                  className="px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider shadow-lg shadow-black/25 backdrop-blur-md border border-white/20 select-none flex items-center justify-center"
                  style={{
                    position: "absolute",
                    top: badge.top,
                    left: badge.left,
                    backgroundColor: badge.color,
                    color: badge.textDark ? "#111" : "#fff",
                    boxShadow: `0 4px 15px ${badge.color === "rgba(255, 255, 255, 0.95)" ? "rgba(255,255,255,0.1)" : "rgba(236,72,153,0.3)"}`,
                  }}
                >
                  {badge.label}
                </motion.div>
              ))}

              {/* Central static text flag */}
              <div
                className="absolute top-[48%] left-[48%] -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white select-none z-10 pointer-events-none tracking-tight"
                style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
              >
                PK
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Floating Metallic/Glass Water Droplet Decor */}
      <div className="absolute bottom-6 left-1/3 pointer-events-none animate-float opacity-30 blur-[0.5px] scale-90">
        <div className="w-10 h-10 rounded-full bg-gradient-to-b from-white/20 to-transparent border border-white/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(0,0,0,0.3)]" />
      </div>
      <div className="absolute bottom-16 right-1/4 pointer-events-none animate-float opacity-40 blur-[0.5px] scale-75" style={{ animationDelay: "1.5s" }}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-white/15 to-transparent border border-white/20 shadow-[inset_0_4px_6px_rgba(255,255,255,0.3),0_12px_24px_rgba(0,0,0,0.4)]" />
      </div>

      {/* Transparent Liquid Water Tube running under the Hero section */}
      <div className="absolute bottom-4 left-[-5%] right-[-5%] h-14 z-20 flex items-center pointer-events-none">
        {/* Liquid tube glass styling */}
        <div className="w-full h-full bg-white/[0.015] backdrop-blur-[6px] border-y border-white/[0.06] shadow-[inset_0_6px_12px_rgba(255,255,255,0.05),inset_0_-6px_12px_rgba(0,0,0,0.4),0_10px_30px_rgba(0,0,0,0.35)] flex items-center overflow-hidden">
          <div className="flex gap-16 whitespace-nowrap animate-marquee w-full" style={{ animationDuration: "35s" }}>
            {Array.from({ length: 4 }).map((_, containerIdx) => (
              <div key={containerIdx} className="flex gap-16 items-center">
                {["IBA", "COMSATS", "IBA", "GIKI", "Notes", "NUST", "LUMS", "FAST"].map((uni, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold tracking-widest text-white/35 flex items-center gap-3 select-none"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-400/40" />
                    {uni}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
