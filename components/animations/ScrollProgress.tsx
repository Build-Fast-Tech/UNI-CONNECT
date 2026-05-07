"use client";

import { useEffect, useRef } from "react";

/**
 * Thin gradient bar pinned to the top of the viewport that fills as
 * the user scrolls the page. Listens on `window` for marketing pages
 * or on a passed `scrollRef` for the authenticated app shell whose
 * scroll lives on `<main>`.
 */
export function ScrollProgress({
  scrollRef,
}: {
  scrollRef?: React.RefObject<HTMLElement | null>;
}) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target: HTMLElement | Window = scrollRef?.current ?? window;

    const update = () => {
      const el = scrollRef?.current;
      const scrollTop = el ? el.scrollTop : window.scrollY;
      const max = el
        ? el.scrollHeight - el.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${pct})`;
    };

    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollRef]);

  return <div ref={bar} className="scroll-progress" aria-hidden />;
}
