import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/lib/format";
import { getBoardBySlug, getMembers } from "@/lib/data/api-accessors";

export interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `Настройки — ${board.name}` : "Настройки",
  };
}

const ROLE_LABEL = {
  owner: "владелец",
  admin: "админ",
  member: "участник",
} as const;

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const members = await getMembers(board.id);

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader
          title="Настройки доски"
          description="Состав участников, инвайт-код и параметры доски."
        />
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Доска */}
        <Reveal delay={70}>
          <Card className="card-interactive panel-beam h-full">
            <CardHeader>
              <CardTitle>Доска</CardTitle>
            </CardHeader>

            <CardBody className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-3">Название</dt>
                  <dd className="text-right font-medium text-fg">{board.name}</dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-fg-3">Валюта</dt>
                  <dd className="text-right font-medium text-fg">
                    {board.currencyName}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-fg-3">Часовой пояс</dt>
                  <dd className="text-right font-medium text-fg">
                    {board.timezone}
                  </dd>
                </div>

                <div className="flex justify-between gap-3">
                  <dt className="text-fg-3">Создана</dt>
                  <dd className="text-right font-medium text-fg">
                    {formatDate(board.createdAt)}
                  </dd>
                </div>
              </dl>

              <div className="rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 shadow-[0_0_44px_rgba(215,255,62,0.06)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-fg-3">Инвайт-код</span>

                  <span className="tnum font-mono text-sm font-semibold tracking-wide text-volt">
                    {board.inviteCode}
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-muted">
                  Делитесь кодом с друзьями, чтобы пригласить их на доску.
                </p>
              </div>
            </CardBody>
          </Card>
        </Reveal>

        {/* Участники */}
        <Reveal delay={120}>
          <Card className="card-interactive h-full">
            <CardHeader>
              <CardTitle>Участники · {members.length}</CardTitle>
            </CardHeader>

            <CardBody>
              <ul className="divide-y divide-hairline/60">
                {members.map((m) => (
                  <li
                    key={m.user.id}
                    className="list-row flex items-center gap-3 rounded-lg px-2 py-2.5"
                  >
                    <Avatar name={m.user.name} color={m.user.avatar} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg">
                        {m.user.name}

                        {m.isCurrentUser && (
                          <span className="ml-1.5 text-xs font-normal text-volt">
                            вы
                          </span>
                        )}
                      </div>

                      {m.title && (
                        <div className="truncate text-[11px] text-fg-3">
                          {m.title}
                        </div>
                      )}
                    </div>

                    <Badge
                      tone={
                        m.role === "owner"
                          ? "volt"
                          : m.role === "admin"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {ROLE_LABEL[m.role]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={140}>
        <p className="text-center text-xs text-muted">
          Редактирование доски и управление ролями появится в бекенд-части.
        </p>
      </Reveal>
    </div>
  );
}