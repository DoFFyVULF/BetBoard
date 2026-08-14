import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Дельта, например «+120». */
  trend?: ReactNode;
  trendTone?: "win" | "loss" | "neutral";
  className?: string;
}

export function Stat({
  label,
  value,
  hint,
  trend,
  trendTone = "neutral",
  className,
}: StatProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-hairline bg-surface px-4 py-3.5 transition-all duration-300 hover:border-volt/40",
        className,
      )}
    >
      <div className="text-xs font-medium text-fg-2">{label}</div>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="tnum font-mono text-2xl font-bold tracking-tight text-fg">
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              "tnum font-mono text-xs font-medium",
              trendTone === "win"
                ? "text-win"
                : trendTone === "loss"
                  ? "text-loss"
                  : "text-fg-3",
            )}
          >
            {trend}
          </span>
        )}
      </div>

      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
