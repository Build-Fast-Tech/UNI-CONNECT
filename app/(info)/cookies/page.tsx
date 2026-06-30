import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — UniConnect",
  description: "How UniConnect uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <article className="space-y-5">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Cookie Policy</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted-fg))]">Last updated: 30 June 2026</p>
      </header>

      <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
        UniConnect uses cookies and similar technologies to keep you signed in, remember your
        preferences, and understand how the service is used. This page explains what they do.
      </p>

      <Section title="Essential cookies">
        These keep you logged in and the platform secure — for example, your authentication session. The
        service can&apos;t function properly without them.
      </Section>

      <Section title="Preference storage">
        We use local storage to remember choices like your theme (light/dark) and which chats you&apos;ve
        read, so your experience stays consistent across visits.
      </Section>

      <Section title="Analytics">
        We use privacy-respecting analytics to understand aggregate usage and improve the product. These
        do not identify you personally.
      </Section>

      <Section title="Managing cookies">
        You can clear or block cookies through your browser settings. Note that disabling essential
        cookies will prevent you from signing in and using core features.
      </Section>

      <Section title="Contact">
        Questions about cookies? Email{" "}
        <a className="underline" href="mailto:privacy@uniconnect.pk">privacy@uniconnect.pk</a>.
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
