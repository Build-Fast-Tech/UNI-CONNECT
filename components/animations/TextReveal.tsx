"use client";

import { useMemo } from "react";

interface TextRevealProps {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /** Delay between words in ms */
  stagger?: number;
  /** Initial delay before first word in ms */
  delay?: number;
}

/**
 * Splits text into words and reveals each with a stagger.
 * Used on hero headlines and section titles.
 */
export function TextReveal({
  text,
  as: Tag = "span",
  className,
  stagger = 60,
  delay = 0,
}: TextRevealProps) {
  const words = useMemo(() => text.split(" "), [text]);
  const Component = Tag as any;

  return (
    <Component className={className}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="text-reveal-word"
          style={{ animationDelay: `${delay + i * stagger}ms` }}
        >
          {w}
          {i < words.length - 1 && " "}
        </span>
      ))}
    </Component>
  );
}
