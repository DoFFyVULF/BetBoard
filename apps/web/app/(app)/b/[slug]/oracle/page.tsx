import type { Metadata } from "next";
import Link from "next/link";
import { Award, Crown, Medal, Target } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Stat } from "@/components/ui/stat";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import {
  categoryLabel,
  getActiveSeason,
  getBoardBySlug,
  getCurrentUser,
  getOracleProfile,
} from "@/lib/data/api-accessors";
import { formatPoints, formatSignedPoints } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface OraclePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: OraclePageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Профиль оракула — ${board.name}` : "Профиль оракула",
  };
}

const SCORE_TIER: {
  min: number;
  label: string;
  tone: "volt" | "info" | "warn" | "neutral";
}[] = [
  { min: 80, label: "Легенда", tone: "volt" },
  { min: 60, label: "Мастер прогнозов", tone: "info" },
  { min: 40, label: "Опытный игрок", tone: "warn" },
  { min: 0, label: "Новичок", tone: "neutral" },
];

export default async function OraclePage({ params }: OraclePageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const user = await getCurrentUser();
  const season = await getActiveSeason(board.id);

  if (!season) {
    return (
      <div className="mx-auto ">
        <PageHeader
          title="Профиль оракула"
          description="Сезон ещё не начался."
        />
      </div>
    );
  }

  const profile = await getOracleProfile(board.id, season.id, user.id);

  if (!profile) {
    return (
      <div className="mx-auto">
        <PageHeader
          title="Профиль оракула"
          description="Профиль не найден."
        />
      </div>
    );
  }

  const tier =
    SCORE_TIER.find((t) => profile.oracleScore >= t.min) ?? SCORE_TIER.at(-1)!;

  return (
    <div className="mx-auto w-full space-y-6 pb-12">
      <Reveal>
        <PageHeader
          title="Профиль оракула"
          description="Репутация прогнозиста сезона: точность, прибыль, стабильность и титулы."
          className=""
        />
      </Reveal>

      {/* Карточка игрока */}
      <Reveal delay={70}>
        <Card className="terminal-panel card-interactive overflow-hidden">
          <CardBody className="space-y-6 p-5 sm:p-6">
            {/* Hero: Аватар + Инфо + Скор */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <Avatar
                name={profile.user.name}
                color={profile.user.avatar}
                size="xl"
                className="mx-auto sm:mx-0"
              />

              <div className="min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="font-display text-xl font-bold tracking-tight text-fg">
                    {profile.user.name}
                  </h2>

                  <Badge tone={tier.tone} className="gap-1">
                    <Crown className="h-3 w-3" aria-hidden />
                    {tier.label}
                  </Badge>
                </div>

                <div className="mt-1 truncate text-sm text-fg-2">
                  {profile.titles.length > 0
                    ? profile.titles.join(" · ")
                    : "Без титулов"}
                </div>

                <div className="mt-0.5 text-xs text-fg-3">
                  #{profile.rank} в лидерборде сезона
                </div>
              </div>

              {/* Oracle Score — акцентный блок */}
              <div className="flex justify-center sm:justify-end">
                <div className="rounded-xl border border-volt/20 bg-volt-tint/30 px-5 py-3 text-center sm:text-right">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-fg-3">
                    Oracle Score
                  </div>
                  <div className="tnum mt-0.5 font-mono text-3xl font-bold leading-none text-volt drop-shadow-[0_0_12px_rgba(215,255,62,0.3)]">
                    {profile.oracleScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Статы: 2 колонки на мобильных, 4 на десктопе */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Доступно" value={formatPoints(profile.balance)} />

              <Stat
                label="Прибыль"
                value={formatSignedPoints(profile.profit)}
                trendTone={profile.profit >= 0 ? "win" : "loss"}
              />

              <Stat
                label="Точность"
                value={`${Math.round(profile.accuracy * 100)}%`}
                hint={`${profile.wonBets} из ${profile.totalBets}`}
              />

              <Stat
                label="Заблокировано"
                value={formatPoints(profile.locked)}
              />
            </div>
          </CardBody>
        </Card>
      </Reveal>

      {/* Две колонки: Категории + Достижения */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Статистика по категориям */}
        <Reveal delay={110}>
          <Card className="card-interactive h-full">
            <CardHeader>
              <CardTitle>Статистика по категориям</CardTitle>
            </CardHeader>

            <CardBody className="space-y-3">
              {profile.byCategory.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-2">
                  Ещё нет завершённых ставок.
                </p>
              ) : (
                profile.byCategory.map((c) => (
                  <div key={c.category} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-fg">
                        {categoryLabel(c.category)}
                      </span>

                      <span className="tnum font-mono text-xs text-fg-3">
                        {c.won}/{c.count}
                      </span>
                    </div>

                    <Progress
                      value={(c.won / c.count) * 100}
                      tone="info"
                      barClassName="h-1"
                    />
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </Reveal>

        {/* Достижения */}
        <Reveal delay={150}>
          <Card className="card-interactive h-full">
            <CardHeader>
              <CardTitle>Достижения</CardTitle>
            </CardHeader>

            <CardBody>
              {profile.achievements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Award className="h-6 w-6 text-fg-3" aria-hidden />
                  <p className="max-w-[240px] text-sm leading-relaxed text-fg-2">
                    Достижения откроются по ходу сезона. Ставьте на аутсайдеров и
                    собирайте серии побед.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {profile.achievements.map((a) => (
                    <li
                      key={a.achievement.code}
                      className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-tint text-volt">
                        <Medal className="h-4 w-4" aria-hidden />
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">
                          {a.achievement.title}
                        </div>
                        <div className="truncate text-xs text-fg-3">
                          {a.achievement.description}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Reveal>
      </div>

      {/* Пояснение про скор */}
      <Reveal delay={180}>
        <div className="flex items-start gap-2.5 rounded-lg border border-hairline bg-surface/50 px-4 py-3">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" aria-hidden />
          <p className="text-xs leading-relaxed text-fg-2">
            <span className="font-medium text-fg">Oracle Score</span> = 50%
            точность + 30% нормализованная прибыль + 20% стабильность. Позиция в{" "}
            <Link
              href={`/b/${slug}/leaderboard`}
              className="underline-offset-2 transition-colors hover:text-volt hover:underline"
            >
              лидерборде
            </Link>{" "}
            считается по балансу сезона.
          </p>
        </div>
      </Reveal>
    </div>
  );
}