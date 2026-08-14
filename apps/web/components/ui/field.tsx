import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Обёртка формы: label + контрол + hint/error. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-fg-2"
        >
          {label}
          {required && <span className="ml-0.5 text-volt">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p role="alert" className="text-xs text-loss">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
