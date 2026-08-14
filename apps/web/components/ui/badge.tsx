import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "neutral"
  | "volt"
  | "win"
  | "loss"
  | "warn"
  | "info"
  | "muted"
  | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Показывать индикатор-точку перед текстом. */
  dot?: boolean;
}

const tones: Record<Tone, string> = {
  neutral: "bg-neutral-tint text-fg-2",
  volt: "bg-volt-tint text-volt",
  win: "bg-win-tint text-win",
  loss: "bg-loss-tint text-loss",
  warn: "bg-warn-tint text-warn",
  info: "bg-info-tint text-info",
  muted: "bg-transparent text-muted",
  outline: "border border-hairline-strong text-fg-2",
};

const dots: Record<Tone, string> = {
  neutral: "bg-fg-3",
  volt: "bg-volt animate-pulse",
  win: "bg-win",
  loss: "bg-loss",
  warn: "bg-warn",
  info: "bg-info",
  muted: "bg-muted",
  outline: "bg-fg-3",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 transition-all duration-300 hover:scale-105",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", dots[tone])}
        />
      )}
      {children}
    </span>
  );
}
