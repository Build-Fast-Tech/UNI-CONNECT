import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill — small badge/tag primitive. Token-driven.
 *
 * Use for: nav indicators, university chips, status flags, eyebrow labels.
 *
 * tone:
 *   neutral   subtle ink / paper
 *   primary   moss tinted
 *   accent    saffron tinted
 *   positive  green tinted
 *   warning   amber tinted
 *   danger    red tinted
 *   hue-a..f  multi-hue stops (for university chips, avatars, etc.)
 */
const pillVariants = cva(
  [
    "inline-flex items-center gap-1.5 select-none",
    "font-medium leading-none tracking-tight",
    "transition-[background-color,border-color,color] duration-[var(--dur-quick)]",
  ],
  {
    variants: {
      tone: {
        neutral:  "bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg-2))] border border-[rgb(var(--line))]",
        primary:  "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))] border border-[rgb(var(--primary)/0.20)]",
        accent:   "bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))] border border-[rgb(var(--accent)/0.25)]",
        positive: "bg-[rgb(var(--positive)/0.10)] text-[rgb(var(--positive))] border border-[rgb(var(--positive)/0.20)]",
        warning:  "bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))] border border-[rgb(var(--warning)/0.22)]",
        danger:   "bg-[rgb(var(--destructive)/0.10)] text-[rgb(var(--destructive))] border border-[rgb(var(--destructive)/0.22)]",
        outline:  "bg-transparent text-[rgb(var(--fg-2))] border border-[rgb(var(--line-strong))]",
        solid:    "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border border-[rgb(var(--fg))]",
        "hue-a":  "bg-[rgb(var(--hue-a)/0.12)] text-[rgb(var(--hue-a))] border border-[rgb(var(--hue-a)/0.25)]",
        "hue-b":  "bg-[rgb(var(--hue-b)/0.12)] text-[rgb(var(--hue-b))] border border-[rgb(var(--hue-b)/0.25)]",
        "hue-c":  "bg-[rgb(var(--hue-c)/0.12)] text-[rgb(var(--hue-c))] border border-[rgb(var(--hue-c)/0.25)]",
        "hue-d":  "bg-[rgb(var(--hue-d)/0.12)] text-[rgb(var(--hue-d))] border border-[rgb(var(--hue-d)/0.25)]",
        "hue-e":  "bg-[rgb(var(--hue-e)/0.12)] text-[rgb(var(--hue-e))] border border-[rgb(var(--hue-e)/0.25)]",
        "hue-f":  "bg-[rgb(var(--hue-f)/0.12)] text-[rgb(var(--hue-f))] border border-[rgb(var(--hue-f)/0.25)]",
      },
      size: {
        xs: "text-[10px] px-1.5 py-0.5 tracking-wide",
        sm: "text-[11px] px-2   py-0.5 tracking-wide",
        md: "text-xs     px-2.5 py-1",
        lg: "text-sm     px-3   py-1.5",
      },
      shape: {
        pill:   "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
      shape: "pill",
    },
  }
);

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ className, tone, size, shape, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(pillVariants({ tone, size, shape }), className)}
        {...props}
      />
    );
  }
);
Pill.displayName = "Pill";

export { pillVariants };
