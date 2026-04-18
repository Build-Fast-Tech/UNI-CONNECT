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
  { id: "midnight",   label: "Midnight",   color: "#6366F1" },
  { id: "daylight",   label: "Daylight",   color: "#4F46E5" },
  { id: "emerald",    label: "Emerald",    color: "#10B981" },
  { id: "sunset",     label: "Sunset",     color: "#F97316" },
  { id: "monochrome", label: "Monochrome", color: "#FFFFFF" },
  { id: "crimson",    label: "Crimson",    color: "#DC2626" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
