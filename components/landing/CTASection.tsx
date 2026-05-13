"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 50%, rgb(var(--primary) / 0.3) 0%, transparent 60%)`
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: `radial-gradient(ellipse, rgb(var(--accent) / 0.2) 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
          style={{ fontFamily: "var(--font-instrument-serif, serif)" }}
        >
          Ready to{" "}
          <span className="gradient-text">connect?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-xl text-[rgb(var(--muted-fg))] mb-10 max-w-2xl mx-auto"
        >
          Join 2,400+ students from across Pakistan who are already sharing notes, chatting, and landing jobs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/signup">
            <Button variant="primary" size="xl" className="group glow">
              Join UniConnect Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/universities">
            <Button variant="outline" size="xl">
              Browse Universities
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
