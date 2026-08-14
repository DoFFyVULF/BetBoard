import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-hairline-strong bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-tint text-fg-3">
          {icon}
        </div>
      )}

      <div>
        <h3 className="text-[15px] font-bold text-fg">{title}</h3>

        {description && (
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-fg-2">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
