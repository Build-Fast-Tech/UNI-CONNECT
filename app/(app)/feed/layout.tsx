import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — Student Productivity Hub",
  description:
    "Your university dashboard on UniConnect. Access notes, study groups, job listings, AI tutor, and real-time chat — Pakistan's #1 Student Productivity Hub.",
  keywords: [
    "student productivity hub", "pakistani university app", "student dashboard",
    "university notes chat jobs", "AI university assistant pakistan",
  ],
  openGraph: {
    title: "UniConnect — Pakistan's Student Productivity Hub",
    description: "Notes, chat, jobs, AI tutor and study tools — all in one place for Pakistani students.",
    type: "website",
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
