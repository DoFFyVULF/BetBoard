import Link from "next/link";
import {
  CalendarPlus,
  ChevronRight,
  Clock,
  Flame,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBadge } from "@/components/events/category-badge";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { cn } from "@/lib/cn";
import {
  formatOdds,
  formatPoints,
  formatSignedPoints,
  timeUntilShort,
} from "@/lib/format";
import type { DashboardData } from "./dashboard-data";
import type { EventView, LeaderboardRow } from "@/lib/types";

/**
 * Вариант «Спортсбук» — события как герой.
 * Длинный вертикальный feed открытых событий в букмекерской подаче:
 * строка = скан «заголовок → исходы → кэф». Игрок сжат до тонкой полосы,
 * вторичное (мои ставки, лидерборд) — в прилипающей правой колонке.
 */
export function SportsBookDashboard({ data }: { data: DashboardData }) {
  const { ballot, results, leaderboard, myBets, myRow, slug } = data;
  const hasToResolve = ballot.toResolve.length > 0;
  const base = `/b/${slug}`;

  return (
    <div className="space-y-6">
      <PlayerStrip data={data} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ===== Лента событий ===== */}
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="sb-open">
            <SectionHeading
              id="sb-open"
              count={ballot.board.length}
              tone="win"
              title="Открыто сейчас"
              hint="на что можно поставить"
              actionHref={`${base}/events`}
              actionLabel="все события"
            />

            {ballot.board.length === 0 ? (
              <EmptyState
                title="Всё открыто — придумайте событие"
                description="Создайте ставку для компании: настолка, фильм или заказ пиццы."
              />
            ) : (
              <Card className="divide-y divide-hairline overflow-hidden border-hairline">
                {ballot.board.map((v) => (
                  <SportsbookRow key={v.event.id} view={v} slug={data.slug} />
                ))}
              </Card>
            )}
          </section>

          {hasToResolve && (
            <section aria-labelledby="sb-resolve">
              <SectionHeading
                id="sb-resolve"
                count={ballot.toResolve.length}
                tone="warn"
                title="Ждут фиксации"
                hint="ставки закрыты — зафиксируйте исход"
                actionHref={`${base}/events`}
                actionLabel="события"
              />

              <Card className="divide-y divide-hairline overflow-hidden border-hairline">
                {ballot.toResolve.map((v) => (
                  <ResolveRow key={v.event.id} view={v} slug={data.slug} />
                ))}
              </Card>
            </section>
          )}

          {results.length > 0 && (
            <section aria-labelledby="sb-results">
              <SectionHeading
                id="sb-results"
                title="Последние результаты"
                hint="завершённые события и ваши выплаты"
                actionHref={`${base}/events`}
                actionLabel="история"
              />

              <Card className="panel-beam divide-y divide-hairline/60 overflow-hidden">
                {results.map((v) => (
                  <ResultRow key={v.event.id} view={v} slug={data.slug} />
                ))}
              </Card>
            </section>
          )}
        </div>

        {/* ===== Правый рельс: мои ставки + лидерборд ===== */}
        <aside className="hidden space-y-6 lg:block">
          <div className="sticky top-24 space-y-6" aria-label="Боковая панель">
            <MyBetsRail myBets={myBets} slug={data.slug} />
            <LeaderboardRail leaderboard={leaderboard} myRow={myRow} slug={data.slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   Player Strip — тонкая закреплённая строка игрока
   ============================================================ */

function PlayerStrip({ data }: { data: DashboardData }) {
  const { user, wallet, season, myRow, stats, slug } = data;
  const place = stats.myRank != null ? `#${stats.myRank}` : "—";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-hairline bg-surface/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} color={user.avatar} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-fg">{user.name}</span>
            {myRow?.title && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-volt-tint px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-volt">
                <Trophy className="h-3 w-3" aria-hidden />
                {myRow.title}
              </span>
            )}
          </div>
          <p className="text-[11px] text-fg-3">
            {season ? `Сезон «${season.name}»` : "Сезон не запущен"}
          </p>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
        {wallet && (
          <MiniStat label="Баланс" value={formatPoints(wallet.available)} className="text-volt" />
        )}
        {wallet != null && (
          <MiniStat label="В ставках" value={formatPoints(wallet.locked)} className="text-info" />
        )}
        <MiniStat label="Место" value={place} className="text-warn" />

        <span
          className={cn(
            "tnum inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-sm font-black",
            stats.isProfitPositive
              ? "bg-win-tint text-win"
              : "bg-loss-tint text-loss",
          )}
        >
          {stats.isProfitPositive ? "▲" : "▼"}{" "}
          {formatSignedPoints(stats.profit)}
        </span>

        <Button asChild size="sm" className="btn-primary-glow">
          <Link href={`/b/${slug}/events/new`}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Создать событие
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-3">
        {label}
      </span>
      <span className={cn("tnum mt-1 font-mono text-sm font-bold", className)}>
        {value}
      </span>
    </span>
  );
}

/* ============================================================
   Section heading
   ============================================================ */

function SectionHeading({
  id,
  title,
  hint,
  count,
  tone = "win",
  actionHref,
  actionLabel,
}: {
  id: string;
  title: string;
  hint: string;
  count?: number;
  tone?: "win" | "warn" | "neutral";
  actionHref: string;
  actionLabel: string;
}) {
  const countCls =
    tone === "warn" ? "bg-warn-tint text-warn" : tone === "win" ? "bg-win-tint text-win" : "bg-neutral-tint text-fg-2";
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h2 id={id} className="font-display text-sm font-bold uppercase tracking-wide text-fg">
          {title}
        </h2>
        <p className="text-xs text-fg-3">{hint}</p>
      </div>

      <div className="flex items-center gap-2">
        {count != null && (
          <span className={cn("tnum rounded-lg px-2.5 py-1 font-mono text-xs font-bold", countCls)}>
            {count}
          </span>
        )}
        <Link
          href={actionHref}
          className="group flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-2 transition-all duration-300 hover:border-volt/50 hover:text-volt"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   Row — открытое событие (строки встык, без gap)
   ============================================================ */

function SportsbookRow({ view, slug }: { view: EventView; slug: string }) {
  const { event, outcomes } = view;
  return (
    <Link
      href={`/b/${slug}/events/${event.id}`}
      className="group block px-5 py-4 transition-all duration-200 hover:bg-neutral-tint"
    >
      {/* Шапка строки */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={event.category} />
        <span className="tnum inline-flex items-center gap-1 font-mono text-[11px] text-fg-3">
          <Clock className="h-3 w-3 opacity-70" aria-hidden />
          {timeUntilShort(event.closesAt)}
        </span>
      </div>

      <h3 className="mt-2 truncate text-[15px] font-bold leading-snug text-fg transition-colors duration-300 group-hover:text-volt">
        {event.title}
      </h3>

      {/* Рынок: сетка кэф-ячеек */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
        {outcomes.map((o) => (
          <OddsCell key={o.outcome.id} view={view} outcomeIndex={o.outcome.sortOrder} />
        ))}
      </div>

      {/* Подвал: пул / ставки / участники */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-fg-3">
        <span className="tnum inline-flex items-center gap-1 font-mono">
          <Banknote className="h-3 w-3 opacity-70" aria-hidden />
          {formatPoints(view.totalPool)}
        </span>
        <span aria-hidden className="h-3 w-px bg-hairline" />
        <span className="tnum inline-flex items-center gap-1 font-mono">
          <Users className="h-3 w-3 opacity-70" aria-hidden />
          {view.totalBets}
        </span>
        <span className="tnum inline-flex items-center gap-1 font-mono">
          {view.backerCount} игр.
        </span>
      </div>
    </Link>
  );
}

/**
 * Кэф-ячейка — центральный визуальный объект строки.
 * Одним побегу срезает: исход, кэф, доля пула, моя ли ставка.
 */
function OddsCell({
  view,
  outcomeIndex,
}: {
  view: EventView;
  outcomeIndex: number;
}) {
  const o = view.outcomes.find((x) => x.outcome.sortOrder === outcomeIndex);
  if (!o) return null;
  const mine = !!o.myBet;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-2.5 transition-all duration-200",
        mine
          ? "border-volt/60 bg-volt text-volt-ink shadow-[0_0_16px_rgba(215,255,62,0.35)]"
          : "border-hairline-strong bg-surface-2 hover:-translate-y-0.5 hover:border-volt/40 hover:bg-volt-tint",
      )}
    >
      <span
        className={cn(
          "truncate text-[12px] leading-tight",
          mine ? "font-semibold text-volt-ink" : "text-fg-2",
        )}
      >
        {o.outcome.label}
      </span>

      <div className="flex items-baseline justify-between gap-1">
        <span
          className={cn(
            "tnum font-mono text-lg font-black leading-none",
            mine ? "text-volt-ink" : "text-volt",
          )}
          style={mine ? undefined : { textShadow: "0 0 12px rgba(215,255,62,0.35)" }}
        >
          {o.odds != null ? formatOdds(o.odds) : "—"}
        </span>
        <span
          className={cn(
            "tnum font-mono text-[11px] font-bold",
            mine ? "text-volt-ink/70" : "text-fg-3",
          )}
        >
          {Math.round(o.share * 100)}%
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Row — ждёт фиксации (warn-состояние вместо кэфов)
   ============================================================ */

function ResolveRow({ view, slug }: { view: EventView; slug: string }) {
  const { event } = view;
  return (
    <Link
      href={`/b/${slug}/events/${event.id}`}
      className="group flex items-center justify-between gap-4 px-5 py-4 transition-all duration-200 hover:bg-neutral-tint"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
        </div>
        <h3 className="mt-2 truncate text-[15px] font-bold leading-snug text-fg transition-colors duration-300 group-hover:text-volt">
          {event.title}
        </h3>
      </div>

      <span className="tnum inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-warn/30 bg-warn-tint px-3 py-1.5 font-mono text-xs font-bold text-warn">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Зафиксировать
      </span>
    </Link>
  );
}

/* ============================================================
   Последние результаты — строки с PnL
   ============================================================ */

function ResultRow({ view, slug }: { view: EventView; slug: string }) {
  const win = view.winningOutcome;
  const my = view.myBet;
  const won = my?.status === "won";
  const lost = my?.status === "lost";
  const refunded = my?.status === "refunded";
  const pnl = won
    ? (my?.payout ?? 0) - (my?.amount ?? 0)
    : lost
      ? -(my?.amount ?? 0)
      : 0;

  return (
    <div className="px-0">
      <Link
        href={`/b/${slug}/events/${view.event.id}`}
        className="group flex items-center justify-between gap-4 px-5 py-4 transition-all duration-200 hover:bg-neutral-tint"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="truncate text-sm font-semibold text-fg transition-colors duration-300 group-hover:text-volt">
              {view.event.title}
            </span>
            <CategoryBadge category={view.event.category} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-fg-3">
            {win ? (
              <>
                <Trophy className="h-3.5 w-3.5 text-win" aria-hidden />
                <span>Победитель:</span>
                <span className="font-medium text-fg-2">{win.outcome.label}</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-fg-3" aria-hidden />
                <span>Событие отменено</span>
              </>
            )}
          </div>
        </div>

        {my && (
          <span
            className={cn(
              "tnum flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-base font-black",
              won
                ? "bg-win-tint text-win"
                : lost
                  ? "bg-loss-tint text-loss"
                  : "bg-neutral-tint text-fg-3",
            )}
          >
            {refunded && <RotateCcw className="h-4 w-4" aria-hidden />}
            {won ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                +{formatPoints(pnl)}
              </>
            ) : lost ? (
              <>
                <XCircle className="h-4 w-4" aria-hidden />
                −{formatPoints(Math.abs(pnl))}
              </>
            ) : (
              "возврат"
            )}
          </span>
        )}
      </Link>
    </div>
  );
}

/* ============================================================
   Правый рельс
   ============================================================ */

function MyBetsRail({
  myBets,
  slug,
}: {
  myBets: EventView[];
  slug: string;
}) {
  return (
    <Card className="border-hairline">
      <CardBody className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-volt-tint">
            <Flame className="h-4 w-4 text-volt" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-fg">Мои ставки</h3>
        </div>

        {myBets.length === 0 ? (
          <p className="text-xs leading-relaxed text-fg-3">
            Пока нет активных ставок.{" "}
            <Link href={`/b/${slug}/events`} className="font-medium text-volt hover:underline">
              выбрать событие
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {myBets.map((v) => {
              const mine = v.outcomes.find((o) => o.myBet);
              return (
                <li key={v.event.id}>
                  <Link
                    href={`/b/${slug}/events/${v.event.id}`}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-2 px-3 py-2 transition-all duration-200 hover:border-volt/40"
                  >
                    <span className="truncate text-xs font-medium text-fg-2 group-hover:text-fg">
                      {v.event.title}
                    </span>
                    <span className="tnum shrink-0 font-mono text-xs font-bold text-volt">
                      {mine ? formatPoints(mine.myBet?.amount ?? 0) : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function LeaderboardRail({
  leaderboard,
  myRow,
  slug,
}: {
  leaderboard: LeaderboardRow[];
  myRow: LeaderboardRow | undefined;
  slug: string;
}) {
  const top = leaderboard.slice(0, 3);
  const me = myRow;

  return (
    <Card className="border-hairline">
      <CardBody className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warn-tint">
            <Trophy className="h-4 w-4 text-warn" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-fg">Лидерборд</h3>
        </div>

        <ol className="space-y-1.5">
          {top.map((r) => (
            <li key={r.user.id}>
              <Link
                href={`/b/${slug}/events`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-neutral-tint"
              >
                <span className="tnum w-6 shrink-0 text-center font-mono text-xs font-black text-warn">
                  {r.rank}
                </span>
                <Avatar name={r.user.name} color={r.user.avatar} size="sm" />
                <span className="truncate text-xs font-medium text-fg-2">{r.user.name}</span>
                <span className="tnum ml-auto font-mono text-xs font-bold text-volt">
                  {formatPoints(r.balance)}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {me && me.rank > 3 && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2 py-2">
            <span className="tnum w-6 shrink-0 text-center font-mono text-xs font-black text-fg-3">
              {me.rank}
            </span>
            <span className="text-xs font-semibold text-fg">{me.user.name}</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-fg-3" aria-hidden />
          </div>
        )}
      </CardBody>
    </Card>
  );
}