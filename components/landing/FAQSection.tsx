"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is UniConnect really free?",
    a: "Yes. Every core feature — chats, library, jobs, AI tutoring at fair daily limits — is free for verified students. A Pro tier exists for unlimited AI and advanced CV tooling for students who want more.",
  },
  {
    q: "Which universities are supported?",
    a: "More than 250 Pakistani universities, including NUST, LUMS, FAST-NUCES, COMSATS, IBA, GIKI, UET, NED, Air University, Bahria, SZABIST, Habib, and many more. Missing one? Tell us — we add a campus within a day.",
  },
  {
    q: "How are notes moderated?",
    a: "Every upload runs through automated checks for spam, plagiarism, and inappropriate content; the community then upvotes the good ones. Reports are reviewed by humans within 24 hours.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. UniConnect runs on Supabase with row-level security on every table, OAuth where possible, and HTTPS everywhere. We never sell your data. You can wipe your account and every byte we hold at any time.",
  },
  {
    q: "Can employers see my CV without permission?",
    a: "No. You choose between Public, Employers Only, and Private. With Private, only the employers you've actually applied to can see your CV.",
  },
  {
    q: "How does the AI know about my course?",
    a: "UniAI runs on Google Gemini and reads the notes you've uploaded. When you ask it a question, it pulls relevant context from your library so the answer fits your curriculum.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="border-t border-[rgb(var(--line))] last:border-b">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-baseline gap-6 sm:gap-8 py-6 sm:py-7 text-left group"
      >
        <span className="font-mono text-[11px] tracking-widest text-[rgb(var(--fg-3))] flex-shrink-0 mt-1">
          № {num}
        </span>
        <span className="flex-1 font-display text-xl sm:text-2xl tracking-tight leading-snug text-[rgb(var(--fg))] group-hover:text-[rgb(var(--accent))] transition-colors">
          {q}
        </span>
        <Plus
          className={`w-5 h-5 text-[rgb(var(--fg-3))] flex-shrink-0 mt-1.5 transition-transform duration-300 ease-[var(--ease-out-soft)] ${
            open ? "rotate-45 text-[rgb(var(--accent))]" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-7 sm:pb-8 pl-12 sm:pl-16 pr-8">
              <p className="text-[15px] text-[rgb(var(--fg-2))] leading-relaxed max-w-[68ch]">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-28 sm:py-36 px-4 sm:px-6">
      <div className="max-w-[1100px] mx-auto">
        <header className="grid grid-cols-12 gap-6 mb-16 sm:mb-20">
          <div className="col-span-12 lg:col-span-8">
            <p className="eyebrow mb-5">Questions, answered</p>
            <h2 className="font-display text-[clamp(40px,7vw,96px)] leading-[0.95] tracking-[-0.02em] text-[rgb(var(--fg))]">
              Everything you might
              <br />
              <em className="italic text-[rgb(var(--fg-3))]">be wondering.</em>
            </h2>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {FAQS.map((faq, i) => (
            <FAQItem key={faq.q} {...faq} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
