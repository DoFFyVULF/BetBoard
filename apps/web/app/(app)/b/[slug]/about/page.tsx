import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Copy, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { LogoMark } from "@/components/brand/logo-mark";
import { Reveal } from "@/components/motion/reveal";
import {
  getActiveSeason,
  getBoardBySlug,
  getMembers,
} from "@/lib/data/api-accessors";
import { formatDate } from "@/lib/format";

export interface BoardAboutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BoardAboutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  return {
    title: board ? `${board.name} — приглашение на доску` : "Доска",
  };
}

export default async function BoardAboutPage({ params }: BoardAboutPageProps) {
  const { slug } = await params;
  const board = await getBoardBySlug(slug);

  if (!board) {
    notFound();
  }

  const season = await getActiveSeason(board.id);
  const members = await getMembers(board.id);

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-bg">
      <div className="noise" aria-hidden />

      <TopBar />

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6">
        <div className="bg-grid" aria-hidden />

        <Reveal>
          <Card className="terminal-panel card-interactive overflow-hidden">
            {/* Шапка-карточка */}
            <div className="relative border-b border-hairline bg-surface-2 px-6 pb-6 pt-8 text-center">
              <LogoMark className="animate-glow mx-auto mb-4 h-12 w-12 rounded-xl text-lg" />

              <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
                {board.name}
              </h1>

              {board.description && (
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-2">
                  {board.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-fg-3">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {members.length} участников
                </span>

                {season && <span>сезон «{season.name}»</span>}

                <span>с {formatDate(board.createdAt)}</span>
              </div>
            </div>

            <CardBody className="space-y-6">
              {/* Участники */}
              <div>
                <div className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-3">
                  Кто играет
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {members.map((m) => (
                    <div
                      key={m.user.id}
                      className="list-row flex items-center gap-2 rounded-full border border-hairline bg-surface-2 py-1 pl-1 pr-3"
                    >
                      <Avatar
                        name={m.user.name}
                        color={m.user.avatar}
                        size="sm"
                      />

                      <span className="text-[13px] font-medium text-fg">
                        {m.user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Инвайт-код */}
              <div className="rounded-xl border border-hairline bg-surface-2 p-4 text-center shadow-[0_0_48px_rgba(215,255,62,0.07)]">
                <div className="text-xs text-fg-3">Инвайт-код</div>

                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="tnum font-mono text-lg font-bold tracking-[0.15em] text-volt">
                    {board.inviteCode}
                  </span>

                  <Copy className="h-4 w-4 text-fg-3" aria-hidden />
                </div>
              </div>

              {/* CTA */}
              <Button asChild size="lg" className="btn-primary-glow group w-full">
                <Link href={`/b/${slug}`}>
                  Открыть доску
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </Button>
            </CardBody>
          </Card>
        </Reveal>
      </main>
    </div>
  );
}