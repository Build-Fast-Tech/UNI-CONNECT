"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Zainab Malik",
    uni: "NUST · SEECS · BSCS",
    avatar: "#6366F1",
    quote: "Finally a platform that understands Pakistani students. Found notes for my Networks midterm in 30 seconds. The AI explained everything I didn't get from the lecture.",
  },
  {
    name: "Bilal Ahmed",
    uni: "LUMS · SSE · EE",
    avatar: "#10B981",
    quote: "The university chat is addictive. Met seniors from my batch I never knew existed. Got my first internship through a referral in the LUMS general chat.",
  },
  {
    name: "Sara Qureshi",
    uni: "FAST-NUCES · CS",
    avatar: "#F97316",
    quote: "I uploaded my notes thinking nobody would see them. 2 weeks later 400+ downloads and a badge. The gamification actually works.",
  },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white/95">Loved by students</h2>
        <p className="text-lg text-white/35">From NUST to NED, students are connecting.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, scale: 0.6, y: 30, filter: "blur(12px)" }}
            animate={inView ? { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{
              delay: i * 0.15,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -4 }}
            className="glass-panel glass-panel-glow p-6 transition-all duration-300"
          >
            <p className="text-sm text-white/45 leading-relaxed mb-6 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              {/* Avatar that materializes from a swirl */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={inView ? { scale: 1, rotate: 0 } : {}}
                transition={{
                  delay: 0.3 + i * 0.15,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200,
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white relative"
                style={{ backgroundColor: t.avatar }}
              >
                {/* Glow ring */}
                <div
                  className="absolute inset-[-3px] rounded-full animate-pulse"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, ${t.avatar}40, transparent)`,
                    filter: "blur(3px)",
                  }}
                />
                <span className="relative z-10">{t.name[0]}</span>
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-white/80">{t.name}</p>
                <p className="text-xs text-white/30">{t.uni}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
