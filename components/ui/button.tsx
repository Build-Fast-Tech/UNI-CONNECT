"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl",
    "transition-all duration-200 select-none cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.97]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))]",
          "hover:brightness-110 hover:shadow-[0_0_20px_rgb(var(--primary)/0.4)]",
        ],
        secondary: [
          "bg-[rgb(var(--muted))] text-[rgb(var(--fg))]",
          "hover:bg-[rgb(var(--muted)/0.8)]",
        ],
        ghost: [
          "bg-transparent text-[rgb(var(--fg))]",
          "hover:bg-[rgb(var(--muted))]",
        ],
        outline: [
          "bg-transparent border border-[rgb(var(--border))] text-[rgb(var(--fg))]",
          "hover:bg-[rgb(var(--muted))] hover:border-[rgb(var(--primary)/0.5)]",
        ],
        accent: [
          "bg-[rgb(var(--accent))] text-[rgb(var(--accent-fg))]",
          "hover:brightness-110 hover:shadow-[0_0_20px_rgb(var(--accent)/0.4)]",
        ],
        destructive: [
          "bg-[rgb(var(--destructive))] text-white",
          "hover:brightness-110",
        ],
      },
      size: {
        sm:  "h-8  px-3  text-sm",
        md:  "h-10 px-4  text-sm",
        lg:  "h-12 px-6  text-base",
        xl:  "h-14 px-8  text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
