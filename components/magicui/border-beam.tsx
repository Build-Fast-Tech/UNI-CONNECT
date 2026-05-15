import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--delay": `-${delay}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--border-width": borderWidth,
        } as CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(transparent,transparent),linear-gradient(to_right,var(--color-from),var(--color-to))]",
        "[background-attachment:fixed]",
        "[mask-composite:intersect]",
        "[background-clip:padding-box,border-box]",
        "animate-border-beam",
        className,
      )}
    />
  );
}
