"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

const STATS = [
  { value: 100, suffix: "+", label: "Universities" },
  { value: 24, suffix: "/7", label: "AI Help" },
  { value: 100, suffix: "%", label: "Free to Join" },
  { value: 1, suffix: " App", label: "Everything in" },
];

function CountUp({ end, suffix, active }: { end: number; suffix: string; active: boolean }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(easedProgress * end));
      if (step >= steps) { setVal(end); clearInterval(timer); }
    }, stepTime);

    return () => clearInterval(timer);
  }, [active, end]);

  return (
    <span>
      {val.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 border-y border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.2)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label} className="space-y-2">
              <p className="text-4xl sm:text-5xl font-bold gradient-text tabular-nums">
                <CountUp end={stat.value} suffix={stat.suffix} active={inView} />
              </p>
              <p className="text-sm text-[rgb(var(--muted-fg))] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
