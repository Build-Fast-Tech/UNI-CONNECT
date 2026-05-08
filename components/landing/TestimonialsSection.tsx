"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Surface } from "@/components/ui/Surface";

const TESTIMONIALS = [
  {
    name: "Zainab Malik",
    uni: "NUST · SEECS · BSCS",
    initials: "ZM",
    hue: "hue-a" as const,
    quote:
      "Found notes for my Networks midterm in thirty seconds. The AI explained the bits I'd missed in lecture without making me feel stupid. That's the part I keep coming back to.",
  },
  {
    name: "Bilal Ahmed",
    uni: "LUMS · SSE · EE",
    initials: "BA",
    hue: "hue-b" as const,
    quote:
      "The campus chat is addictive in the best way. I met seniors from my batch I never knew existed. Got my first internship through a referral inside the LUMS general thread.",
  },
  {
    name: "Sara Qureshi",
    uni: "FAST-NUCES · CS",
    initials: "SQ",
    hue: "hue-c" as const,
    quote:
      "I uploaded my notes thinking nobody would care. Two weeks later — four hundred downloads and a badge. The gamification actually means something.",
  },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-28 sm:py-36 px-4 sm:px-6">
      <div className="max-w-[1240px] mx-auto">
        <header className="grid grid-cols-12 gap-6 mb-16 sm:mb-20">
          <div className="col-span-12 lg:col-span-8">
            <p className="eyebrow mb-5">In their words</p>
            <h2 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
              From <em className="italic text-[rgb(var(--fg-3))]">Karachi</em> to{" "}
              <em className="italic text-[rgb(var(--fg-3))]">Peshawar</em>,
              <br />
              students are connecting.
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 0.68, 0.32, 1] }}
              className="col-span-12 md:col-span-4"
            >
              <Surface tone="default" elevation="low" radius="lg" interactive className="p-7 sm:p-8 h-full flex flex-col">
                <span
                  aria-hidden
                  className="font-display italic text-7xl leading-none text-[rgb(var(--fg-3))] mb-2 select-none"
                  style={{ fontFeatureSettings: '"ss01"' }}
                >
                  &ldquo;
                </span>
                <p className="text-[15px] leading-relaxed text-[rgb(var(--fg))] mb-8">
                  {t.quote}
                </p>
                <footer className="mt-auto flex items-center gap-3 pt-5 border-t border-[rgb(var(--line))]">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold tracking-tight"
                    style={{
                      backgroundColor: `rgb(var(--${t.hue}) / 0.14)`,
                      color: `rgb(var(--${t.hue}))`,
                    }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--fg))] tracking-tight">{t.name}</p>
                    <p className="text-[11px] font-mono text-[rgb(var(--fg-3))] tracking-tight">{t.uni}</p>
                  </div>
                </footer>
              </Surface>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
