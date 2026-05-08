"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraMesh } from "@/components/animations/AuroraMesh";

export function CTASection() {
  return (
    <section className="relative py-32 sm:py-40 px-4 sm:px-6 overflow-hidden">
      <AuroraMesh />

      <div className="relative max-w-[1240px] mx-auto text-center">
        <p className="eyebrow mb-6">A standing invitation</p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 0.68, 0.32, 1] }}
          className="font-display text-[clamp(56px,11vw,180px)] leading-[0.92] tracking-[-0.025em] text-[rgb(var(--fg))]"
        >
          Ready to{" "}
          <em className="italic text-[rgb(var(--accent))]">connect?</em>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 0.68, 0.32, 1] }}
          className="mt-8 text-[17px] sm:text-lg text-[rgb(var(--fg-2))] max-w-[52ch] mx-auto leading-relaxed"
        >
          Join thousands of students sharing notes, asking better questions,
          and landing better roles — across every campus in Pakistan.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/signup" data-magnet>
            <Button variant="primary" size="xl" shape="pill" className="group">
              Join UniConnect free
              <ArrowUpRight className="w-5 h-5 transition-transform duration-[var(--dur-quick)] group-hover:rotate-45" />
            </Button>
          </Link>
          <Link href="/universities" data-magnet>
            <Button variant="ghost" size="xl" shape="pill">
              Browse universities
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-xs font-mono tracking-widest text-[rgb(var(--fg-3))]"
        >
          NO CREDIT CARD · NO SPAM · NO BS
        </motion.p>
      </div>
    </section>
  );
}
