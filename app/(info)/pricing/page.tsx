import Link from "next/link";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — UniConnect",
  description: "UniConnect is free for students. Upgrade to Pro for unlimited AI and advanced CV tools.",
};

const TIERS = [
  {
    name: "Free",
    price: "Rs 0",
    note: "Everything a student needs to get started.",
    cta: "Get started",
    href: "/signup",
    highlight: false,
    feats: [
      "University, branch & all-Pakistan chat",
      "Unlimited notes — upload & download",
      "Apply to jobs with your CV",
      "Daily AI study messages",
      "Calendar, GPA & study tools",
    ],
  },
  {
    name: "Pro",
    price: "Coming soon",
    note: "For students who want unlimited everything.",
    cta: "Join the waitlist",
    href: "/signup",
    highlight: true,
    feats: [
      "Everything in Free",
      "Unlimited AI messages",
      "Advanced CV analysis & visibility",
      "Priority job placement",
      "Early access to new features",
    ],
  },
];

export default function PricingPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, student-friendly pricing</h1>
      <p className="mt-4 text-lg text-[rgb(var(--muted-fg))] leading-relaxed">
        UniConnect is free for students — and always will be. A Pro tier is on the way for those who
        want unlimited AI and advanced career tools.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        {TIERS.map((t) => (
          <div key={t.name} className={`rounded-2xl border p-6 ${t.highlight ? "border-[rgb(var(--fg))]" : "border-[rgb(var(--border))]"}`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold">{t.name}</h2>
              <span className="text-sm font-semibold text-[rgb(var(--muted-fg))]">{t.price}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">{t.note}</p>
            <ul className="mt-5 space-y-2.5">
              {t.feats.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 mt-0.5 shrink-0" /> <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href={t.href} className={`mt-6 block text-center px-5 py-2.5 rounded-xl font-semibold transition-opacity ${t.highlight ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] hover:opacity-90" : "border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]"}`}>
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-xs text-[rgb(var(--muted-fg))] mt-8">
        Pricing for the Pro tier will be announced before launch. Students will always have a free plan.
      </p>
    </article>
  );
}
