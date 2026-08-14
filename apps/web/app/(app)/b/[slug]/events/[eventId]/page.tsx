import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Banknote, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { BetPanel } from "@/components/events/bet-panel";
import { CommentSection } from "@/components/events/comment-section";
import { EventAdminControls } from "@/components/events/event-admin-controls";
import { CategoryBadge } from "@/components/events/category-badge";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Reveal } from "@/components/motion/reveal";
import {
  getCurrentUser,
  getEventById,
  getEventComments,
  getMyRole,
  getWalletFor,
} from "@/lib/data/api-accessors";
import {
  formatDateTime,
  formatOdds,
  formatPoints,
  timeUntil,
} from "@/lib/format";

export interface EventPageProps {
  params: Promise<{ slug: string; eventId: string }>;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const view = await getEventById(eventId);

  return {
    title: view ? view.event.title : "Событие",
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug, eventId } = await params;
  const user = await getCurrentUser();
  const view = await getEventById(eventId, user.id);

  if (!view) {
    notFound();
  }

  const {
    event,
    outcomes,
    totalPool,
    totalBackers,
    effectiveStatus,
    myBet,
    winningOutcome,
  } = view;

  const wallet = await getWalletFor(event.seasonId, user.id);
  const comments = await getEventComments(eventId);

  // Роль текущего пользователя на доске — для админ-управления событием.
  const myRole = await getMyRole(event.boardId);

  return (
    <div className="space-y-6">
      <Reveal>
        <Link
          href={`/b/${slug}/events`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-2 transition-colors hover:text-volt"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Все события
        </Link>
      </Reveal>

      {/* Шапка события */}
      <Reveal delay={60}>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            <EventStatusBadge status={effectiveStatus} />

            {event.oddsMode === "fixed" && (
              <Badge tone="outline">фикс. коэффициенты</Badge>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {event.title}
          </h1>

          {event.description && (
            <p className="max-w-3xl text-[15px] leading-relaxed text-fg-2">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-3">
            <span>Создал {view.createdBy.name}</span>
            <span>Закрытие: {formatDateTime(event.closesAt)}</span>

            {effectiveStatus === "open" && (
              <span className="tnum font-mono text-fg-2">
                осталось {timeUntil(event.closesAt)}
              </span>
            )}
          </div>
        </header>
      </Reveal>

      {/* Рынок + панель действий */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Исходы */}
          <Reveal delay={90}>
            <Card className="terminal-panel card-interactive">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Исходы и коэффициенты</CardTitle>

                <div className="flex items-center gap-3 text-xs text-fg-3">
                  <span className="tnum inline-flex items-center gap-1 font-mono">
                    <Banknote className="h-3.5 w-3.5" aria-hidden />
                    {formatPoints(totalPool)}
                  </span>

                  <span className="tnum inline-flex items-center gap-1 font-mono">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {totalBackers}
                  </span>
                </div>
              </CardHeader>

              <CardBody className="space-y-4">
                {outcomes.map((o) => (
                  <div
                    key={o.outcome.id}
                    className="list-row -mx-2 space-y-1.5 rounded-lg px-2 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {o.isWinner && (
                          <span className="rounded bg-win-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-win">
                            победил
                          </span>
                        )}

                        {o.myBet && (
                          <span className="rounded bg-volt-tint px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-volt">
                            моя ставка
                          </span>
                        )}

                        <span className="truncate text-sm text-fg">
                          {o.outcome.label}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-baseline gap-3">
                        <span className="tnum font-mono text-[15px] font-semibold text-fg-2">
                          {formatOdds(o.odds)}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={o.share * 100}
                      tone={o.isWinner ? "win" : "volt"}
                      label={`${formatPoints(o.pool)} · ${o.backers} ${
                        o.backers === 1
                          ? "ставка"
                          : o.backers < 5
                            ? "ставки"
                            : "ставок"
                      }`}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>
          </Reveal>

          {/* Админ-управление: закрыть open-событие или зафиксировать результат */}
          <Reveal delay={110}>
            <EventAdminControls view={view} role={myRole} />
          </Reveal>

          {/* Результат */}
          {effectiveStatus === "resolved" && (
            <Reveal delay={120}>
              <Card className="card-interactive panel-beam">
                <CardHeader>
                  <CardTitle>Результат</CardTitle>
                </CardHeader>

                <CardBody className="space-y-3">
                  {winningOutcome ? (
                    <div className="flex items-center gap-3 rounded-lg bg-win-tint px-4 py-3">
                      <span className="text-sm text-fg">
                        Победил исход «
                        <span className="font-semibold text-win">
                          {winningOutcome.outcome.label}
                        </span>
                        »
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-fg-2">
                      Событие не имеет победного исхода.
                    </p>
                  )}

                  {myBet && (
                    <dl className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-surface-2 px-3 py-2">
                        <dt className="text-xs text-fg-3">Ваша ставка</dt>

                        <dd className="tnum mt-0.5 font-mono text-[15px] font-semibold text-fg">
                          {formatPoints(myBet.amount)} очков
                        </dd>
                      </div>

                      <div className="rounded-lg bg-surface-2 px-3 py-2">
                        <dt className="text-xs text-fg-3">Результат</dt>

                        <dd
                          className={`tnum mt-0.5 font-mono text-[15px] font-semibold ${
                            myBet.status === "won"
                              ? "text-win"
                              : myBet.status === "lost"
                                ? "text-loss"
                                : "text-fg"
                          }`}
                        >
                          {myBet.status === "won"
                            ? `выигрыш ${formatPoints(myBet.payout ?? 0)}`
                            : myBet.status === "lost"
                              ? `проигрыш ${formatPoints(myBet.amount)}`
                              : myBet.status === "refunded"
                                ? "возврат"
                                : "—"}
                        </dd>
                      </div>
                    </dl>
                  )}
                </CardBody>
              </Card>
            </Reveal>
          )}
        </div>

        {/* Боковая панель */}
        <aside className="space-y-6">
          <Reveal delay={100}>
            <Card className="card-interactive">
              <CardHeader>
                <CardTitle>Сделать ставку</CardTitle>
              </CardHeader>

              <CardBody>
                {effectiveStatus === "open" ? (
                  <BetPanel view={view} available={wallet.available} />
                ) : (
                  <p className="text-sm leading-relaxed text-fg-2">
                    {effectiveStatus === "draft"
                      ? "Черновик. Опубликуйте событие, чтобы открыть ставки."
                      : effectiveStatus === "closed"
                        ? "Приём ставок закрыт. Результат скоро зафиксируют."
                        : "Это событие уже завершено. Смотрите результаты выше."}
                  </p>
                )}
              </CardBody>
            </Card>
          </Reveal>

          {myBet && (
            <Reveal delay={140}>
              <Card className="card-interactive">
                <CardBody className="flex items-center gap-3">
                  <Avatar name={user.name} color={user.avatar} size="md" />

                  <div className="text-xs text-fg-2">
                    <div className="text-[13px] font-medium text-fg">
                      Ваш баланс
                    </div>

                    <div className="tnum font-mono text-[15px] font-semibold text-volt">
                      {formatPoints(wallet.available)} очков
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Reveal>
          )}
        </aside>
      </div>

      <Reveal delay={120}>
        <CommentSection
          eventId={event.id}
          comments={comments}
          currentUserName={user.name}
          currentUserAvatar={user.avatar}
        />
      </Reveal>
    </div>
  );
}