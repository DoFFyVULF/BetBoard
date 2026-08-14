import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Подсветить красным (ошибка валидации). */
  invalid?: boolean;
}

const base =
  "h-10 w-full rounded-[10px] border bg-surface-2 px-3.5 text-sm text-fg " +
  "transition-all duration-300 " +
  "placeholder:text-muted hover:bg-surface-3/50 " +
  "focus-visible:outline-none focus-visible:border-volt focus-visible:ring-2 focus-visible:ring-volt-ring focus-visible:shadow-[0_0_24px_rgba(215,255,62,0.15)] " +
  "disabled:pointer-events-none disabled:opacity-45";

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        base,
        invalid
          ? "border-loss focus-visible:border-loss focus-visible:ring-loss/30"
          : "border-hairline-strong",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
