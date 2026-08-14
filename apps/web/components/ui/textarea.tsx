import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const base =
  "min-h-[96px] w-full resize-y rounded-[10px] border bg-surface-2 px-3.5 py-2.5 text-sm text-fg " +
  "transition-all duration-300 " +
  "placeholder:text-muted hover:bg-surface-3/50 " +
  "focus-visible:outline-none focus-visible:border-volt focus-visible:ring-2 focus-visible:ring-volt-ring focus-visible:shadow-[0_0_24px_rgba(215,255,62,0.12)] " +
  "disabled:pointer-events-none disabled:opacity-45";

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        base,
        invalid
          ? "border-loss focus-visible:border-loss focus-visible:ring-loss/30 focus-visible:shadow-[0_0_24px_rgba(251,113,133,0.12)]"
          : "border-hairline-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}