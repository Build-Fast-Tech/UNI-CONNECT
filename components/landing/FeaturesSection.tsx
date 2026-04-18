"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquare, FileText, Globe, Briefcase, Bot } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Your university, your community",
    description: "Dedicated chats for your university, branch, and the entire nation. Every message carries your university tag.",
    preview: (
      <div className="space-y-3 mt-4">
        {[
          { user: "Ali K.", uni: "NUST", msg: "Anyone have the OS notes for midterm?", color: "#6366F1" },
          { user: "Fatima R.", uni: "LUMS", msg: "Check the notes portal! 📚", color: "#10B981" },
          { user: "Hassan M.", uni: "FAST", msg: "I just uploaded them!", color: "#F97316" },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-start gap-2"
          >
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: m.color }}>
              {m.user[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-[rgb(var(--fg))]">{m.user}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: m.color, fontSize: "10px" }}>{m.uni}</span>
              </div>
              <p className="text-xs text-[rgb(var(--muted-fg))]">{m.msg}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
    wide: true,
  },
  {
    icon: FileText,
    title: "Shared notes library",
    description: "Upload and discover notes from every university, subject, and semester.",
    preview: (
      <div className="mt-4 space-y-2">
        {["Data Structures - CS201", "Calculus II - MATH202", "Networks - CS301"].map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-[rgb(var(--muted)/0.5)]"
          >
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary)/0.2)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[rgb(var(--primary))]" />
            </div>
            <div>
              <p className="text-xs font-medium text-[rgb(var(--fg))]">{note}</p>
              <p className="text-xs text-[rgb(var(--muted-fg))]">PDF · NUST</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: Globe,
    title: "Global student chat",
    description: "Connect with students from every Pakistani university in one all-Pakistan chat.",
    preview: null,
  },
  {
    icon: Briefcase,
    title: "Jobs built for Pakistani grads",
    description: "Employers post jobs filtered by university. Students apply in one click with their CV.",
    preview: (
      <div className="mt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-[rgb(var(--muted)/0.5)] border border-[rgb(var(--border))]"
        >
          <p className="text-xs font-semibold text-[rgb(var(--fg))]">Software Engineer Intern</p>
          <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">Systems Ltd · Karachi</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {["NUST", "FAST", "LUMS"].map(u => (
              <span key={u} className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]">{u}</span>
            ))}
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    icon: Bot,
    title: "AI study companion",
    description: "Ask anything, analyze your notes, prepare for exams. Powered by Claude AI, available 24/7.",
    preview: (
      <div className="mt-4 space-y-2">
        <div className="p-2 rounded-lg bg-[rgb(var(--muted)/0.5)] text-xs text-[rgb(var(--muted-fg))]">
          What&apos;s the time complexity of merge sort?
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-2 rounded-lg bg-[rgb(var(--primary)/0.1)] border border-[rgb(var(--primary)/0.2)] text-xs text-[rgb(var(--fg))]"
        >
          Merge sort has O(n log n) time complexity in all cases...
          <span className="inline-block w-0.5 h-3 bg-[rgb(var(--primary))] ml-0.5 animate-pulse" />
        </motion.div>
      </div>
    ),
    wide: true,
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          Everything a Pakistani student needs
        </h2>
        <p className="text-lg text-[rgb(var(--muted-fg))] max-w-2xl mx-auto">
          We unified WhatsApp groups, Google Drives, LinkedIn, and Facebook pages
          into one clean, fast product.
        </p>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className={[
              "theme-card p-6 hover:border-[rgb(var(--primary)/0.3)] transition-all duration-300 cursor-default",
              feature.wide ? "md:col-span-2" : "",
            ].join(" ")}
          >
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.15)] flex items-center justify-center mb-4">
              <feature.icon className="w-5 h-5 text-[rgb(var(--primary))]" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-2">{feature.title}</h3>
            <p className="text-sm text-[rgb(var(--muted-fg))] leading-relaxed">{feature.description}</p>
            {feature.preview}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
