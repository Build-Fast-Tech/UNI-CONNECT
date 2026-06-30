import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — UniConnect",
  description: "Help build the platform every Pakistani student uses. Join the UniConnect team.",
};

const VALUES = [
  { title: "Students first", desc: "Every decision starts with whether it genuinely helps a student." },
  { title: "Ship fast", desc: "Small team, quick iterations, real feedback from real campuses." },
  { title: "Build for Pakistan", desc: "Made here, for the students here — with global-quality craft." },
];

export default function CareersPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Careers at UniConnect</h1>
      <p className="mt-4 text-lg text-[rgb(var(--muted-fg))] leading-relaxed">
        We&apos;re a small team building the platform every Pakistani university student uses. If you
        care about education, community, and great products, we&apos;d love to hear from you.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4">How we work</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-xl border border-[rgb(var(--border))] p-4">
            <h3 className="font-semibold">{v.title}</h3>
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-1 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Open roles</h2>
      <div className="rounded-xl border border-[rgb(var(--border))] p-6">
        <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
          We don&apos;t have any open positions right now — but we&apos;re always glad to meet talented
          students and builders. Tell us how you&apos;d like to contribute and we&apos;ll keep you in mind.
        </p>
        <a href="mailto:careers@uniconnect.pk" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[rgb(var(--fg))] text-[rgb(var(--bg))] font-semibold hover:opacity-90 transition-opacity">
          Get in touch
        </a>
      </div>
    </article>
  );
}
