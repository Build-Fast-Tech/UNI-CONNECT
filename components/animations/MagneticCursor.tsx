"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor follower for the marketing/landing pages. Renders a soft
 * outline ring that lerps toward the mouse and grows when hovering
 * over interactive elements (a, button, [data-magnet]).
 *
 * Pure DOM, no Framer Motion — keeps it 60fps on mid-range hardware.
 */
export function MagneticCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    let mx = -100, my = -100;
    let cx = -100, cy = -100;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target as HTMLElement;
      const interactive = !!t.closest("a, button, [data-magnet], input, textarea, select, [role='button']");
      el.dataset.hover = interactive ? "true" : "false";
    };

    const tick = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      el.style.transform = `translate3d(${cx - el.offsetWidth / 2}px, ${cy - el.offsetHeight / 2}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="magnetic-cursor" aria-hidden />;
}
