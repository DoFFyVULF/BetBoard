import { cn } from "@/lib/cn";

export interface LogoMarkProps {
  className?: string;
}

/** Марка-квадрат «табло», используется изолированно (аватарки, favicon-контексты). */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-xl bg-volt font-mono font-black text-volt-ink shadow-[0_0_24px_rgba(215,255,62,0.35)]",
        className,
      )}
    >
      B
    </span>
  );
}
