import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Surface — token-driven card primitive.
 *
 * tone:
 *   default  paper / bg-elev      (primary card)
 *   sunken   bg-sunk              (form well, secondary group)
 *   inverted ink                  (the dramatic dark card on light pages)
 *
 * elevation:
 *   flat   no shadow
 *   low    soft micro-shadow
 *   mid    standard card lift
 *   high   modal / popover
 */
const surfaceVariants = cva(
  ["transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-soft)]"],
  {
    variants: {
      tone: {
        default:  "bg-[rgb(var(--bg-elev))] text-[rgb(var(--fg))] border border-[rgb(var(--line))]",
        sunken:   "bg-[rgb(var(--bg-sunk))] text-[rgb(var(--fg))] border border-[rgb(var(--line))]",
        inverted: "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border border-[rgb(var(--fg))]",
        ghost:    "bg-transparent text-[rgb(var(--fg))] border border-[rgb(var(--line))]",
      },
      elevation: {
        flat: "",
        low:  "shadow-[var(--shadow-sm)]",
        mid:  "shadow-[var(--shadow-md)]",
        high: "shadow-[var(--shadow-lg)]",
      },
      radius: {
        sm:   "rounded-xl",
        md:   "rounded-2xl",
        lg:   "rounded-3xl",
        none: "rounded-none",
      },
      interactive: {
        true:  "tilt-glow cursor-default",
        false: "",
      },
    },
    defaultVariants: {
      tone: "default",
      elevation: "low",
      radius: "md",
      interactive: false,
    },
  }
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, tone, elevation, radius, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(surfaceVariants({ tone, elevation, radius, interactive }), className)}
        {...props}
      />
    );
  }
);
Surface.displayName = "Surface";
