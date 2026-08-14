"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Lock } from "lucide-react";
import { api } from "@/lib/api/client";
import type { EventView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ResolvePanel } from "@/components/events/resolve-panel";

export interface EventAdminControlsProps {
  view: EventView;
  /** Роль текущего пользователя на доске. */
  role: "owner" | "admin" | "member" | null;
  className?: string;
}

/**
 * Управление событием для владельца/админа доски:
 *  - open  → «Завершить приём ставок» (закрыть событие для расчёта);
 *  - closed → ResolvePanel (выбор победителя / отмена с возвратом ставок).
 * Обычные участники ничего тут не видят.
 */
export function EventAdminControls({ view, role, className }: EventAdminControlsProps) {
  const router = useRouter();
  const isAdmin = role === "owner" || role === "admin";
  const [pendingClose, setPendingClose] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  const status = view.effectiveStatus;

  const closeForResolve = async () => {
    setPendingClose(true);
    setError(null);
    try {
      await api.events.close(view.event.id);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при закрытии приёма ставок");
      setPendingClose(false);
    }
  };

  return (
    <div className={className}>
      {status === "open" && (
        <div className="rounded-lg border border-warn/30 bg-warn-tint px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-fg-2">
              Приём ставок открыт. Хотите остановить и зафиксировать результат?
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingClose}
              onClick={closeForResolve}
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {pendingClose ? "Закрываем…" : "Завершить приём ставок"}
            </Button>
          </div>
          {error && <p role="alert" className="mt-1.5 text-xs text-loss">{error}</p>}
        </div>
      )}

      {status === "closed" && <ResolvePanel view={view} />}
    </div>
  );
}