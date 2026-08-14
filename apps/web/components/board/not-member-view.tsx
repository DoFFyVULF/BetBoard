import Link from "next/link";
import { LockKeyhole, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LogoMark } from "@/components/brand/logo-mark";
import { Reveal } from "@/components/motion/reveal";
import { LandingAuthNav } from "@/components/auth/landing-auth-nav";
import { TopBar } from "@/components/layout/top-bar";
import type { Board } from "@/lib/types";

interface NotMemberViewProps {
  board: Pick<Board, "name">;
}

/**
 * Плашка для не-участников и анонимов: доска закрыта, показываем только
 * заголовок, текст «Вы не состоите в этой группе» и кнопку на /my.
 * Рендерится в SSR-лейауте b/[slug]/layout.tsx вместо содержимого доски.
 */
export function NotMemberView({ board }: NotMemberViewProps) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-bg text-fg">
      <div className="noise" aria-hidden />

      <TopBar>
        <LandingAuthNav />
      </TopBar>

      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <Card className="terminal-panel card-interactive overflow-hidden">
              <div className="relative flex flex-col items-center px-6 pb-6 pt-10 text-center">
                <LogoMark className="animate-glow mb-5 h-14 w-14 rounded-2xl text-xl" />

                <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
                  {board.name}
                </h1>

                <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-2">
                  Вы не состоите в этой группе. Содержимое доски доступно
                  только её участникам.
                </p>
              </div>

              <CardBody className="pb-8 text-center">
                <Button asChild size="lg" className="btn-primary-glow group w-full">
                  <Link href="/my">
                    <Users className="h-4 w-4" aria-hidden />
                    Мои группы
                  </Link>
                </Button>

                <p className="mt-4 text-xs text-fg-3">
                  На странице «Мои группы» можно вступить по инвайт-коду.
                </p>
              </CardBody>
            </Card>
          </Reveal>
        </div>
      </main>
    </div>
  );
}