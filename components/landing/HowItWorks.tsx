"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Sign up & verify",
    desc: "Create your account, choose your university and branch. A `.edu.pk` email instantly verifies you. Otherwise, a quick check by our team.",
  },
  {
    number: "02",
    title: "Make it yours",
    desc: "Join your campus and branch chats. Browse the library. Upload a CV. Configure the AI to think in your subjects and your context.",
  },
  {
    number: "03",
    title: "Use it daily",
    desc: "Apply to a job in one click. Ask the AI at 2am. Pull notes for tomorrow's quiz. The platform fades into the background — that's the point.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 30%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={ref} className="relative py-28 sm:py-36 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <header className="grid grid-cols-12 gap-6 mb-20 sm:mb-24">
          <div className="col-span-12 lg:col-span-8">
            <p className="eyebrow mb-5">How it works</p>
            <h2 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
              Up and running in
              <br />
              <em className="italic text-[rgb(var(--accent))]">under a minute.</em>
            </h2>
          </div>
        </header>

        {/* Vertical timeline */}
        <div className="relative pl-8 sm:pl-16">
          {/* Track */}
          <div
            aria-hidden
            className="absolute left-[7px] sm:left-[31px] top-2 bottom-2 w-px bg-[rgb(var(--line))]"
          />
          {/* Filled progress */}
          <motion.div
            aria-hidden
            style={{ height: lineHeight }}
            className="absolute left-[7px] sm:left-[31px] top-2 w-px bg-gradient-to-b from-[rgb(var(--primary))] to-[rgb(var(--accent))]"
          />

          <ol className="space-y-16 sm:space-y-24">
            {STEPS.map((step, i) => (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, x: 14 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 * i, ease: [0.22, 0.68, 0.32, 1] }}
                className="relative"
              >
                {/* Dot */}
                <span
                  aria-hidden
                  className="absolute -left-8 sm:-left-16 top-1.5 w-4 h-4 rounded-full bg-[rgb(var(--bg))] border-2 border-[rgb(var(--primary))]"
                />
                <span className="font-mono text-[11px] tracking-widest uppercase text-[rgb(var(--fg-3))]">
                  Step {step.number}
                </span>
                <h3 className="font-display text-3xl sm:text-4xl mt-2 mb-3 tracking-tight text-[rgb(var(--fg))]">
                  {step.title}
                </h3>
                <p className="text-[15px] sm:text-base text-[rgb(var(--fg-2))] leading-relaxed max-w-[58ch]">
                  {step.desc}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
