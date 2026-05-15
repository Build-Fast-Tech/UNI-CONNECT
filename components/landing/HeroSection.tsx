"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            transition={{ delay: 0.8 + i * 0.08, duration: 0.3 }}
            className="w-8 h-8 rounded-full border-2 border-[rgb(var(--bg))] flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {String.fromCharCode(65 + i)}
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="text-sm text-[rgb(var(--muted-fg))]"
      >
        Join Pakistani university students
      </motion.p>
    </div>
  );
}

const FEATURE_TAGS = [
  { label: "NUST", color: "#6366F1" },
  { label: "LUMS", color: "#10B981" },
  { label: "FAST", color: "#F97316" },
  { label: "IBA",  color: "#DC2626" },
  { label: "GIKI", color: "#8B5CF6" },
  { label: "UET",  color: "#EC4899" },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Water-like spring smoothing on scroll
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 30, mass: 0.6 });

  // Each blob has its own scroll-driven trajectory
  const blob1X     = useTransform(smooth, [0, 1], [0, 180]);
  const blob1Y     = useTransform(smooth, [0, 1], [0, -120]);
  const blob1Scale = useTransform(smooth, [0, 0.5, 1], [1, 1.25, 0.8]);

  const blob2X     = useTransform(smooth, [0, 1], [0, -200]);
  const blob2Y     = useTransform(smooth, [0, 1], [0, 150]);
  const blob2Scale = useTransform(smooth, [0, 0.5, 1], [1, 0.85, 1.3]);

  const blob3X     = useTransform(smooth, [0, 1], [0, 120]);
  const blob3Y     = useTransform(smooth, [0, 1], [0, 220]);
  const blob3Scale = useTransform(smooth, [0, 1], [1, 1.4]);

  // Hero content drifts up + fades as you scroll past
  const heroY       = useTransform(smooth, [0, 1], [0, -100]);
  const heroOpacity = useTransform(smooth, [0, 0.6, 1], [1, 0.5, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Watery scroll-controlled blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 blob-morph-slow"
          style={{
            background: `radial-gradient(circle, rgb(var(--primary)/0.35) 0%, transparent 70%)`,
            filter: "blur(40px)",
            x: blob1X,
            y: blob1Y,
            scale: blob1Scale,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] blob-morph"
          style={{
            background: `radial-gradient(circle, rgb(var(--accent)/0.28) 0%, transparent 70%)`,
            filter: "blur(50px)",
            animationDelay: "-4s",
            x: blob2X,
            y: blob2Y,
            scale: blob2Scale,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 blob-morph-fast"
          style={{
            background: `radial-gradient(circle, rgb(var(--primary)/0.22) 0%, transparent 70%)`,
            filter: "blur(60px)",
            animationDelay: "-2s",
            x: blob3X,
            y: blob3Y,
            scale: blob3Scale,
          }}
        />
      </div>

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center"
      >
        {/* Left: Text */}
        <div className="space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[rgb(var(--primary)/0.3)] bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--primary))]"
          >
            <span className="w-2 h-2 rounded-full bg-[rgb(var(--primary))] animate-pulse" />
            Built exclusively for Pakistani university students
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
            >
              One campus.{" "}
              <span className="gradient-text">
                Every campus.
              </span>
            </h1>
          </motion.div>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-lg sm:text-xl text-[rgb(var(--muted-fg))] max-w-xl leading-relaxed"
          >
            The platform built for Pakistan&apos;s university students.
            Notes, chats, jobs, and an AI study partner — all in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/signup">
              <Button variant="primary" size="lg" className="group">
                Join UniConnect Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </motion.div>

          {/* Avatar stack */}
          <AvatarStack />
        </div>

        {/* Right: University globe placeholder + floating cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative flex items-center justify-center"
        >
          {/* Globe placeholder (R3F globe added in Week 8) */}
          <div className="relative w-80 h-80 lg:w-96 lg:h-96">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-[rgb(var(--primary)/0.2)]"
            />
            {/* Inner ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full border border-dashed border-[rgb(var(--accent)/0.15)]"
            />
            {/* Center globe visual */}
            <div className="absolute inset-12 rounded-full bg-gradient-to-br from-[rgb(var(--primary)/0.3)] via-[rgb(var(--muted))] to-[rgb(var(--accent)/0.2)] glow flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl select-none"
              >
                🇵🇰
              </motion.div>
            </div>

            {/* Floating university tags */}
            {FEATURE_TAGS.map((tag, i) => {
              const angle = (i / FEATURE_TAGS.length) * 2 * Math.PI;
              const r = 160;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 200 }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.label}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
