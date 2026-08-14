import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

/** Плейсхолдер загрузки: тихая пульсация. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-surface-3", className)}
      style={{
        animationDuration: "2s",
      }}
    />
  );
}