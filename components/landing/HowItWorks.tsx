"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UserPlus, Download, Zap } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign up & pick your university",
    desc: "Create your account, choose your university and branch. Your identity is instantly verified if you use a .edu.pk email.",
  },
  {
    icon: Download,
    step: "02",
    title: "Join chats, download notes, post your CV",
    desc: "Dive into your university community, grab notes from any subject, and showcase your profile to employers.",
  },
  {
    icon: Zap,
    step: "03",
    title: "Apply for jobs or ask the AI anything",
    desc: "One-click job applications with your uploaded CV. Ask UniConnect AI to explain anything — 24/7.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-4 sm:px-6 max-w-6xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white/95">How it works</h2>
        <p className="text-lg text-white/35">Up and running in under 30 seconds.</p>
      </motion.div>

      <div className="relative flex flex-col md:flex-row gap-8 items-start">
        {/* Connecting line (desktop) */}
        <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            className="flex-1 flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className="relative mb-6">
              <div className="glass-panel w-20 h-20 !rounded-2xl flex items-center justify-center">
                <step.icon className="w-8 h-8 text-purple-400/70" />
              </div>
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_15px_rgba(130,80,220,0.3)]">
                {i + 1}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white/85">{step.title}</h3>
            <p className="text-sm text-white/35 leading-relaxed max-w-xs">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
