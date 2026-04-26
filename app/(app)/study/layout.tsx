import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Center — Pomodoro Timer & Study Groups",
  description:
    "Boost your productivity with the UniConnect Study Center. Use the Pomodoro timer, join public study groups, and track your subject mastery — built for Pakistani university students.",
  keywords: [
    "pomodoro timer students", "study groups pakistan", "university productivity",
    "study tracker pakistan", "student study app", "AI study planner",
    "group study online", "subject mastery tracker",
  ],
  openGraph: {
    title: "UniConnect Study Center — Pomodoro & Study Groups",
    description: "Track your studies, join public groups, and stay productive.",
    type: "website",
  },
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": "UniConnect Study Groups",
            "description": "Public study groups for Pakistani university students",
            "url": "https://uniconnect.pk/study",
          }),
        }}
      />
      {children}
    </>
  );
}
