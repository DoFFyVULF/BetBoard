import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: SelectProps) {
  return (
    <span className={cn("relative block", className)}>
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-[10px] border bg-surface-2 pl-3.5 pr-9 text-sm text-fg " +
            "transition-all duration-300 " +
            "hover:bg-surface-3/50 " +
            "focus-visible:outline-none focus-visible:border-volt focus-visible:ring-2 focus-visible:ring-volt-ring focus-visible:shadow-[0_0_24px_rgba(215,255,62,0.12)] " +
            "disabled:pointer-events-none disabled:opacity-45",
          invalid ? "border-loss" : "border-hairline-strong",
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3 transition-transform duration-300"
      />
    </span>
  );
}