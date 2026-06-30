import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — UniConnect",
  description: "Privacy Policy, Terms of Service, and Cookie Policy for UniConnect.",
};

const DOCS = [
  { title: "Privacy Policy", href: "/privacy", desc: "What data we collect, why, and how we protect it." },
  { title: "Terms of Service", href: "/terms", desc: "The rules for using UniConnect and what you can expect from us." },
  { title: "Cookie Policy", href: "/cookies", desc: "How and why we use cookies and similar technologies." },
];

export default function LegalPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Legal</h1>
      <p className="mt-4 text-lg text-[rgb(var(--muted-fg))] leading-relaxed">
        The policies that govern your use of UniConnect. We aim to keep them short and readable.
      </p>

      <div className="mt-10 space-y-3">
        {DOCS.map((d) => (
          <Link key={d.href} href={d.href} className="block rounded-xl border border-[rgb(var(--border))] p-5 hover:bg-[rgb(var(--muted))] transition-colors">
            <h2 className="font-semibold">{d.title}</h2>
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">{d.desc}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
