"use client";

import { Card } from "./Card";

export const RecentNotes = () => {
  const notes = [
    { id: 1, title: "Quantum Mechanics Overview", course: "Physics" },
    { id: 2, title: "Modern Poetry Anthology", course: "Literature" },
    { id: 3, title: "Linear Algebra Cheat Sheet", course: "Mathematics" },
  ];

  return (
    <Card title="Recent Notes">
      <ul className="space-y-2 text-sm text-[var(--fg)]">
        {notes.map((n) => (
          <li key={n.id}>
            <strong>{n.title}</strong> – <em>{n.course}</em>
          </li>
        ))}
      </ul>
    </Card>
  );
};
