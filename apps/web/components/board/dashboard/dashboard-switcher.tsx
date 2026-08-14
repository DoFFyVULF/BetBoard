import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_VARIANTS,
  VARIANT_KEYS,
  type DashboardVariantKey,
} from "./dashboard-variants";

export interface DashboardSwitcherProps {
  slug: string;
  current: DashboardVariantKey;
}

/**
 * Временный переключатель дизайн-вариантов дашборда.
 * Чистый серверный компонент: каждый пункт — это ссылка ?view=<key>,
 * поэтому активный вариант помечается через проп, а не через useSearchParams.
 * Убирается после того, как пользователь выберет один вариант.
 */
export function DashboardSwitcher({ slug, current }: DashboardSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-hairline-strong bg-bg-2/60 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-3">
        <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
        Дизайн:
      </span>

      <div className="flex flex-wrap items-center gap-1">
        {VARIANT_KEYS.map((key) => {
          const meta = DASHBOARD_VARIANTS[key];
          const active = key === current;
          return (
            <Link
              key={key}
              href={`/b/${slug}?view=${key}`}
              aria-current={active ? "page" : undefined}
              title={meta.hint}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-semibold transition-all duration-200",
                active
                  ? "border-volt/50 bg-volt-tint text-volt"
                  : "border-hairline bg-surface text-fg-2 hover:border-volt/30 hover:text-fg",
              )}
            >
              {meta.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}