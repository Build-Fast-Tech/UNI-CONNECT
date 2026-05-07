import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const THEMES = [
  { id: "midnight",   label: "Midnight",   color: "#818CF8" },
  { id: "daylight",   label: "Daylight",   color: "#F59E0B" },
  { id: "monochrome", label: "Monochrome", color: "#6B7280" },
  { id: "linen",      label: "Linen",      color: "#6B7A5A" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

// Subjects that should always appear in the upload/filter dropdowns, even when
// the `subjects` table hasn't been seeded. Merged with DB results in the UI.
export const FALLBACK_SUBJECTS = [
  "Applied Physics",
  "Artificial Intelligence",
  "Calculus I",
  "Calculus II",
  "Communication Skills",
  "Computer Architecture",
  "Computer Networks",
  "Computer Organization & Assembly",
  "Data Structures",
  "Data Structures & Algorithms",
  "Database Systems",
  "Deep Learning",
  "Differential Equations",
  "Digital Logic Design (DLD)",
  "Discrete Mathematics",
  "Discrete Structures",
  "English Composition",
  "Information Security",
  "Introduction to Computing",
  "Islamic Studies",
  "Linear Algebra",
  "Machine Learning (ML)",
  "Numerical Methods",
  "Object Oriented Programming",
  "Operating Systems",
  "Pakistan Studies",
  "Physics",
  "Probability & Statistics",
  "Programming Fundamentals",
  "Software Engineering",
  "Theory of Automata",
  "Web Technologies",
];

export function mergeSubjects(fromDb: string[]): string[] {
  return Array.from(new Set([...FALLBACK_SUBJECTS, ...fromDb])).sort((a, b) =>
    a.localeCompare(b),
  );
}

// Discord-style typing indicator text.
//   1 name:    "Alice is typing…"
//   2 names:   "Alice and Bob are typing…"
//   3 names:   "Alice, Bob, and Carol are typing…"
//   4+ names:  "Several people are typing…"
export function formatTypingNames(names: string[]): string {
  const n = names.length;
  if (n === 0) return "";
  if (n === 1) return `${names[0]} is typing…`;
  if (n === 2) return `${names[0]} and ${names[1]} are typing…`;
  if (n === 3) return `${names[0]}, ${names[1]}, and ${names[2]} are typing…`;
  return "Several people are typing…";
}
