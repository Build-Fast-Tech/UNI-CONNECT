import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — UniConnect",
  description: "Study tips, product updates, and stories from the UniConnect community.",
};

const POSTS = [
  { title: "Getting the most out of the notes library", tag: "Guide", date: "Coming soon" },
  { title: "How to land your first internship as a Pakistani student", tag: "Careers", date: "Coming soon" },
  { title: "Study smarter with the AI companion", tag: "Product", date: "Coming soon" },
];

export default function BlogPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">The UniConnect Blog</h1>
      <p className="mt-4 text-lg text-[rgb(var(--muted-fg))] leading-relaxed">
        Study tips, product updates, and stories from students across Pakistan. We&apos;re putting the
        first posts together — here&apos;s what&apos;s coming.
      </p>

      <div className="mt-10 space-y-3">
        {POSTS.map((p) => (
          <div key={p.title} className="rounded-xl border border-[rgb(var(--border))] p-5 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted-fg))]">{p.tag}</span>
              <h2 className="font-semibold mt-0.5">{p.title}</h2>
            </div>
            <span className="text-xs text-[rgb(var(--muted-fg))] whitespace-nowrap">{p.date}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[rgb(var(--border))] p-6 text-center">
        <p className="font-semibold">Want updates in your inbox?</p>
        <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">Create an account and we&apos;ll let you know when the blog goes live.</p>
        <Link href="/signup" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] font-semibold hover:opacity-90 transition-opacity">
          Join UniConnect free
        </Link>
      </div>
    </article>
  );
}
