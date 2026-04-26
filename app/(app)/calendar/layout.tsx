import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar & AI Scheduler",
  description:
    "Plan your semester with the UniConnect Calendar. Use the AI Schedule Generator to create personalized daily study plans with time blocks — Pakistan's #1 AI University Planner.",
  keywords: [
    "AI university planner", "student calendar pakistan", "study schedule generator",
    "AI study planner", "semester planner", "university schedule app",
  ],
  openGraph: {
    title: "UniConnect Calendar — AI Study Scheduler",
    description: "Generate AI-powered study schedules and manage your university calendar.",
    type: "website",
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
