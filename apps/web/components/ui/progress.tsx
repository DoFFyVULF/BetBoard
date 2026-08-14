import { cn } from "@/lib/cn";

export interface ProgressProps {
  /** 0–100. */
  value: number;
  tone?: "volt" | "win" | "loss" | "warn" | "info";
  /** Подпись слева, значение справа. */
  label?: string;
  className?: string;
  barClassName?: string;
}

const tones = {
  volt: "bg-volt",
  win: "bg-win",
  loss: "bg-loss",
  warn: "bg-warn",
  info: "bg-info",
};

export function Progress({
  value,
  tone = "volt",
  label,
  className,
  barClassName,
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-fg-2">{label}</span>

          <span className="tnum font-mono text-xs text-fg-3">
            {Math.round(clamped)}%
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={cn(
            "relative h-full rounded-full transition-[width] duration-700 ease-out",
            tones[tone],
            barClassName,
          )}
          style={{ width: `${clamped}%` }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "shimmer 2.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
