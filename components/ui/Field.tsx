import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix">;

interface FieldProps extends NativeInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

/**
 * Field — token-driven input with optional label, hint, error, and
 * left/right adornments. The wrapper handles focus and error styling
 * so the input itself stays clean and themable.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ className, label, hint, error, prefix, suffix, id, ...props }, ref) => {
    const errored = !!error;
    const fieldId = id ?? props.name;

    return (
      <label htmlFor={fieldId} className="flex flex-col gap-1.5 text-sm w-full">
        {label && (
          <span className="font-medium text-[rgb(var(--fg))] tracking-tight">
            {label}
          </span>
        )}
        <span
          className={cn(
            "group flex items-center gap-2.5 h-11 px-3.5 rounded-xl",
            "bg-[rgb(var(--field))] border transition-[border-color,box-shadow]",
            "duration-[var(--dur-quick)] ease-[var(--ease-out-soft)]",
            "focus-within:border-[rgb(var(--ring))] focus-within:shadow-[0_0_0_4px_rgb(var(--ring)/0.14)]",
            errored
              ? "border-[rgb(var(--destructive))]"
              : "border-[rgb(var(--field-line))]"
          )}
        >
          {prefix && (
            <span className="text-[rgb(var(--fg-3))] flex items-center">{prefix}</span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={cn(
              "flex-1 min-w-0 bg-transparent border-0 outline-none",
              "text-[rgb(var(--field-fg))] placeholder:text-[rgb(var(--fg-3))]",
              "text-sm font-normal",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="text-[rgb(var(--fg-3))] flex items-center">{suffix}</span>
          )}
        </span>
        {(hint || error) && (
          <span
            className={cn(
              "text-xs leading-snug",
              errored ? "text-[rgb(var(--destructive))]" : "text-[rgb(var(--fg-3))]"
            )}
          >
            {error ?? hint}
          </span>
        )}
      </label>
    );
  }
);
Field.displayName = "Field";
