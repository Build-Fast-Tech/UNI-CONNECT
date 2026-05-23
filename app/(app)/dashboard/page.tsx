"use client";

import { motion } from "framer-motion";
import { RecentNotes } from "./components/RecentNotes";
import { StudyGroups } from "./components/StudyGroups";
import { UpcomingDeadlines } from "./components/UpcomingDeadlines";

export default function Dashboard() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: "ease-out" }}
      className="min-h-screen p-6 lg:p-10 bg-[var(--bg)] text-[var(--fg)]"
    >
      {/* Sticky glass navigation */}
      <header className="sticky top-0 z-20 mb-6 glass backdrop-blur-sm p-4 shadow-sm">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
      </header>

      {/* Bento‑box responsive grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <RecentNotes />
        <StudyGroups />
        <UpcomingDeadlines />
      </section>
    </motion.main>
  );
}
