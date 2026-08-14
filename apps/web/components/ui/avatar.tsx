import { cn } from "@/lib/cn";
import type { AvatarColor } from "@/lib/types";

const palettes: Record<AvatarColor, string> = {
  volt: "bg-volt text-volt-ink",
  sky: "bg-info text-[#081318]",
  rose: "bg-loss text-[#1a0b0e]",
  amber: "bg-warn text-[#1a1200]",
  mint: "bg-win text-[#07170c]",
  violet: "bg-[#c084fc] text-[#1a0d2e]",
  slate: "bg-surface-3 text-fg-2 border border-hairline-strong",
};

export interface AvatarProps {
  name: string;
  color?: AvatarColor;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-6 w-6 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-lg",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  color = "slate",
  size = "md",
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold transition-all duration-300 hover:scale-110",
        palettes[color],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
