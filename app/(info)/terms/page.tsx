import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — UniConnect",
  description: "The terms that govern your use of UniConnect.",
};

export default function TermsPage() {
  return (
    <article className="space-y-5">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted-fg))]">Last updated: 30 June 2026</p>
      </header>

      <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
        These terms govern your use of UniConnect. By creating an account or using the service, you agree
        to them.
      </p>

      <Section title="Eligibility">
        UniConnect is intended for university students and the people who hire them. You are responsible
        for the accuracy of the information you provide, including your university affiliation.
      </Section>

      <Section title="Your content">
        You retain ownership of the notes, CVs, and other content you upload. By uploading, you grant us a
        licence to host and display that content within the service according to your visibility settings.
        Only upload content you have the right to share.
      </Section>

      <Section title="Acceptable use">
        Don&apos;t post unlawful, harmful, or infringing content; don&apos;t harass other users; and
        don&apos;t attempt to disrupt, abuse, or gain unauthorised access to the platform. We may remove
        content or suspend accounts that violate these terms.
      </Section>

      <Section title="AI features">
        The AI study assistant provides automated, best-effort responses for learning support. It can make
        mistakes — always verify important information independently.
      </Section>

      <Section title="Availability & changes">
        We provide UniConnect on an &quot;as is&quot; basis and may update, suspend, or discontinue features
        over time. We&apos;ll make reasonable efforts to keep the service running smoothly.
      </Section>

      <Section title="Contact">
        Questions about these terms? Email{" "}
        <a className="underline" href="mailto:legal@uniconnect.pk">legal@uniconnect.pk</a>.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mt-8 mb-2">{title}</h2>
      <p className="text-[rgb(var(--muted-fg))] leading-relaxed">{children}</p>
    </section>
  );
}
