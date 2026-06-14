"use client";

import { useEffect, useRef } from "react";
import { Bot, Users, FileText, Code2, ScrollText, Briefcase } from "lucide-react";

/**
 * Hero orbital centerpiece — feature modules placed on a circle around a central
 * "core", with SVG connector rings, dots travelling the spokes, and a subtle
 * mouse-parallax 3-D tilt. Positions are computed once (deterministic) so SSR
 * and client markup match. Honors prefers-reduced-motion via CSS.
 */
const CENTER = 280;
const R = 210;

const RAW_MODULES = [
  { name: "AI Assistant",    Icon: Bot,        angle: -90 },
  { name: "Community",       Icon: Users,      angle: -30 },
  { name: "Notes",           Icon: FileText,   angle: 30 },
  { name: "Coding",          Icon: Code2,      angle: 90 },
  { name: "Resume Builder",  Icon: ScrollText, angle: 150 },
  { name: "Career Hub",      Icon: Briefcase,  angle: 210 },
];

const MODULES = RAW_MODULES.map((m, i) => {
  const rad = (m.angle * Math.PI) / 180;
  const pct = (R / 560) * 100;
  return {
    ...m,
    leftPct: 50 + pct * Math.cos(rad),
    topPct: 50 + pct * Math.sin(rad),
    px: CENTER + R * Math.cos(rad),
    py: CENTER + R * Math.sin(rad),
    z: 10 + (i % 3) * 16,
    dur: 5.5 + i * 0.5,
    delay: (i / RAW_MODULES.length) * 3.6,
  };
});

export function Orbital() {
  const stageRef = useRef<HTMLDivElement>(null);
  const orbitalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const orbital = orbitalRef.current;
    if (!stage || !orbital) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      orbital.style.transform = `rotateY(${cx * 12}deg) rotateX(${-cy * 12}deg)`;
      raf = requestAnimationFrame(loop);
    };
    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="orbital-stage" ref={stageRef}>
      <div className="orbital-glow" />
      <svg className="orbit-svg" viewBox="0 0 560 560" aria-hidden="true">
        <circle className="orbit-ring" cx={CENTER} cy={CENTER} r={R} />
        <circle className="orbit-ring" cx={CENTER} cy={CENTER} r={140} style={{ opacity: 0.6 }} />
        <g>
          {MODULES.map((m, i) => (
            <line key={i} className="orbit-link" x1={CENTER} y1={CENTER} x2={m.px} y2={m.py} />
          ))}
        </g>
        <g>
          {MODULES.map((m, i) => (
            <circle
              key={i}
              className="orbit-dot"
              cx={CENTER}
              cy={CENTER}
              r={3}
              style={{
                ["--dx" as string]: `${m.px - CENTER}px`,
                ["--dy" as string]: `${m.py - CENTER}px`,
                animationDelay: `${m.delay}s`,
              }}
            />
          ))}
        </g>
      </svg>

      <div className="orbital" ref={orbitalRef}>
        <div className="core">
          <span className="core-mark">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 4v8a5 5 0 0 0 10 0V4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="core-label">UniConnect<br />Core</span>
        </div>

        {MODULES.map((m, i) => (
          <div
            key={m.name}
            className="module"
            style={{ left: `${m.leftPct}%`, top: `${m.topPct}%`, ["--z" as string]: `${m.z}px` }}
          >
            <div className="m-float" style={{ ["--dur" as string]: `${m.dur}s` }}>
              <div className="m-icon"><m.Icon strokeWidth={1.8} /></div>
            </div>
            <div className="m-name">{m.name}</div>
          </div>
        ))}
      </div>

      <div className="hero-hint reveal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
        </svg>
        Move your mouse to explore
      </div>
    </div>
  );
}
