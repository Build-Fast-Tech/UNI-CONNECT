import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — UniConnect",
  description: "How UniConnect collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="space-y-5">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted-fg))]">Last updated: 30 June 2026</p>
      </header>

      <p className="text-[rgb(var(--muted-fg))] leading-relaxed">
        This policy explains what information UniConnect (&quot;we&quot;) collects, how we use it, and the
        choices you have. By using UniConnect you agree to the practices described here.
      </p>

      <Section title="Information we collect">
        We collect the details you provide when you sign up (name, email, university, and an optional
        username), content you upload (notes, CVs, messages, profile information), and basic usage and
        device data needed to run and secure the service.
      </Section>

      <Section title="How we use it">
        We use your information to provide and improve UniConnect — verifying your university, powering
        chat and notes, matching you with relevant jobs, running the AI study assistant, and keeping the
        platform safe. We do not sell your personal data.
      </Section>

      <Section title="Sharing">
        Content you choose to make public (such as uploaded notes or a public CV) is visible to other
        users according to the visibility settings you select. We share data with infrastructure
        providers (such as Supabase for our database and Google Gemini for AI features) solely to operate
        the service, under their respective terms.
      </Section>

      <Section title="Security">
        Your data is protected with row-level security on every database table and encrypted connections.
        No system is perfectly secure, but we work hard to safeguard your information.
      </Section>

      <Section title="Your choices">
        You can edit your profile, control your CV visibility, and delete your account and associated data
        at any time from your settings. To request data access or deletion, contact us.
      </Section>

      <Section title="Contact">
        Questions about this policy? Email us at{" "}
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
