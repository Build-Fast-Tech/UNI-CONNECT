"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useVelocity, type MotionValue } from "framer-motion";

interface LiquidBackgroundProps {
  intensity?: "subtle" | "medium" | "vivid";
  className?: string;
}

/**
 * Scroll-driven liquid background.
 *
 * - Morphing blobs translate/scale/rotate based on page scroll
 * - Wave layers drift in opposite directions
 * - Bubbles accelerate with scroll velocity
 * - All values run through useSpring for buttery water-like inertia
 */
export function LiquidBackground({ intensity = "medium", className = "" }: LiquidBackgroundProps) {
  const opacityMul = intensity === "subtle" ? 0.5 : intensity === "vivid" ? 1.3 : 1;

  // Track scroll for the WHOLE page (root scroll)
  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Spring-smoothed scroll progress — water-like inertia
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 25,
    mass: 0.8,
  });
  const smoothVelocity = useSpring(scrollVelocity, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  // Parallax & morph values per-blob
  const blob1Y    = useTransform(smoothProgress, [0, 1], [0, 600]);
  const blob1X    = useTransform(smoothProgress, [0, 0.5, 1], [0, 120, -80]);
  const blob1Rot  = useTransform(smoothProgress, [0, 1], [0, 180]);
  const blob1Scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.3, 0.9]);

  const blob2Y    = useTransform(smoothProgress, [0, 1], [0, -400]);
  const blob2X    = useTransform(smoothProgress, [0, 0.5, 1], [0, -100, 60]);
  const blob2Rot  = useTransform(smoothProgress, [0, 1], [0, -220]);
  const blob2Scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.85, 1.25]);

  const blob3Y    = useTransform(smoothProgress, [0, 1], [0, 300]);
  const blob3X    = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0, 80, -60, 40]);
  const blob3Scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.4, 1.1]);

  // Velocity → bubble drift modifier (faster scroll = wider bubble drift)
  const velocityAbs = useTransform(smoothVelocity, (v) => Math.min(Math.abs(v) / 100, 60));

  const bubbles = [
    { left: "8%",  size: 18, delay: 0,    dur: 16, baseDrift: 30 },
    { left: "22%", size: 10, delay: 4,    dur: 22, baseDrift: -45 },
    { left: "38%", size: 22, delay: 1.5,  dur: 14, baseDrift: 25 },
    { left: "55%", size: 8,  delay: 7,    dur: 19, baseDrift: -30 },
    { left: "68%", size: 14, delay: 3,    dur: 17, baseDrift: 40 },
    { left: "82%", size: 12, delay: 9,    dur: 21, baseDrift: -25 },
    { left: "92%", size: 16, delay: 5,    dur: 18, baseDrift: 35 },
    { left: "14%", size: 9,  delay: 11,   dur: 24, baseDrift: -50 },
  ];

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 ${className}`}>
      {/* Morphing liquid blob 1 — primary (scroll: translates down, scales up, rotates) */}
      <motion.div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] blob-morph-slow"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgb(var(--primary) / ${0.32 * opacityMul}), transparent 70%)`,
          filter: "blur(60px)",
          x: blob1X,
          y: blob1Y,
          rotate: blob1Rot,
          scale: blob1Scale,
        }}
      />

      {/* Morphing liquid blob 2 — accent (scroll: floats up, counter-rotates) */}
      <motion.div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] blob-morph"
        style={{
          background: `radial-gradient(circle at 70% 40%, rgb(var(--accent) / ${0.28 * opacityMul}), transparent 70%)`,
          filter: "blur(70px)",
          animationDelay: "-6s",
          x: blob2X,
          y: blob2Y,
          rotate: blob2Rot,
          scale: blob2Scale,
        }}
      />

      {/* Morphing liquid blob 3 — center */}
      <motion.div
        className="absolute bottom-0 left-1/3 w-[460px] h-[460px] blob-morph-fast"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgb(var(--primary) / ${0.22 * opacityMul}), transparent 70%)`,
          filter: "blur(80px)",
          animationDelay: "-3s",
          x: blob3X,
          y: blob3Y,
          scale: blob3Scale,
        }}
      />

      {/* Floating bubbles — drift widens with scroll velocity */}
      {bubbles.map((b, i) => (
        <ScrollBubble key={i} bubble={b} velocityAbs={velocityAbs} />
      ))}
    </div>
  );
}

function ScrollBubble({
  bubble: b,
  velocityAbs,
}: {
  bubble: { left: string; size: number; delay: number; dur: number; baseDrift: number };
  velocityAbs: MotionValue<number>;
}) {
  // The bubble drift CSS var is replaced with a motion value tied to scroll velocity
  const drift = useTransform(velocityAbs, (v) => b.baseDrift + (b.baseDrift > 0 ? v : -v));

  return (
    <motion.span
      className="absolute bottom-0 rounded-full animate-bubble"
      style={
        {
          left: b.left,
          width: b.size,
          height: b.size,
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(99,102,241,0.25) 60%, transparent)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.1), 0 0 8px rgba(99,102,241,0.3)",
          "--bubble-duration": `${b.dur}s`,
          "--bubble-delay": `${b.delay}s`,
          "--drift": drift,
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Animated SVG waves at the bottom of a section — scroll-reactive.
 * The waves drift faster the faster the user scrolls.
 */
export function WaveDivider({ flip = false, className = "" }: { flip?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 30, mass: 0.6 });

  // Each wave layer shifts horizontally with scroll, at different speeds
  const x1 = useTransform(smooth, [0, 1], [0, -300]);
  const x2 = useTransform(smooth, [0, 1], [0, 200]);
  const x3 = useTransform(smooth, [0, 1], [0, -150]);

  return (
    <div
      ref={ref}
      className={`relative w-full h-32 pointer-events-none overflow-hidden ${className}`}
      style={flip ? { transform: "scaleY(-1)" } : undefined}
      aria-hidden
    >
      <motion.div className="absolute inset-0 wave-flow"   style={{ x: x1 }} />
      <motion.div className="absolute inset-0 wave-flow-2" style={{ x: x2 }} />
      <motion.div className="absolute inset-0 wave-flow-3" style={{ x: x3 }} />
    </div>
  );
}
