"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FileText, MessageSquareQuote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/Pill";
import { Surface } from "@/components/ui/Surface";
import { TextReveal } from "@/components/animations/TextReveal";
import { AuroraMesh } from "@/components/animations/AuroraMesh";

const SOCIAL_PROOF = [
  { initials: "ZA", hue: "var(--hue-a)" },
  { initials: "BL", hue: "var(--hue-b)" },
  { initials: "FR", hue: "var(--hue-c)" },
  { initials: "HM", hue: "var(--hue-d)" },
  { initials: "SQ", hue: "var(--hue-e)" },
  { initials: "AK", hue: "var(--hue-f)" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] pt-32 sm:pt-36 pb-12 overflow-hidden">
      <AuroraMesh />

      <div className="relative max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Index marker — magazine masthead */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.68, 0.32, 1] }}
          className="flex items-center justify-between mb-10 sm:mb-14"
        >
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-[rgb(var(--fg-3))]" />
            Issue №01 — A campus, in your pocket
          </p>
          <Pill tone="primary" size="sm" className="hidden sm:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))] animate-pulse-badge" />
            Built for Pakistani students
          </Pill>
        </motion.div>

        {/* Headline grid */}
        <div className="grid grid-cols-12 gap-y-10 gap-x-6 items-end">
          {/* Main headline */}
          <h1
            className="col-span-12 font-display leading-[0.92] tracking-[-0.025em] text-[clamp(56px,11.5vw,180px)] text-[rgb(var(--fg))]"
          >
            <TextReveal text="One campus." stagger={70} delay={150} />
            <br />
            <span className="italic text-[rgb(var(--accent))]">
              <TextReveal text="Every" stagger={70} delay={420} />
            </span>{" "}
            <TextReveal text="campus." stagger={70} delay={520} />
          </h1>

          {/* Subline + CTA in editorial right column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 0.68, 0.32, 1] }}
            className="col-span-12 lg:col-span-5 lg:col-start-8 space-y-7"
          >
            <p className="text-[17px] sm:text-lg leading-relaxed text-[rgb(var(--fg-2))] max-w-[44ch]">
              An editorial home for Pakistan&apos;s university students.
              <span className="text-[rgb(var(--fg))]"> Notes, societies, careers,</span> and a quiet AI study
              partner — all designed with intent.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" data-magnet>
                <Button variant="primary" size="lg" shape="pill" className="group">
                  Join free
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
                </Button>
              </Link>
              <Link href="/login" data-magnet>
                <Button variant="ghost" size="lg" shape="pill">
                  Sign in
                </Button>
              </Link>
            </div>

            <SocialProof />
          </motion.div>
        </div>

        {/* Editorial showcase strip */}
        <ShowcaseStrip />
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-2">
        {SOCIAL_PROOF.map((p, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, x: -6, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.06, duration: 0.4, ease: [0.22, 0.68, 0.32, 1] }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold tracking-tight ring-2 ring-[rgb(var(--bg))]"
            style={{
              backgroundColor: `rgb(${p.hue} / 0.92)`,
              color: "rgb(var(--bg))",
            }}
          >
            {p.initials}
          </motion.span>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-[rgb(var(--fg-3))] leading-snug max-w-[18ch]">
        Already trusted by students from <span className="text-[rgb(var(--fg))] font-medium">NUST · LUMS · FAST · IBA</span>
      </p>
    </div>
  );
}

function ShowcaseStrip() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1, delayChildren: 1.0 } },
      }}
      className="mt-20 sm:mt-28 grid grid-cols-12 gap-4 sm:gap-5"
    >
      <Card index="01" subject="Chat" className="col-span-12 sm:col-span-6 lg:col-span-4">
        <ChatVignette />
      </Card>
      <Card index="02" subject="Library" className="col-span-12 sm:col-span-6 lg:col-span-4">
        <NoteVignette />
      </Card>
      <Card index="03" subject="AI Tutor" className="col-span-12 sm:col-span-12 lg:col-span-4">
        <AIVignette />
      </Card>
    </motion.div>
  );
}

function Card({
  index,
  subject,
  children,
  className,
}: {
  index: string;
  subject: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.68, 0.32, 1] } },
      }}
      className={className}
    >
      <Surface tone="default" elevation="mid" radius="lg" interactive className="p-5 h-full">
        <header className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] tracking-widest text-[rgb(var(--fg-3))]">№{index}</span>
          <span className="font-display italic text-sm text-[rgb(var(--fg-2))]">{subject}</span>
        </header>
        {children}
      </Surface>
    </motion.div>
  );
}

function ChatVignette() {
  const lines = [
    { who: "Ali",    uni: "NUST", body: "Anyone got the OS midterm notes?", hue: "hue-a" as const },
    { who: "Fatima", uni: "LUMS", body: "Just uploaded — check the library 📚", hue: "hue-b" as const },
    { who: "Hassan", uni: "FAST", body: "Saved. Thank you 🙏",                   hue: "hue-c" as const },
  ];
  return (
    <div className="space-y-3">
      <p className="font-display text-2xl leading-tight text-[rgb(var(--fg))]">
        University-aware <em className="italic text-[rgb(var(--fg-3))]">conversations.</em>
      </p>
      <div className="space-y-2.5 mt-2">
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
                backgroundColor: `rgb(var(--${l.hue}) / 0.16)`,
                color: `rgb(var(--${l.hue}))`,
              }}
            >
              {l.who[0]}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-[rgb(var(--fg))]">{l.who}</span>
                <Pill tone={l.hue} size="xs">{l.uni}</Pill>
              </div>
              <p className="text-sm text-[rgb(var(--fg-2))]">{l.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NoteVignette() {
  const notes = [
    { code: "CS-201", title: "Data Structures",      uni: "NUST", hue: "hue-a" as const },
    { code: "MA-202", title: "Calculus II",           uni: "LUMS", hue: "hue-b" as const },
    { code: "CS-301", title: "Computer Networks",     uni: "FAST", hue: "hue-c" as const },
  ];
  return (
    <div className="space-y-3">
      <p className="font-display text-2xl leading-tight text-[rgb(var(--fg))]">
        A shared <em className="italic text-[rgb(var(--fg-3))]">library.</em>
      </p>
      <div className="mt-2 space-y-2">
        {notes.map((n, i) => (
          <motion.div
            key={n.code}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 * i }}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))]"
          >
            <span
              className="w-9 h-11 rounded-md flex items-center justify-center text-[10px] font-mono"
              style={{
                backgroundColor: `rgb(var(--${n.hue}) / 0.10)`,
                color: `rgb(var(--${n.hue}))`,
                border: `1px solid rgb(var(--${n.hue}) / 0.30)`,
              }}
            >
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{n.title}</p>
              <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono tracking-tight">
                {n.code} · {n.uni}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AIVignette() {
  return (
    <div className="space-y-3">
      <p className="font-display text-2xl leading-tight text-[rgb(var(--fg))]">
        A study partner that <em className="italic text-[rgb(var(--fg-3))]">stays up.</em>
      </p>
      <div className="mt-2 space-y-2">
        <div className="p-2.5 rounded-xl bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))] text-sm text-[rgb(var(--fg-2))]">
          What&apos;s the time complexity of merge sort?
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="p-2.5 rounded-xl bg-[rgb(var(--primary)/0.08)] border border-[rgb(var(--primary)/0.20)] text-sm text-[rgb(var(--fg))]"
        >
          <span className="inline-flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-[rgb(var(--primary))]" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-[rgb(var(--primary))]">UniAI</span>
          </span>
          <p>Merge sort is <span className="font-mono text-[13px] text-[rgb(var(--primary))]">O(n log n)</span> in all cases — divide in half, conquer in linear time per level, log levels deep.</p>
          <span className="ai-caret" />
        </motion.div>
        <p className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--fg-3))] font-mono pt-1">
          <MessageSquareQuote className="w-3 h-3" />
          24/7 · Powered by Gemini
        </p>
      </div>
    </div>
  );
}
