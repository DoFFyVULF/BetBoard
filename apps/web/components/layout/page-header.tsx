import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Действия справа (кнопки). */
  actions?: ReactNode;
  className?: string;
}

/** Стандартная шапка страницы: заголовок, описание, действия. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex flex-wrap items-end justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-volt-ring bg-volt-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-volt">
          <span className="live-dot" aria-hidden />
          Терминал
        </div>

        <h1 className="font-display text-2xl font-black tracking-tight text-fg sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-2">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}