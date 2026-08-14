"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CalendarPlus,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Flame,
  Zap,
  BarChart3,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { EventCard } from "@/components/events/event-card";
import { Reveal } from "@/components/motion/reveal";
import { CategoryBadge } from "@/components/events/category-badge";
import { api } from "@/lib/api/client";
import { formatPoints, formatSignedPoints } from "@/lib/format";
import { useDashboardData } from "./use-dashboard-data";

/**
 * Client-side Board Dashboard — fetches real user data using auth token from localStorage
 */
export function BoardDashboardClient({ slug = "board" }: { slug?: string }) {
  const { data, loading, error } = useDashboardData(slug);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/70 to-transparent"
          />
          <CardBody className="relative space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-volt-tint animate-pulse"
                    aria-hidden
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-volt" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-6 w-48 bg-surface-2 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-surface-2 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-hairline bg-surface-2 p-4 animate-pulse">
                  <div className="h-3 w-24 bg-surface-3 rounded mb-2" />
                  <div className="h-8 w-20 bg-surface-3 rounded" />
                </div>
              ))}
            </div>
          </CardBody>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-loss mb-4">{error}</p>
        <Button asChild size="lg" className="btn-primary-glow">
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-fg-2 mb-4">Доска не найдена</p>
        <Button asChild size="lg" className="btn-primary-glow">
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    );
  }

  const { user, board, season, wallet, events, myBets, results, leaderboard, myRow, stats } = data;

  const openEvents = events.filter((e) => e.effectiveStatus === "open");
  const closedForResult = events.filter((e) => e.effectiveStatus === "closed");

  const profit = myRow?.profit ?? 0;
  const accuracy = Math.round((myRow?.accuracy ?? 0) * 100);
  const isProfitPositive = profit >= 0;

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* ============================================ */}
      {/* HERO: Игрок + Баланс + Статистика            */}
      {/* ============================================ */}
      <Reveal>
      <section aria-labelledby="player-summary">
        <div className="relative overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/70 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-volt-tint blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-[-5%] h-56 w-56 rounded-full bg-info-tint blur-[90px]"
          />

          <CardBody className="relative space-y-6 p-6">
            {/* Row 1: Player identity + CTA */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={user.name} color={user.avatar} size="xl" />
                  {myRow && myRow.rank <= 3 && (
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg bg-warn text-xs font-black text-[#1a1200] shadow-lg">
                      {myRow.rank}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-fg">
                      {user.name}
                    </h1>
                    {myRow?.title && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-volt-tint px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-volt">
                        <Trophy className="h-3 w-3" aria-hidden />
                        {myRow.title}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-fg-3">
                    {season
                      ? `Сезон «${season.name}» · старт ${formatPoints(season.startingBalance)} очков`
                      : "Сезон не запущен"}
                  </p>
                </div>
              </div>

              <Button asChild size="lg" className="btn-primary-glow group">
                <Link href={`/b/${slug}/events/new`}>
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Создать событие
                </Link>
              </Button>
            </div>

            {/* Row 2: Stats grid */}
            {wallet ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {/* Доступно */}
                <div className="group relative overflow-hidden rounded-xl border border-hairline bg-surface-2 p-4 transition-all duration-300 hover:border-volt/50 hover:shadow-[0_0_32px_rgba(215,255,62,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                      Доступно
                    </span>
                    <Wallet className="h-4 w-4 text-volt" aria-hidden />
                  </div>
                  <div className="tnum mt-2 font-mono text-2xl font-black tracking-tight text-volt">
                    {formatPoints(wallet.available)}
                  </div>
                  <div className="mt-1 text-[11px] text-fg-3">очков</div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-volt/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* В ставках */}
                <div className="group relative overflow-hidden rounded-xl border border-hairline bg-surface-2 p-4 transition-all duration-300 hover:border-info/50 hover:shadow-[0_0_32px_rgba(125,211,252,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                      В ставках
                    </span>
                    <Target className="h-4 w-4 text-info" aria-hidden />
                  </div>
                  <div className="tnum mt-2 font-mono text-2xl font-black tracking-tight text-info">
                    {formatPoints(wallet.locked)}
                  </div>
                  <div className="mt-1 text-[11px] text-fg-3">заблокировано</div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-info/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Место в сезоне */}
                <div className="group relative overflow-hidden rounded-xl border border-hairline bg-surface-2 p-4 transition-all duration-300 hover:border-warn/50 hover:shadow-[0_0_32px_rgba(251,191,36,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">
                      Место
                    </span>
                    <Trophy className="h-4 w-4 text-warn" aria-hidden />
                  </div>
                  <div className="tnum mt-2 font-mono text-2xl font-black tracking-tight text-fg">
                    {myRow ? `#${myRow.rank}` : "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-fg-3">
                    из {leaderboard.length} игроков
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-warn/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>

                {/* Прибыль сезона */}
                <div
                  className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                    isProfitPositive
                      ? "border-win/40 bg-win-tint hover:shadow-[0_0_32px_rgba(74,222,128,0.12)]"
                      : "border-loss/40 bg-loss-tint hover:shadow-[0_0_32px_rgba(251,113,133,0.12)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isProfitPositive ? "text-win" : "text-loss"
                      }`}
                    >
                      Прибыль
                    </span>
                    {isProfitPositive ? (
                      <TrendingUp className="h-4 w-4 text-win" aria-hidden />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-loss" aria-hidden />
                    )}
                  </div>
                  <div
                    className={`tnum mt-2 font-mono text-2xl font-black tracking-tight ${
                      isProfitPositive ? "text-win" : "text-loss"
                    }`}
                  >
                    {formatSignedPoints(profit)}
                  </div>
                  <div className="mt-1 text-[11px] text-fg-3">
                    точность {accuracy}%
                  </div>
                  <div
                    className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent ${
                      isProfitPositive ? "via-win/60" : "via-loss/60"
                    } to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-warn/40 bg-warn-tint px-5 py-4">
                <Clock className="h-5 w-5 shrink-0 text-warn" aria-hidden />
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg">
                    Сезон не запущен
                  </p>
                  <p className="mt-0.5 text-xs text-fg-2">
                    Стартуйте первый сезон, чтобы делать ставки и зарабатывать
                    очки.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/b/${slug}/seasons`}>Перейти к сезонам</Link>
                </Button>
              </div>
            )}

            {/* Row 3: Quick stats bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-hairline bg-surface-2/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-volt" aria-hidden />
                <span className="text-xs text-fg-2">
                  Активных ставок:{" "}
                  <span className="tnum font-mono font-bold text-fg">
                    {stats.myBetsCount}
                  </span>
                </span>
              </div>
              <div className="h-4 w-px bg-hairline" aria-hidden />
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-win" aria-hidden />
                <span className="text-xs text-fg-2">
                  Открытых событий:{" "}
                  <span className="tnum font-mono font-bold text-fg">
                    {stats.openCount}
                  </span>
                </span>
              </div>
              <div className="h-4 w-px bg-hairline" aria-hidden />
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" aria-hidden />
                <span className="text-xs text-fg-2">
                  Ждут результата:{" "}
                  <span className="tnum font-mono font-bold text-fg">
                    {stats.toResolveCount}
                  </span>
                </span>
              </div>
            </div>
          </CardBody>
        </div>
      </section>
      </Reveal>

      {/* ============================================ */}
      {/* МОИ АКТИВНЫЕ СТАВКИ                          */}
      {/* ============================================ */}
      <Reveal delay={70}>
      <section aria-labelledby="my-bets">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-volt-tint">
              <Flame className="h-4 w-4 text-volt" aria-hidden />
            </div>
            <div>
              <h2
                id="my-bets"
                className="text-base font-bold tracking-tight text-fg"
              >
                Мои активные ставки
              </h2>
              <p className="text-xs text-fg-3">
                Заблокированные очки и потенциальные выплаты
              </p>
            </div>
          </div>

          <Link
            href={`/b/${slug}/events`}
            className="group flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-fg-2 transition-all duration-300 hover:border-volt/50 hover:text-volt"
          >
            все события
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {myBets.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            title="Пока нет активных ставок"
            description="Сделайте прогноз на открытое событие — заблокируйте очки и заберите выплату, если угадаете."
            action={
              <Button asChild size="sm" className="btn-primary-glow">
                <Link href={`/b/${slug}/events`}>Выбрать событие</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {myBets.map((v, idx) => (
              <EventCard
                key={`${v.event.id}-${v.myBet?.id || idx}`}
                view={v}
                boardSlug={slug}
              />
            ))}
          </div>
        )}
      </section>
      </Reveal>

      {/* ============================================ */}
      {/* ОТКРЫТЫЕ + ЖДУТ РЕЗУЛЬТАТА                   */}
      {/* ============================================ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Открытые события */}
        <Reveal delay={110}>
        <section aria-labelledby="open-events" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-win-tint">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-win opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-win" />
                </span>
              </div>
              <div>
                <h2
                  id="open-events"
                  className="text-base font-bold tracking-tight text-fg"
                >
                  Открытые события
                </h2>
                <p className="text-xs text-fg-3">
                  Приём ставок открыт
                </p>
              </div>
            </div>
            <span className="tnum rounded-lg bg-win-tint px-2.5 py-1 font-mono text-xs font-bold text-win">
              {openEvents.length}
            </span>
          </div>

          {openEvents.length === 0 ? (
            <EmptyState
              title="Всё открыто — придумайте событие"
              description="Создайте ставку для компании: настолка, фильм или заказ пиццы."
            />
          ) : (
            <div className="space-y-3">
              {openEvents.slice(0, 4).map((v) => (
                <EventCard key={v.event.id} view={v} boardSlug={slug} />
              ))}
            </div>
          )}
        </section>
        </Reveal>

        {/* Ждут фиксации */}
        <Reveal delay={150}>
        <section aria-labelledby="to-resolve" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-tint">
                <Clock className="h-4 w-4 text-warn" aria-hidden />
              </div>
              <div>
                <h2
                  id="to-resolve"
                  className="text-base font-bold tracking-tight text-fg"
                >
                  Ждут результата
                </h2>
                <p className="text-xs text-fg-3">
                  Ставки закрыты, нужно зафиксировать исход
                </p>
              </div>
            </div>
            <span className="tnum rounded-lg bg-warn-tint px-2.5 py-1 font-mono text-xs font-bold text-warn">
              {closedForResult.length}
            </span>
          </div>

          {closedForResult.length === 0 ? (
            <EmptyState
              title="Нет событий на фиксации"
              description="Когда срок ставки пройдёт, событие появится здесь — останется зафиксировать победителя."
            />
          ) : (
            <div className="space-y-3">
              {closedForResult.map((v) => (
                <EventCard key={v.event.id} view={v} boardSlug={slug} />
              ))}
            </div>
          )}
        </section>
        </Reveal>
      </div>

      {/* ============================================ */}
      {/* ПОСЛЕДНИЕ РЕЗУЛЬТАТЫ                         */}
      {/* ============================================ */}
      {results.length > 0 && (
        <section aria-labelledby="results">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-tint">
                <CheckCircle2 className="h-4 w-4 text-win" aria-hidden />
              </div>
              <div>
                <h2
                  id="results"
                  className="text-base font-bold tracking-tight text-fg"
                >
                  Последние результаты
                </h2>
                <p className="text-xs text-fg-3">
                  Завершённые события и ваши выплаты
                </p>
              </div>
            </div>

            <Link
              href={`/b/${slug}/events`}
              className="group flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-fg-2 transition-all duration-300 hover:border-volt/50 hover:text-volt"
            >
              история
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <Card className="card-interactive panel-beam overflow-hidden">
            <CardBody className="p-0">
              <div className="divide-y divide-hairline/60">
                {results.map((v) => {
                  const win = v.winningOutcome;
                  const my = v.myBet;
                  const won = my?.status === "won";
                  const lost = my?.status === "lost";
                  const refunded = my?.status === "refunded";
                  const pnl = won
                    ? (my?.payout ?? 0) - (my?.amount ?? 0)
                    : lost
                      ? -(my?.amount ?? 0)
                      : 0;

                  return (
                    <Link
                      key={v.event.id}
                      href={`/b/${slug}/events/${v.event.id}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-all duration-300 hover:bg-neutral-tint"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="truncate text-sm font-semibold text-fg transition-colors duration-300 group-hover:text-volt">
                            {v.event.title}
                          </span>
                          <CategoryBadge category={v.event.category} />
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-fg-3">
                          {win ? (
                            <>
                              <Trophy
                                className="h-3.5 w-3.5 text-win"
                                aria-hidden
                              />
                              <span>Победитель:</span>
                              <span className="font-medium text-fg-2">
                                {win.outcome.label}
                              </span>
                            </>
                          ) : (
                            <>
                              <RotateCcw
                                className="h-3.5 w-3.5 text-fg-3"
                                aria-hidden
                              />
                              <span>Событие отменено</span>
                            </>
                          )}
                        </div>
                      </div>

                      {my && (
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={`tnum flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-bold ${
                              won
                                ? "bg-win-tint text-win"
                                : lost
                                  ? "bg-loss-tint text-loss"
                                  : "bg-neutral-tint text-fg-3"
                            }`}
                          >
                            {won && (
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden
                              />
                            )}
                            {lost && (
                              <XCircle className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {refunded && (
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {won
                              ? `+${formatPoints(pnl)}`
                              : lost
                                ? `−${formatPoints(Math.abs(pnl))}`
                                : "возврат"}
                          </span>

                          <ChevronRight
                            className="h-4 w-4 text-fg-3 transition-all duration-300 group-hover:translate-x-1 group-hover:text-volt"
                            aria-hidden
                          />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </section>
      )}
    </div>
  );
}