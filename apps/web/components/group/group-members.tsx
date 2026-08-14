"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Trash2, UserRound } from "lucide-react";

import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupMemberRow {
  userId: string;
  name: string;
  avatar: string;
  role: "owner" | "admin" | "member";
  title?: string | null;
  joinedAt?: string;
  isCurrentUser?: boolean;
}

export interface GroupMembersProps {
  boardId: string;
  inviteCode: string;
}

const ROLE_LABEL: Record<GroupMemberRow["role"], string> = {
  owner: "владелец",
  admin: "админ",
  member: "участник",
};

function canManage(role?: GroupMemberRow["role"]): boolean {
  return role === "owner" || role === "admin";
}

export function GroupMembers({ boardId, inviteCode }: GroupMembersProps) {
  const [members, setMembers] = useState<GroupMemberRow[]>([]);
  const [myRole, setMyRole] = useState<GroupMemberRow["role"] | undefined>();
  const [myUserId, setMyUserId] = useState<string | undefined>();
  const [toRemove, setToRemove] = useState<GroupMemberRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      let me: { id?: string } | null = null;
      try {
        me = await api.auth.me();
      } catch {
        /* аноним */
      }
      const rows = await api.boards.getMembers(boardId);
      const list = (rows || []).map((m: any) => ({
        userId: m.userId,
        name: m.user?.name ?? "",
        avatar: m.user?.avatar ?? "slate",
        role: m.role ?? "member",
        title: m.title ?? null,
        joinedAt: m.joinedAt ?? null,
        isCurrentUser: me?.id ? m.userId === me.id : false,
      }));
      setMyUserId(me?.id);
      const own = list.find((m: GroupMemberRow) => m.isCurrentUser);
      if (own) setMyRole(own.role);
      setMembers(list);
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить участников");
    }
  }, [boardId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const confirmRemove = async () => {
    if (!toRemove) return;
    setPending(true);
    setError(null);
    try {
      await api.boards.removeMember(boardId, toRemove.userId);
      setToRemove(null);
      await loadMembers();
    } catch (e: any) {
      setError(e.message || "Не удалось удалить участника");
    } finally {
      setPending(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* нет доступа к буферу */
    }
  };

  return (
    <div className="space-y-5">
      {/* Инвайт-код */}
      <Card className="card-interactive panel-beam">
        <CardHeader>
          <CardTitle>Приглашение в группу</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3 shadow-[0_0_44px_rgba(215,255,62,0.06)]">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-fg-3">
                Инвайт-код
              </div>
              <div className="tnum truncate font-mono text-sm font-semibold tracking-wide text-volt">
                {inviteCode}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={copyCode}>
              {copied ? (
                <Check className="h-4 w-4 text-win" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Скопировано" : "Копировать"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Делитесь кодом с друзьями, чтобы пригласить их. Войти по коду можно на
            странице входа.
          </p>
        </CardBody>
      </Card>

      {/* Участники */}
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle>Участники · {members.length}</CardTitle>
        </CardHeader>
        <CardBody>
          {error && (
            <p
              role="alert"
              className="animate-fade-in mb-3 rounded-lg border border-loss/30 bg-loss-tint px-3 py-2 text-[13px] text-loss"
            >
              {error}
            </p>
          )}

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <UserRound className="h-8 w-8 text-fg-3 opacity-50" aria-hidden />
              <p className="text-sm text-fg-3">В группе пока никого нет.</p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline/60">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="list-row flex items-center gap-3 rounded-lg px-2 py-2.5"
                >
                  <Avatar name={m.name} color={m.avatar as any} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">
                      {m.name}
                      {m.isCurrentUser && (
                        <span className="ml-1.5 text-xs font-normal text-volt">
                          вы
                        </span>
                      )}
                    </div>
                    {m.title && (
                      <div className="truncate text-[11px] text-fg-3">{m.title}</div>
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

                  {canManage(myRole) &&
                    m.role !== "owner" &&
                    !m.isCurrentUser && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Удалить ${m.name}`}
                        onClick={() => setToRemove(m)}
                        className="text-fg-3 hover:bg-loss-tint hover:text-loss"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Подтверждение удаления */}
      <Dialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Удалить участника?"
        description={`«${toRemove?.name}» потеряет доступ к группе и свой рейтинг. Это действие нельзя отменить.`}
        size="sm"
      >
        {error && (
          <p
            role="alert"
            className="animate-fade-in mb-3 rounded-lg border border-loss/30 bg-loss-tint px-3 py-2 text-[13px] text-loss"
          >
            {error}
          </p>
        )}
        {toRemove && (
          <Button
            variant="danger"
            className="w-full btn-destructive-glow"
            disabled={pending}
            onClick={confirmRemove}
          >
            {pending ? "Удаляем…" : "Удалить участника"}
          </Button>
        )}
      </Dialog>
    </div>
  );
}