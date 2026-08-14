import { cn } from "@/lib/cn";

export interface WordmarkProps {
  className?: string;
}

/** Словесный знак BetBoard: квадрат-табло с «B» + имя. */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-volt font-mono text-[13px] font-black leading-none text-volt-ink shadow-[0_0_14px_rgba(215,255,62,0.4)]">
        B
      </span>
      <span className="font-display text-[15px] font-black tracking-tight text-fg">
        BetBoard
      </span>
    </span>
  );
}
