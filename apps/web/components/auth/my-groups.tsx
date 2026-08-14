"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  KeyRound,
  LoaderCircle,
  LogIn,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGroupDialog } from "@/components/auth/create-group-dialog";
import { JoinGroupDialog } from "@/components/auth/join-group-dialog";
import { getAuthToken } from "@/lib/api/client";

interface BoardRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  inviteCode: string;
  _count?: { members: number; seasons: number };
}

/**
 * Секция «Мои группы» на лендинге и на странице /my.
 *  - гость: призыв войти/зарегистрироваться;
 *  - участник: карточки групп (имя, число участников, инвайт-код),
 *    кнопки «Создать группу» и «Вступить по коду».
 */
export function MyGroups() {
  const [status, setStatus] = useState<"loading" | "guest" | "ready">("loading");
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const load = async (silent = true) => {
    if (!getAuthToken()) {
      setStatus("guest");
      return;
    }
    if (!silent) setStatus("loading");
    const { api } = await import("@/lib/api/client");
    try {
      const data: BoardRow[] = await api.boards.list();
      setBoards(data ?? []);
      setStatus("ready");
    } catch {
      setStatus("guest");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasBoards = boards.length > 0;

  return (
    <div>
      {/* Заголовок секции */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Ваши доски</div>
          <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-fg">
            Мои группы
          </h2>
        </div>

        {status === "ready" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Создать
            </Button>
            <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>
              <KeyRound className="h-4 w-4" aria-hidden />
              Вступить по коду
            </Button>
          </div>
        )}
      </div>

      <div className="mt-5">
        {status === "loading" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-hairline bg-surface-2" />
            ))}
          </div>
        )}

        {status === "guest" && (
          <Card className="card-interactive p-8 text-center">
            <EmptyState
              icon={<LogIn className="h-5 w-5" aria-hidden />}
              title="Войдите, чтобы увидеть свои группы"
              description="Здесь появятся доски, в которых вы состоите, и инвайт-коды для друзей."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild size="sm" className="btn-primary-glow">
                    <Link href="/login">Войти</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login?mode=register">Зарегистрироваться</Link>
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {status === "ready" && !hasBoards && (
          <Card className="card-interactive p-8 text-center">
            <EmptyState
              icon={<Users className="h-5 w-5" aria-hidden />}
              title="Пока нет групп"
              description="Придумайте название доски или вступите по инвайт-коду — и начните ставить очки."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Создать группу
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setJoinOpen(true)}>
                    <KeyRound className="h-4 w-4" aria-hidden />
                    Вступить по коду
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {status === "ready" && hasBoards && (
          <div className="grid gap-3 sm:grid-cols-2">
            {boards.map((b) => (
              <Link
                key={b.id}
                href={`/b/${b.slug}`}
                className="card-interactive group rounded-2xl border border-hairline bg-surface p-5 transition-all duration-300 hover:border-volt/40 hover:shadow-[0_0_32px_rgba(215,255,62,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-fg group-hover:text-volt">
                      {b.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-fg-3">
                      {b.description || "Без описания"}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-fg-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-volt"
                    aria-hidden
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {b._count?.members ?? 0} уч.
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    <span className="tnum font-mono tracking-wider">{b.inviteCode}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupDialog open={joinOpen} onOpenChange={setJoinOpen} onJoined={() => load(false)} />

      {status === "loading" && null}
    </div>
  );
}