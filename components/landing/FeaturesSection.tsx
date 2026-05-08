"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MessageSquare, FileText, Briefcase, Bot, GraduationCap, Code2,
} from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import { Pill } from "@/components/ui/Pill";

interface Feature {
  icon: React.ElementType;
  index: string;
  title: string;
  description: string;
  span: "wide" | "narrow";
  hue: "hue-a" | "hue-b" | "hue-c" | "hue-d" | "hue-e" | "hue-f";
  preview: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    index: "01",
    title: "University-aware chat",
    description: "Threads for your university, your branch, and the whole nation. Every line carries a campus tag so you know who's speaking from where.",
    span: "wide",
    hue: "hue-a",
    preview: <ChatPreview />,
  },
  {
    icon: FileText,
    index: "02",
    title: "A shared library",
    description: "Notes from every campus, every subject, every semester. Searchable, voteable, citable.",
    span: "narrow",
    hue: "hue-b",
    preview: <LibraryPreview />,
  },
  {
    icon: Briefcase,
    index: "03",
    title: "Careers, made local",
    description: "Pakistani employers post jobs filtered by university. One-click apply with your CV.",
    span: "narrow",
    hue: "hue-c",
    preview: <CareersPreview />,
  },
  {
    icon: Bot,
    index: "04",
    title: "A study partner that doesn't sleep",
    description: "Ask anything, paste a question, photograph a problem. UniAI reads your notes and answers in your context.",
    span: "wide",
    hue: "hue-e",
    preview: <AIPreview />,
  },
  {
    icon: GraduationCap,
    index: "05",
    title: "Entry-test prep",
    description: "MDCAT, ECAT, NUST, and more — practice with the same intent the test rewards.",
    span: "narrow",
    hue: "hue-d",
    preview: <PrepPreview />,
  },
  {
    icon: Code2,
    index: "06",
    title: "A coding playground",
    description: "Practice problems, dry-runs, visual debuggers. Built for the curious.",
    span: "narrow",
    hue: "hue-f",
    preview: <CodingPreview />,
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      ref={ref}
      className="relative py-28 sm:py-36 px-4 sm:px-6 max-w-[1240px] mx-auto"
    >
      <header className="grid grid-cols-12 gap-6 mb-16 sm:mb-20">
        <div className="col-span-12 lg:col-span-8">
          <p className="eyebrow mb-5">What&apos;s inside</p>
          <h2 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
            Everything a Pakistani student
            <br />
            <em className="italic text-[rgb(var(--fg-3))]">actually</em> needs.
          </h2>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="col-span-12 lg:col-span-4 lg:col-start-9 self-end text-[15px] text-[rgb(var(--fg-2))] leading-relaxed max-w-[42ch]"
        >
          We replaced a pile of WhatsApp groups, Drive folders, LinkedIn pings,
          and dusty Facebook pages with one quiet product.
        </motion.p>
      </header>

      <div className="grid grid-cols-12 gap-4 sm:gap-5">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 0.68, 0.32, 1] }}
            className={feature.span === "wide" ? "col-span-12 md:col-span-8" : "col-span-12 sm:col-span-6 md:col-span-4"}
          >
            <Surface tone="default" elevation="low" radius="lg" interactive className="p-6 sm:p-7 h-full flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `rgb(var(--${feature.hue}) / 0.12)`,
                    color: `rgb(var(--${feature.hue}))`,
                    border: `1px solid rgb(var(--${feature.hue}) / 0.22)`,
                  }}
                >
                  <feature.icon className="w-5 h-5" strokeWidth={1.6} />
                </span>
                <span className="font-mono text-[11px] tracking-widest text-[rgb(var(--fg-3))]">№{feature.index}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-[28px] leading-tight tracking-tight text-[rgb(var(--fg))] mb-3">
                {feature.title}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[rgb(var(--fg-2))] leading-relaxed mb-5">
                {feature.description}
              </p>
              <div className="mt-auto">{feature.preview}</div>
            </Surface>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ChatPreview() {
  const lines = [
    { who: "Ali",    uni: "NUST", body: "OS midterm notes anyone?", hue: "hue-a" as const },
    { who: "Fatima", uni: "LUMS", body: "Just uploaded — library 📚", hue: "hue-b" as const },
    { who: "Hassan", uni: "FAST", body: "Lifesaver, jazakAllah",     hue: "hue-c" as const },
  ];
  return (
    <div className="space-y-2.5 pt-4 border-t border-[rgb(var(--line))]">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 * i }}
          className="flex items-start gap-2.5"
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
            style={{
              backgroundColor: `rgb(var(--${l.hue}) / 0.14)`,
              color: `rgb(var(--${l.hue}))`,
            }}
          >
            {l.who[0]}
          </span>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-medium text-[rgb(var(--fg))]">{l.who}</span>
              <Pill tone={l.hue} size="xs">{l.uni}</Pill>
            </div>
            <p className="text-sm text-[rgb(var(--fg-2))]">{l.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function LibraryPreview() {
  return (
    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[rgb(var(--line))]">
      {[
        { code: "CS-201", hue: "hue-a" as const },
        { code: "MA-202", hue: "hue-b" as const },
        { code: "CS-301", hue: "hue-c" as const },
      ].map((n, i) => (
        <motion.div
          key={n.code}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 * i }}
          className="aspect-[3/4] rounded-lg flex flex-col items-center justify-center text-[10px] font-mono"
          style={{
            backgroundColor: `rgb(var(--${n.hue}) / 0.08)`,
            color: `rgb(var(--${n.hue}))`,
            border: `1px solid rgb(var(--${n.hue}) / 0.20)`,
          }}
        >
          <FileText className="w-4 h-4 mb-1.5" strokeWidth={1.4} />
          <span className="tracking-widest">{n.code}</span>
        </motion.div>
      ))}
    </div>
  );
}

function CareersPreview() {
  return (
    <div className="pt-4 border-t border-[rgb(var(--line))]">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="p-3.5 rounded-xl bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))]"
      >
        <p className="text-sm font-medium text-[rgb(var(--fg))] mb-0.5">Software Engineer Intern</p>
        <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono tracking-tight">Systems Ltd · Karachi</p>
        <div className="flex flex-wrap gap-1 mt-2.5">
          {[
            { uni: "NUST", hue: "hue-a" as const },
            { uni: "FAST", hue: "hue-c" as const },
            { uni: "LUMS", hue: "hue-b" as const },
          ].map((u) => (
            <Pill key={u.uni} tone={u.hue} size="xs">{u.uni}</Pill>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function AIPreview() {
  return (
    <div className="pt-4 border-t border-[rgb(var(--line))] grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="p-3 rounded-xl bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))] text-sm text-[rgb(var(--fg-2))]">
        Explain Big-O like I&apos;m in first year.
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="p-3 rounded-xl bg-[rgb(var(--primary)/0.08)] border border-[rgb(var(--primary)/0.20)] text-sm text-[rgb(var(--fg))]"
      >
        Big-O is just a way to talk about how an algorithm scales as the input grows. Think pages of a book…
        <span className="ai-caret" />
      </motion.div>
    </div>
  );
}

function PrepPreview() {
  return (
    <div className="pt-4 border-t border-[rgb(var(--line))] flex items-center gap-3">
      <div className="text-[42px] font-display leading-none text-[rgb(var(--accent))]">87%</div>
      <div>
        <p className="text-xs text-[rgb(var(--fg-3))] uppercase tracking-widest font-mono">Mastery</p>
        <p className="text-[13px] text-[rgb(var(--fg-2))]">Mock MDCAT · 12 sessions</p>
      </div>
    </div>
  );
}

function CodingPreview() {
  return (
    <div className="pt-4 border-t border-[rgb(var(--line))] font-mono text-[12px] leading-relaxed text-[rgb(var(--fg-2))]">
      <p>
        <span className="pk-keyword">function</span>{" "}
        <span className="pk-function">solve</span>(<span className="pk-type">arr</span>) {"{"}
      </p>
      <p className="pl-4">
        <span className="pk-keyword">return</span> arr.<span className="pk-function">sort</span>();
      </p>
      <p>{"}"}</p>
      <p className="pk-comment">// passes 24 / 24 cases</p>
    </div>
  );
}
