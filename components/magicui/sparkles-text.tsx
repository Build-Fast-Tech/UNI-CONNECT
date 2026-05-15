"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  className?: string;
  text: string;
  sparklesCount?: number;
  colors?: { first: string; second: string };
}

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateSparkle(colors: { first: string; second: string }): Sparkle {
  return {
    id: Math.random().toString(36).slice(2),
    x: `${randomNumber(10, 90)}%`,
    y: `${randomNumber(10, 90)}%`,
    color: Math.random() > 0.5 ? colors.first : colors.second,
    delay: randomNumber(0, 0.7),
    scale: randomNumber(0.4, 1),
    lifespan: randomNumber(1000, 2000),
  };
}

export function SparklesText({
  text,
  sparklesCount = 10,
  colors = { first: "#9E7AFF", second: "#FE8BBB" },
  className,
}: SparklesTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparks = () => {
      setSparkles(Array.from({ length: sparklesCount }, () => generateSparkle(colors)));
    };
    generateSparks();
    const interval = setInterval(generateSparks, 2000);
    return () => clearInterval(interval);
  }, [sparklesCount, colors]);

  return (
    <div className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="pointer-events-none absolute animate-sparkle"
          style={{
            top: sparkle.y,
            left: sparkle.x,
            animationDelay: `${sparkle.delay}s`,
            transform: `scale(${sparkle.scale})`,
          }}
        >
          <svg
            className="animate-spin"
            style={{ color: sparkle.color, animationDuration: "1s" }}
            width="10"
            height="10"
            viewBox="0 0 160 160"
            fill="none"
          >
            <path
              d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
      <span className="font-bold">{text}</span>
    </div>
  );
}
