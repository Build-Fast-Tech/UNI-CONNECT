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
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by students</h2>
        <p className="text-lg text-[rgb(var(--muted-fg))]">From NUST to NED, students are connecting.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15 }}
            whileHover={{ scale: 1.02, rotate: 0 }}
            className="theme-card p-6 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-300"
            style={{ transformOrigin: "center" }}
          >
            <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed mb-6 italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: t.avatar }}
              >
                {t.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{t.name}</p>
                <p className="text-xs text-[rgb(var(--muted-fg))]">{t.uni}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
