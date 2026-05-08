import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md";
}

/**
 * Kbd — keyboard key chip. Used in command palette hints and shortcuts.
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, size = "sm", children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-mono font-medium",
          "bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg-2))]",
          "border border-[rgb(var(--line))] border-b-2",
          "rounded-md select-none leading-none",
          size === "sm" ? "h-5 min-w-[20px] px-1.5 text-[10px]" : "h-6 min-w-[24px] px-2 text-xs",
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";
