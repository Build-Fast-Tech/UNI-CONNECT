import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — UniConnect",
  description: "UniConnect is Pakistan's all-in-one platform for university students — notes, chat, jobs, and AI tutoring.",
};

const FEATURES = [
  { title: "Shared notes library", desc: "Upload and discover notes from every university, subject, and semester." },
  { title: "Campus & global chat", desc: "Talk to students in your university, your branch, and across all of Pakistan." },
  { title: "Jobs & internships", desc: "Employers post roles filtered by university; students apply in one click with their CV." },
  { title: "AI study companion", desc: "Ask anything, summarise your notes, and prepare for exams — available 24/7." },
];

export default function AboutPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">About UniConnect</h1>
      <p className="mt-4 text-lg text-[rgb(var(--muted-fg))] leading-relaxed">
        UniConnect is Pakistan&apos;s first all-in-one platform built exclusively for university
        students. We brought scattered WhatsApp groups, shared drives, job boards, and study
        tools into one clean, fast product — so you can spend less time hunting and more time
        learning.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">Our mission</h2>
      <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
        Every Pakistani student deserves the same access to notes, community, opportunities, and
        guidance — regardless of which campus they&apos;re on. UniConnect exists to level that
        playing field and connect students nationwide.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4">What&apos;s inside</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-[rgb(var(--border))] p-4">
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-1 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] font-semibold hover:opacity-90 transition-opacity">
          Join UniConnect free
        </Link>
        <Link href="/universities" className="px-5 py-2.5 rounded-xl border border-[rgb(var(--border))] font-semibold hover:bg-[rgb(var(--muted))] transition-colors">
          Browse universities
        </Link>
      </div>
    </article>
  );
}
