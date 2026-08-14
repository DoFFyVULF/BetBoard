"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import type { EventView } from "@/lib/types";
import { formatPoints } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface ResolvePanelProps {
  view: EventView;
  className?: string;
}

/**
 * Панель модератора для события в статусе «closed»: выбор победителя
 * или отмена с возвратом ставок.
 */
export function ResolvePanel({ view, className }: ResolvePanelProps) {
  const router = useRouter();
  const { event, outcomes, totalPool } = view;
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (outcomeId: string) => {
    setPending(true);
    setError(null);
    try {
      // api.resolve.resolveEvent бросает исключение при ошибке (HTTP != 2xx),
      // поэтому успех = переход к router.refresh без ветки ошибки.
      await api.resolve.resolveEvent(event.id, { winningOutcomeIds: [outcomeId] });
      setOpen(false);
      // Обновляем серверные данные (SSR), чтобы результат и статус события
      // отобразились сразу, без ручного перезагруза страницы.
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при разрешении события");
    }
    setPending(false);
  };

  const doCancel = async () => {
    setPending(true);
    setError(null);
    try {
      // api.events.cancel бросает исключение при ошибке — вызрев успех = refresh.
      await api.events.cancel(event.id);
      setConfirmCancel(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при отмене события");
    }
    setPending(false);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setOpen(true)}>
          <Flag className="h-4 w-4" aria-hidden />
          Зафиксировать результат
        </Button>
        {!confirmCancel ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
            Отменить событие
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-2">Вернуть {formatPoints(totalPool)} очков всем?</span>
            <Button variant="danger" size="sm" disabled={pending} onClick={doCancel}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Отменить
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
              Нет
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-loss">
          {error}
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Фиксация результата"
        description="Отметьте победивший исход. Пул будет распределён между теми, кто поставил на него."
        size="sm"
      >
        <div className="space-y-2">
          {outcomes.map((o) => (
            <button
              key={o.outcome.id}
              type="button"
              disabled={pending}
              onClick={() => choose(o.outcome.id)}
              className="flex w-full items-center justify-between rounded-lg border border-hairline-strong bg-surface-2 px-3 py-2.5 text-left transition-colors hover:border-volt"
            >
              <span className="text-sm text-fg">{o.outcome.label}</span>
              <span className="tnum font-mono text-xs text-fg-3">
                {o.backers} {o.backers === 1 ? "ставка" : o.backers < 5 ? "ставки" : "ставок"}
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
