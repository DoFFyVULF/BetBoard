import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Crown, Medal } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { StartSeasonButton } from "@/components/seasons/start-season-button";
import { Reveal } from "@/components/motion/reveal";
import {
  getBoardBySlug,
  getLeaderboard,
  getSeasons,
} from "@/lib/data/api-accessors";
import type { LeaderboardRow } from "@/lib/types";
import { formatDate, formatPoints } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface SeasonsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeasonsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Сезоны — ${board.name}` : "Сезоны",
  };
}

export default async function SeasonsPage({ params }: SeasonsPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const seasons = await getSeasons(board.id);

  // Для завершённых сезонов подтягиваем топ-3 победителей.
  const finishedSeasons = seasons.filter((s) => s.status === "finished");
  const top3BySeason = new Map<string, LeaderboardRow[]>();
  await Promise.all(
    finishedSeasons.map(async (s) => {
      const rows = await getLeaderboard(board.id, s.id);
      top3BySeason.set(s.id, rows.slice(0, 3));
    }),
  );

  return (
    <div className="mx-auto w-full space-y-6 pb-12">
      <Reveal>
        <PageHeader
          title="Сезоны"
          description="Каждый сезон — новый старт: все получают одинаковый баланс, а история закрепляется в лидерборде."
          actions={<StartSeasonButton boardId={board.id} />}
        />
      </Reveal>

      <div className="space-y-3">
        {seasons.length === 0 ? (
          <Reveal delay={70}>
            <Card className="card-interactive border-dashed">
              <CardBody className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <CalendarDays className="h-8 w-8 text-fg-3 opacity-50" aria-hidden />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-fg">
                    Сезонов ещё не было
                  </p>
                  <p className="text-xs text-fg-3">
                    Запустите первый сезон, чтобы начать соревнование.
                  </p>
                </div>
              </CardBody>
            </Card>
          </Reveal>
        ) : (
          seasons.map((s, index) => {
            const isActive = s.status === "active";

            return (
              <Reveal key={s.id} delay={index * 60}>
                <Card
                  className={cn(
                    "card-interactive relative overflow-hidden transition-all duration-300",
                    isActive && "terminal-panel border-volt/20",
                  )}
                >
                  {/* Акцентная линия для активного сезона */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/60 to-transparent"
                    />
                  )}

                  <CardBody className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:p-5">
                    {/* Левая часть: Название + Мета */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={cn(
                            "truncate text-[15px] font-semibold transition-colors",
                            isActive ? "text-fg" : "text-fg-2",
                          )}
                        >
                          {s.name}
                        </h3>

                        <Badge
                          tone={isActive ? "volt" : "muted"}
                          dot={isActive}
                          className="shrink-0"
                        >
                          {isActive ? "активный" : "завершён"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-3">
                        <span className="tnum font-mono">
                          {formatDate(s.startsAt)}
                          {s.endsAt && <> — {formatDate(s.endsAt)}</>}
                        </span>
                        <span aria-hidden className="h-3 w-px bg-hairline" />
                        <span>
                          старт{" "}
                          <span className="tnum font-mono text-fg-2">
                            {s.startingBalance}
                          </span>{" "}
                          очков
                        </span>
                      </div>

                      {/* Топ-3 победителей завершённого сезона */}
                      {!isActive && (top3BySeason.get(s.id)?.length ?? 0) > 0 && (
                        <ul className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5">
                          {(top3BySeason.get(s.id) ?? [])
                            .slice(0, 3)
                            .map((row, idx) => (
                              <li
                                key={row.user.id || idx}
                                className="flex items-center gap-1.5"
                              >
                                {idx === 0 ? (
                                  <Crown className="h-3.5 w-3.5 text-warn" aria-hidden />
                                ) : (
                                  <Medal className="h-3.5 w-3.5 text-fg-3" aria-hidden />
                                )}
                                <span className="tnum font-mono text-xs text-fg-3">
                                  {row.rank}.
                                </span>
                                <Avatar
                                  name={row.user.name}
                                  color={row.user.avatar}
                                  size="sm"
                                />
                                <span className="text-xs font-medium text-fg-2">
                                  {row.user.name}
                                </span>
                                <span className="tnum font-mono text-xs font-semibold text-fg">
                                  {formatPoints(row.balance)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>

                    {/* Правая часть: Таймер / Дата окончания */}
                    {isActive && s.endsAt && (
                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="text-[11px] uppercase tracking-wide text-fg-3">
                          до
                        </span>
                        <span className="tnum rounded-md border border-hairline bg-surface-2 px-2 py-1 font-mono text-xs font-medium text-fg-2">
                          {formatDate(s.endsAt)}
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Reveal>
            );
          })
        )}
      </div>
    </div>
  );
}