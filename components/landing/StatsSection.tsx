"use client";

import { useRef, useEffect, useState } from "react";
import { useInView, motion } from "framer-motion";

const STATS = [
  { value: 250, suffix: "+",  label: "Universities indexed" },
  { value: 24,  suffix: "/7", label: "AI study partner" },
  { value: 100, suffix: "%",  label: "Free for students" },
  { value: 1,   suffix: " app", label: "Replacing fifteen" },
];

function CountUp({ end, suffix, active }: { end: number; suffix: string; active: boolean }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * end));
      if (step >= steps) { setVal(end); clearInterval(timer); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [active, end]);

  return (
    <span className="tabular-nums">
      {val.toLocaleString()}
      <span className="text-[rgb(var(--fg-3))]">{suffix}</span>
    </span>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-28 sm:py-36 px-4 sm:px-6">
      <div className="max-w-[1240px] mx-auto">
        <p className="eyebrow text-center mb-12 sm:mb-16">By the numbers</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 text-center">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 0.68, 0.32, 1] }}
              className="relative"
            >
              <p className="font-display leading-none text-[clamp(56px,9vw,128px)] tracking-[-0.03em] text-[rgb(var(--fg))]">
                <CountUp end={stat.value} suffix={stat.suffix} active={inView} />
              </p>
              <p className="mt-3 text-sm text-[rgb(var(--fg-2))] tracking-tight max-w-[20ch] mx-auto">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
