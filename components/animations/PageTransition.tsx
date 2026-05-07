"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Lightweight route-change fade-up. Re-keys on pathname so each
 * navigation re-runs the CSS keyframe. No Framer dependency, no
 * AnimatePresence — keeps the bundle small and avoids unmount races
 * in pages that own their own scroll state.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    setKey(pathname);
  }, [pathname]);

  return (
    <div key={key} className="page-fade-up">
      {children}
    </div>
  );
}
