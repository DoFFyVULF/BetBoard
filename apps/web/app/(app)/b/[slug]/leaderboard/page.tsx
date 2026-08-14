import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import {
  getActiveSeason,
  getBoardBySlug,
  getLeaderboard,
} from "@/lib/data/api-accessors";
import { formatPoints, formatSignedPoints } from "@/lib/format";

export interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: LeaderboardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Лидерборд — ${board.name}` : "Лидерборд",
  };
}

export default async function LeaderboardPage({
  params,
}: LeaderboardPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const season = await getActiveSeason(board.id);

  if (!season) {
    return (
      <PageHeader
        title="Лидерборд"
        description="Сезон ещё не начался — таблица появится после старта."
      />
    );
  }

  const rows = await getLeaderboard(board.id, season.id);
  const bestAccuracy = Math.max(0, ...rows.map((r) => r.accuracy));

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader
          title={`Лидерборд · ${season.name}`}
          description="Позиции по балансу сезона. Точность — доля выигранных ставок от завершённых."
        />
      </Reveal>

      <Reveal delay={80}>
        <Card className="card-interactive panel-beam overflow-hidden">
          <table className="table-animated w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-fg-3">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Игрок</th>
                <th className="px-4 py-3 text-right font-medium">Баланс</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                  Прибыль
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Точность
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.user.id}
                  className={cn(
                    "border-b border-hairline/60 last:border-b-0",
                    r.isCurrentUser
                      ? "bg-volt-tint/50"
                      : "hover:bg-neutral-tint",
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="tnum font-mono text-fg-2">{r.rank}</span>

                      {i === 0 && (
                        <Trophy className="h-4 w-4 text-warn" aria-hidden />
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={r.user.name}
                        color={r.user.avatar}
                        size="md"
                      />

                      <div className="min-w-0">
                        <div className="font-medium text-fg">
                          {r.user.name}

                          {r.isCurrentUser && (
                            <span className="ml-1.5 text-xs font-normal text-volt">
                              это вы
                            </span>
                          )}
                        </div>

                        {r.title && (
                          <div className="truncate text-[11px] text-fg-3">
                            {r.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="tnum px-4 py-3 text-right font-mono text-[15px] font-semibold text-fg">
                    {formatPoints(r.balance)}
                  </td>

                  <td
                    className={cn(
                      "tnum hidden px-4 py-3 text-right font-mono text-[13px] sm:table-cell",
                      r.profit > 0
                        ? "text-win"
                        : r.profit < 0
                          ? "text-loss"
                          : "text-fg-3",
                    )}
                  >
                    {formatSignedPoints(r.profit)}
                  </td>

                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(r.accuracy / bestAccuracy) * 100}
                        tone="info"
                        className="w-24"
                      />

                      <span className="tnum w-10 text-right font-mono text-xs text-fg-2">
                        {Math.round(r.accuracy * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Reveal>
    </div>
  );
}