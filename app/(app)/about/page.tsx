"use client";

import { motion } from "framer-motion";
import { BookOpen, Users, Briefcase, Bot, MessageSquare, Mail, GraduationCap, Heart } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  { icon: BookOpen,      title: "Notes Sharing",      desc: "Upload and discover notes from students across Pakistani universities." },
  { icon: Briefcase,     title: "Jobs & Internships",  desc: "Browse opportunities posted specifically for Pakistani students." },
  { icon: Bot,           title: "AI Study Companion",  desc: "Ask questions about your notes and coursework, powered by Gemini AI." },
  { icon: MessageSquare, title: "Campus Chat",          desc: "Connect with students from your university and beyond in real time." },
  { icon: Users,         title: "Student Profiles",    desc: "Build your academic profile, showcase your work, and find peers." },
  { icon: GraduationCap, title: "University Pages",    desc: "Explore info about universities and connect with fellow students." },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold">
          Uni<span className="text-[rgb(var(--primary))]">Connect</span>
        </h1>
        <p className="text-lg text-[rgb(var(--muted-fg))] max-w-xl mx-auto leading-relaxed">
          Pakistan's first all-in-one platform built exclusively for university students —
          from notes and jobs to AI tutoring and campus communities.
        </p>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="theme-card p-8 space-y-4"
      >
        <h2 className="text-xl font-bold">Our Mission</h2>
        <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
          Pakistani students deserve a platform that understands their unique challenges —
          finding quality study material, landing that first internship, and building a network
          without needing LinkedIn connections abroad. UniConnect was built to solve all of that
          in one place, for free.
        </p>
        <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
          Whether you're at NUST, LUMS, FAST, or a university in Balochistan, UniConnect
          is your campus in the cloud.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold">What's on UniConnect</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.04 }}
              className="theme-card p-5 flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary)/0.1)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[rgb(var(--primary))]" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-[rgb(var(--muted-fg))] leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="theme-card p-8 space-y-4"
      >
        <h2 className="text-xl font-bold">Get in Touch</h2>
        <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
          Have a question, spotted a bug, or interested in advertising on UniConnect?
          Reach out directly — I read every email.
        </p>
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=abdullah.xf90@gmail.com&su=UniConnect"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          abdullah.xf90@gmail.com
        </a>
        <p className="text-xs text-[rgb(var(--muted-fg))]">
          Or use the{" "}
          <Link href="/feedback" className="text-[rgb(var(--primary))] hover:underline">
            Feedback page
          </Link>{" "}
          to send a suggestion directly from within the app.
        </p>
      </motion.div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-center pb-8"
      >
        <p className="text-xs text-[rgb(var(--muted-fg))] flex items-center justify-center gap-1.5">
          Built with <Heart className="w-3 h-3 text-[rgb(var(--destructive))]" /> for Pakistani students
        </p>
      </motion.div>
    </div>
  );
}
