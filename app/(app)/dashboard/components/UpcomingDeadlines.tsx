"use client";

import { Card } from "./Card";

export const UpcomingDeadlines = () => {
  const tasks = [
    { id: 1, title: "Submit Assignment 4", due: "2026-05-30" },
    { id: 2, title: "Mid-term Exam", due: "2026-06-12" },
    { id: 3, title: "Project Demo", due: "2026-06-20" },
  ];

  return (
    <Card title="Upcoming Deadlines">
      <ul className="space-y-2 text-sm text-[var(--fg)]">
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> – <em>{t.due}</em>
          </li>
        ))}
      </ul>
    </Card>
  );
};
