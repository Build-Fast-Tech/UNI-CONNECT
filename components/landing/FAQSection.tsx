"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is UniConnect free?",
    a: "Yes! UniConnect is completely free for students. We offer a Pro tier with unlimited AI messages and advanced CV features for students who want more.",
  },
  {
    q: "Which universities are supported?",
    a: "We support 250+ Pakistani universities including NUST, LUMS, FAST-NUCES, COMSATS, IBA, GIKI, UET, NED, Air University, Bahria, SZABIST, and many more.",
  },
  {
    q: "How are notes moderated?",
    a: "Notes go through automated checks and community voting. Users can report inappropriate content, which is reviewed by moderators within 24 hours.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. We use Supabase with Row Level Security on every table. Your data is never sold. You can delete your account and all data at any time.",
  },
  {
    q: "Can employers see my CV without my permission?",
    a: "No. You control your CV visibility — you can set it to Public, Employers Only, or Private. With Private, only employers you've applied to can see it.",
  },
  {
    q: "How does the AI know about my university's curriculum?",
    a: "UniConnect AI is powered by Claude, trained on broad academic knowledge. When you upload a note, the AI reads it directly and answers questions from that context.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-panel-glow rounded-xl px-5 transition-all duration-300 ${open ? "active" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-base font-medium text-white/70 group-hover:text-white/90 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-white/25 transition-all duration-300 flex-shrink-0 ${
            open ? "rotate-180 text-purple-400/70" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-white/35 leading-relaxed">{a}</p>
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
    <section className="py-24 px-4 sm:px-6 max-w-3xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white/95">Frequently asked</h2>
        <p className="text-lg text-white/35">Everything you need to know.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="glass-panel p-3 space-y-1"
      >
        {FAQS.map((faq) => (
          <FAQItem key={faq.q} {...faq} />
        ))}
      </motion.div>
    </section>
  );
}
