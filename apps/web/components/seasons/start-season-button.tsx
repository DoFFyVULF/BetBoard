"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";

import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface StartSeasonButtonProps {
  className?: string;
  boardId: string;
  onStarted?: (season: { id: string; name: string }) => void;
}

export function StartSeasonButton({ className, boardId }: StartSeasonButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setPending(true);
    setError(null);

    try {
      const season = await api.seasons.start(boardId, {
        name: `Сезон ${new Date().getFullYear()}`,
        startingBalance: 1000,
      });

      if (season?.id) {
        setOpen(false);
        window.location.reload();
      } else {
        setError("Не удалось создать сезон");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при запуске сезона");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={className}>
      <Button className="btn-primary-glow group" onClick={() => setOpen(true)}>
        <Rocket
          className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12"
          aria-hidden
        />
        Старт нового сезона
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Новый сезон"
        description="Все участники получат по 1000 стартовых очков. Текущие активные ставки и балансы будут заморожены."
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-fg-2">
            Итоги текущего сезона сохранятся в истории. Лидерборд начнётся с
            чистого листа.
          </p>

          {error && (
            <p
              role="alert"
              className="animate-fade-in rounded-lg bg-loss-tint px-3 py-2 text-[13px] text-loss"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>

            <Button
              variant="primary"
              className="btn-primary-glow group"
              disabled={pending}
              onClick={start}
            >
              {pending ? "Запускаем…" : "Запустить сезон"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
