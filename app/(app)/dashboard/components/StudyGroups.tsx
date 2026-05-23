"use client";

import { Card } from "./Card";

export const StudyGroups = () => {
  const groups = [
    { id: 1, name: "Chemistry Lab Partners", members: 4 },
    { id: 2, name: "AI Project Squad", members: 5 },
    { id: 3, name: "Economics Discussion", members: 3 },
  ];

  return (
    <Card title="Active Study Groups">
      <ul className="space-y-2 text-sm text-[var(--fg)]">
        {groups.map((g) => (
          <li key={g.id}>
            {g.name}
            <span className="ml-2 text-xs text-[var(--accent)]">
              ({g.members} members)
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
