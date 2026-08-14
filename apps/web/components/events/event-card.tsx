import Link from "next/link";
import { Banknote, Users } from "lucide-react";
import type { EventView } from "@/lib/types";
import { formatOdds, formatPoints, plural, timeUntilShort } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { CategoryBadge } from "@/components/events/category-badge";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { cn } from "@/lib/cn";

export interface EventCardProps {
  view: EventView;
  className?: string;
  /** Slug доски — обязателен: подставляется в ссылку карточки (/b/[slug]/events/...). */
  boardSlug: string;
}

/**
 * Карточка события (v2).
 * Оптимизирована для плотного списка: жесткое позиционирование,
 * выравнивание коэффициентов в колонку, чистый подвал.
 */
export function EventCard({ view, className, boardSlug }: EventCardProps) {
  const { event, outcomes = [], totalPool = 0, totalBets = 0, effectiveStatus, myBet } = view;
  const top = outcomes.slice(0, 3);
  const moreCount = outcomes.length - 3;

  return (
    <Link href={`/b/${boardSlug}/events/${event.id}`} className="group block h-full">
      <Card
        className={cn(
          "card-interactive relative flex h-full flex-col overflow-hidden border-hairline transition-colors duration-300 group-hover:border-volt/30",
          className,
        )}
      >
        {/* Акцентная линия сверху */}
        {effectiveStatus === "open" && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-volt/50 to-transparent"
          />
        )}

        <CardBody className="flex h-full flex-col gap-4 p-4">
          {/* 
            ШАПКА: Grid для гарантированного позиционирования.
            Таймер всегда прижат к правому краю, заголовок не залезает на него.
          */}
          <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2">
            <div className="min-w-0 space-y-1.5">
              <h3 className="truncate text-[15px] font-bold leading-snug text-fg transition-colors duration-300 group-hover:text-volt">
                {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={event.category} />
                <EventStatusBadge status={effectiveStatus} />
              </div>
            </div>

            {effectiveStatus === "open" && (
              <span className="live-chip shrink-0 translate-y-0.5">
                <span className="live-dot" aria-hidden />
                {timeUntilShort(event.closesAt)}
              </span>
            )}
          </div>

          {/* 
            РЫНОК: Вертикальный стек.
            Коэффициенты имеют фиксированную ширину для выравнивания в колонку.
          */}
          <div className="flex flex-col gap-1">
            {top.map((o) => (
              <div
                key={o.outcome.id}
                className={cn(
                  "relative flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-all duration-200",
                  o.myBet
                    ? "bg-volt-tint/60 ring-1 ring-inset ring-volt/30"
                    : "hover:bg-surface-2",
                )}
              >
                {/* Левая часть: Индикатор + Название */}
                <div className="flex min-w-0 items-center gap-2">
                  {o.myBet && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-volt shadow-[0_0_8px_rgba(215,255,62,0.9)]"
                    />
                  )}
                  <span
                    className={cn(
                      "truncate text-[13px] transition-colors duration-200",
                      o.myBet
                        ? "font-semibold text-volt"
                        : "text-fg-2 group-hover:text-fg",
                    )}
                  >
                    {o.outcome.label}
                  </span>
                </div>

                {/* Правая часть: Кэф-бокс (фиксированная ширина) */}
                <div className="flex w-16 shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={cn(
                      "tnum flex h-7 w-full items-center justify-center rounded border font-mono text-[13px] font-bold tabular-nums transition-all duration-200",
                      o.myBet
                        ? "border-volt/50 bg-volt text-volt-ink shadow-[0_0_12px_rgba(215,255,62,0.25)]"
                        : "border-hairline-strong bg-surface-3/50 text-volt hover:border-volt/40 hover:bg-volt-tint",
                    )}
                  >
                    {o.odds != null ? formatOdds(o.odds) : "—"}
                  </span>
                  
                  {/* Микро-бар доли пула внутри блока кэфа или под ним */}
                  <div className="h-[2px] w-full overflow-hidden rounded-full bg-surface-3/40" aria-hidden>
                    <div
                      className="h-full bg-volt/60"
                      style={{ width: `${Math.max(2, Math.round(o.share * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {moreCount > 0 && (
              <div className="px-2 pt-1 text-center text-[11px] font-medium text-muted">
                + {plural(moreCount, "исход", "исхода", "исходов")}
              </div>
            )}
          </div>

          {/* 
            ПОДВАЛ: Разнесен по краям (space-between).
            Моя ставка выделена как отдельный тег справа.
          */}
          <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3">
            <div className="flex items-center gap-3 text-xs text-fg-3">
              <span className="tnum inline-flex items-center gap-1.5 font-mono">
                <Banknote className="h-3.5 w-3.5 opacity-70" aria-hidden />
                {formatPoints(totalPool)}
              </span>
              
              <span aria-hidden className="h-3 w-px bg-hairline" />
              
              <span className="tnum inline-flex items-center gap-1.5 font-mono">
                <Users className="h-3.5 w-3.5 opacity-70" aria-hidden />
                {totalBets}
              </span>
            </div>

            {myBet && (
              <span className="tnum inline-flex items-center rounded-full bg-volt/10 px-2 py-0.5 font-mono text-[11px] font-bold text-volt ring-1 ring-inset ring-volt/20">
                {formatPoints(myBet.amount)}
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}