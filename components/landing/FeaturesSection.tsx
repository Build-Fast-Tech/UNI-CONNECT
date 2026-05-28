"use client";

import { useRef, useCallback } from "react";
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
                <span className="text-xs font-medium text-white/80">{m.user}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: m.color, fontSize: "10px" }}>{m.uni}</span>
              </div>
              <p className="text-xs text-white/40">{m.msg}</p>
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
            className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400/80" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/70">{note}</p>
              <p className="text-xs text-white/30">PDF · NUST</p>
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
          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
        >
          <p className="text-xs font-semibold text-white/80">Software Engineer Intern</p>
          <p className="text-xs text-white/35 mt-1">Systems Ltd · Karachi</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {["NUST", "FAST", "LUMS"].map(u => (
              <span key={u} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300/70">{u}</span>
            ))}
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    icon: Bot,
    title: "AI study companion",
    description: "Ask anything, analyze your notes, prepare for exams. Powered by Google Gemini, available 24/7.",
    preview: (
      <div className="mt-4 space-y-2">
        <div className="p-2 rounded-xl bg-white/[0.03] text-xs text-white/40">
          What&apos;s the time complexity of merge sort?
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-2 rounded-xl bg-purple-500/[0.06] border border-purple-500/10 text-xs text-white/60"
        >
          Merge sort has O(n log n) time complexity in all cases...
          <span className="inline-block w-0.5 h-3 bg-purple-400 ml-0.5 animate-pulse" />
        </motion.div>
      </div>
    ),
    wide: true,
    hasEnergyTrail: true,
  },
];

function FeatureCard({ feature, index, inView }: { feature: typeof FEATURES[0]; index: number; inView: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--x", `${x}%`);
    cardRef.current.style.setProperty("--y", `${y}%`);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={[
        "glass-panel glass-panel-glow feature-card-ripple p-6 cursor-default",
        feature.wide ? "md:col-span-2" : "",
      ].join(" ")}
    >
      <div className="relative w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/10 flex items-center justify-center mb-4">
        {feature.hasEnergyTrail && <div className="energy-trail rounded-xl" />}
        <feature.icon className="w-5 h-5 text-purple-400/80 relative z-10" />
      </div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">{feature.title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
      {feature.preview}
    </motion.div>
  );
}

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
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white/95">
          Everything a Pakistani student needs
        </h2>
        <p className="text-lg text-white/35 max-w-2xl mx-auto">
          We unified WhatsApp groups, Google Drives, LinkedIn, and Facebook pages
          into one clean, fast product.
        </p>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} inView={inView} />
        ))}
      </div>
    </section>
  );
}
