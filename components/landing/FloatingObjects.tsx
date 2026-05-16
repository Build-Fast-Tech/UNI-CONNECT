"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface FloatingItem {
  id: number;
  emoji: string;
  x: number;       // % from left
  startY: number;  // starting Y offset (vh units, positive = below screen)
  endY: number;    // ending Y offset (vh units, negative = above viewport)
  size: number;    // rem
  delay: number;   // stagger delay (s)
  rotate: number;  // initial rotation degrees
  rotateEnd: number;
  duration: number; // scroll range (fraction of total page)
  opacity: number;
}

const OBJECTS: FloatingItem[] = [
  // Books
  { id: 1,  emoji: "📚", x: 8,  startY: 20,  endY: -180, size: 2.8, delay: 0,    rotate: -12, rotateEnd: 8,   duration: 0.9, opacity: 0.9 },
  { id: 2,  emoji: "📖", x: 82, startY: 10,  endY: -200, size: 3.2, delay: 0,    rotate: 15,  rotateEnd: -5,  duration: 1.0, opacity: 0.85 },
  { id: 3,  emoji: "📗", x: 55, startY: 30,  endY: -150, size: 2.4, delay: 0,    rotate: -8,  rotateEnd: 12,  duration: 0.85, opacity: 0.8 },
  { id: 4,  emoji: "📘", x: 30, startY: 50,  endY: -220, size: 2.6, delay: 0,    rotate: 20,  rotateEnd: -10, duration: 0.95, opacity: 0.88 },
  { id: 5,  emoji: "📙", x: 70, startY: 40,  endY: -170, size: 2.2, delay: 0,    rotate: -5,  rotateEnd: 18,  duration: 0.8, opacity: 0.82 },
  // Notes / paper
  { id: 6,  emoji: "📝", x: 18, startY: 15,  endY: -190, size: 2.6, delay: 0,    rotate: 10,  rotateEnd: -15, duration: 0.88, opacity: 0.9 },
  { id: 7,  emoji: "📄", x: 92, startY: 25,  endY: -160, size: 2.0, delay: 0,    rotate: -18, rotateEnd: 6,   duration: 0.82, opacity: 0.78 },
  { id: 8,  emoji: "📃", x: 45, startY: 60,  endY: -210, size: 2.2, delay: 0,    rotate: 8,   rotateEnd: -12, duration: 0.92, opacity: 0.85 },
  { id: 9,  emoji: "🗒️", x: 63, startY: 70,  endY: -180, size: 2.4, delay: 0,    rotate: -22, rotateEnd: 10,  duration: 0.78, opacity: 0.8 },
  { id: 10, emoji: "📋", x: 4,  startY: 80,  endY: -230, size: 2.0, delay: 0,    rotate: 15,  rotateEnd: -8,  duration: 0.96, opacity: 0.75 },
  // Pens / pencils
  { id: 11, emoji: "✏️", x: 38, startY: 35,  endY: -165, size: 2.2, delay: 0,    rotate: 45,  rotateEnd: 20,  duration: 0.84, opacity: 0.9 },
  { id: 12, emoji: "🖊️", x: 76, startY: 55,  endY: -200, size: 2.0, delay: 0,    rotate: -45, rotateEnd: -20, duration: 0.88, opacity: 0.85 },
  { id: 13, emoji: "🖋️", x: 22, startY: 90,  endY: -240, size: 2.4, delay: 0,    rotate: 30,  rotateEnd: 10,  duration: 0.76, opacity: 0.82 },
  // Backpack / school bag
  { id: 14, emoji: "🎒", x: 88, startY: 45,  endY: -175, size: 3.0, delay: 0,    rotate: -10, rotateEnd: 15,  duration: 0.9, opacity: 0.88 },
  // Calculator / ruler
  { id: 15, emoji: "🔢", x: 12, startY: 65,  endY: -195, size: 2.0, delay: 0,    rotate: 5,   rotateEnd: -20, duration: 0.86, opacity: 0.78 },
  { id: 16, emoji: "📐", x: 50, startY: 85,  endY: -250, size: 2.2, delay: 0,    rotate: -35, rotateEnd: 0,   duration: 0.72, opacity: 0.8 },
  // Graduation / star
  { id: 17, emoji: "🎓", x: 34, startY: 100, endY: -260, size: 2.6, delay: 0,    rotate: 0,   rotateEnd: 15,  duration: 0.88, opacity: 0.85 },
  { id: 18, emoji: "⭐", x: 96, startY: 75,  endY: -185, size: 1.8, delay: 0,    rotate: 20,  rotateEnd: -20, duration: 0.8, opacity: 0.7 },
  // Laptop / computer
  { id: 19, emoji: "💻", x: 60, startY: 110, endY: -280, size: 2.8, delay: 0,    rotate: -8,  rotateEnd: 8,   duration: 0.95, opacity: 0.88 },
  // Light bulb (ideas!)
  { id: 20, emoji: "💡", x: 25, startY: 120, endY: -300, size: 2.2, delay: 0,    rotate: 0,   rotateEnd: -10, duration: 1.0, opacity: 0.82 },
];

function FloatingObject({ item, scrollProgress }: { item: FloatingItem; scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const y = useTransform(
    scrollProgress,
    [0, 1],
    [`${item.startY}vh`, `${item.endY}vh`]
  );
  const rotate = useTransform(
    scrollProgress,
    [0, 1],
    [item.rotate, item.rotateEnd]
  );
  const opacity = useTransform(
    scrollProgress,
    [0, 0.05, 0.85, 1],
    [0, item.opacity, item.opacity, 0]
  );

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${item.x}%`,
        bottom: 0,
        y,
        rotate,
        opacity,
        fontSize: `${item.size}rem`,
        filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.4))",
        willChange: "transform, opacity",
      }}
    >
      {item.emoji}
    </motion.div>
  );
}

export function FloatingObjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {OBJECTS.map(item => (
        <FloatingObject key={item.id} item={item} scrollProgress={scrollYProgress} />
      ))}
    </div>
  );
}
