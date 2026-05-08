"use client";

import { forwardRef, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Editorial button system. Token-driven (no hardcoded color),
 * works under both light and dark themes.
 *
 * variants:
 *   primary     — solid moss, paper text. The single decisive CTA.
 *   accent      — solid saffron, ink text. Use sparingly for warmth.
 *   secondary   — paper-sunken with ink text. Quiet companion.
 *   outline     — hairline border, ink text. Editorial restraint.
 *   ghost       — bare, hover-shadow only. For toolbar / dense UI.
 *   link        — text-only, animated underline.
 *   destructive — solid red. Confirmations only.
 *
 * shape:
 *   square (default) — rounded-2xl, the workhorse
 *   pill             — rounded-full, marketing CTA
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2",
    "font-medium tracking-tight overflow-hidden select-none cursor-pointer",
    "transition-[transform,box-shadow,background-color,border-color,color]",
    "duration-[var(--dur-quick)] ease-[var(--ease-out-soft)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
    "disabled:opacity-50 disabled:pointer-events-none disabled:saturate-50",
    "active:scale-[0.98] active:translate-y-px",
    "whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]",
          "shadow-[0_1px_0_rgb(var(--primary)/0.50),0_8px_18px_-10px_rgb(var(--primary)/0.55)]",
          "hover:shadow-[0_2px_0_rgb(var(--primary)/0.60),0_14px_28px_-10px_rgb(var(--primary)/0.65)]",
          "hover:-translate-y-px",
        ],
        accent: [
          "bg-[rgb(var(--accent))] text-[rgb(var(--accent-fg))]",
          "shadow-[0_1px_0_rgb(var(--accent)/0.50),0_8px_18px_-10px_rgb(var(--accent)/0.55)]",
          "hover:shadow-[0_2px_0_rgb(var(--accent)/0.60),0_14px_28px_-10px_rgb(var(--accent)/0.65)]",
          "hover:-translate-y-px",
        ],
        secondary: [
          "bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg))]",
          "border border-[rgb(var(--line))]",
          "hover:bg-[rgb(var(--bg-elev))] hover:border-[rgb(var(--line-strong))]",
        ],
        outline: [
          "bg-transparent text-[rgb(var(--fg))]",
          "border border-[rgb(var(--line-strong))]",
          "hover:bg-[rgb(var(--bg-sunk))] hover:border-[rgb(var(--fg))]",
        ],
        ghost: [
          "bg-transparent text-[rgb(var(--fg))]",
          "hover:bg-[rgb(var(--bg-sunk))]",
        ],
        link: [
          "bg-transparent text-[rgb(var(--fg))] px-0",
          "underline-offset-4 decoration-1",
          "hover:underline decoration-[rgb(var(--fg-3))]",
        ],
        destructive: [
          "bg-[rgb(var(--destructive))] text-white",
          "shadow-[0_8px_18px_-10px_rgb(var(--destructive)/0.55)]",
          "hover:shadow-[0_14px_28px_-10px_rgb(var(--destructive)/0.65)]",
          "hover:-translate-y-px",
        ],
      },
      size: {
        sm:   "h-8  px-3.5 text-[13px]",
        md:   "h-10 px-5   text-sm",
        lg:   "h-12 px-7   text-[15px]",
        xl:   "h-14 px-9   text-base",
        icon: "h-10 w-10 p-0",
      },
      shape: {
        square: "rounded-2xl",
        pill:   "rounded-full",
      },
    },
    compoundVariants: [
      { variant: "link", size: "sm", className: "h-auto px-0" },
      { variant: "link", size: "md", className: "h-auto px-0" },
      { variant: "link", size: "lg", className: "h-auto px-0" },
      { variant: "link", size: "xl", className: "h-auto px-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "square",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, shape, loading, children, disabled, onPointerDown, ...props },
    ref
  ) => {
    const localRef = useRef<HTMLButtonElement>(null);
    const setRefs = (node: HTMLButtonElement) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);
      const btn = localRef.current;
      if (!btn) return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const dim = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;
        left:${e.clientX - rect.left - dim / 2}px;
        top:${e.clientY - rect.top - dim / 2}px;
        width:${dim}px;height:${dim}px;
        border-radius:9999px;
        background:currentColor;
        opacity:0.18;
        pointer-events:none;
        animation:btn-ripple 600ms ease-out forwards;
      `;
      btn.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    };

    return (
      <button
        ref={setRefs}
        className={cn(buttonVariants({ variant, size, shape }), className)}
        disabled={disabled || loading}
        onPointerDown={handlePointerDown}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
