"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";

import { api } from "@/lib/api/client";
import type { EventView } from "@/lib/types";
import { formatOdds, formatPoints } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BetPanelProps {
  view: EventView;
  /** Доступно к ставке. */
  available: number;
  className?: string;
}

/**
 * Панель ставки: выбор исхода, сумма, превью выплаты.
 * Если ставка уже сделана — показывает её (read-only).
 */
export function BetPanel({ view, available, className }: BetPanelProps) {
  const router = useRouter();
  const { event, outcomes, myBet, totalPool } = view;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>(String(event.minBet));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = outcomes.find((o) => o.outcome.id === selectedId) ?? null;
  const num = Number(amount);
  const valid =
    selected != null &&
    Number.isInteger(num) &&
    num >= event.minBet &&
    num <= event.maxBet &&
    num <= available;

  const potential = useMemo(() => {
    if (!selected || !Number.isInteger(num) || num <= 0) return null;
    if (selected.odds == null) return null;
    return Math.floor(num * selected.odds);
  }, [selected, num]);

  // ---------- Ставка уже сделана ----------
  if (myBet) {
    const myOutcome = outcomes.find((o) => o.myBet?.id === myBet.id) ?? null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-volt-ring bg-volt-tint px-3 py-2 text-[13px] text-fg">
          <Lock className="h-3.5 w-3.5 shrink-0 text-volt" aria-hidden />

          <span>
            Ставка сделана:{" "}
            <span className="font-medium text-volt">
              {formatPoints(myBet.amount)} очков
            </span>
            {myOutcome && <> на «{myOutcome.outcome.label}»</>}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[13px]">
          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <dt className="text-xs text-fg-3">Потенциальная выплата</dt>

            <dd className="tnum mt-0.5 font-mono text-[15px] font-semibold text-fg">
              {formatPoints(myBet.amount * (myOutcome?.odds ?? 1))} очков
            </dd>
          </div>

          <div className="rounded-lg bg-surface-2 px-3 py-2">
            <dt className="text-xs text-fg-3">Статус</dt>

            <dd className="mt-0.5 font-medium text-fg-2">
              {myBet.status === "active" ? "Активна" : "Завершена"}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  // ---------- Форма ----------
  return (
    <div className={cn("space-y-4", className)}>
      {/* Выбор исхода */}
      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-3">
          Исход
        </legend>

        <div className="space-y-2">
          {outcomes.map((o) => {
            const isSelected = selectedId === o.outcome.id;

            return (
              <button
                key={o.outcome.id}
                type="button"
                onClick={() => setSelectedId(o.outcome.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-300",
                  isSelected
                    ? "border-volt bg-volt-tint shadow-[0_0_24px_rgba(215,255,62,0.12)]"
                    : "border-hairline-strong bg-surface-2 hover:border-fg-3 hover:bg-surface-3",
                )}
              >
                <span className="text-sm text-fg transition-transform duration-300 group-hover:translate-x-0.5">
                  {o.outcome.label}
                </span>

                <span className="flex items-center gap-2">
                  <span className="tnum font-mono text-sm font-semibold text-fg-2">
                    {formatOdds(o.odds)}
                  </span>

                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-volt text-volt-ink animate-fade-in">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Сумма */}
      <div>
        <label
          htmlFor="bet-amount"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-3"
        >
          Сумма · от {event.minBet} до {formatPoints(event.maxBet)}
        </label>

        <div className="flex items-center gap-2">
          <Input
            id="bet-amount"
            type="number"
            inputMode="numeric"
            min={event.minBet}
            max={Math.min(event.maxBet, available)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            invalid={!!error}
            className="tnum font-mono"
          />

          <div className="shrink-0 text-sm text-fg-3">очков</div>
        </div>

        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="tnum text-fg-3">
            доступно {formatPoints(available)}
          </span>

          {event.maxBet < available && (
            <button
              type="button"
              onClick={() => setAmount(String(event.maxBet))}
              className="font-medium text-fg-2 transition-colors hover:text-volt"
            >
              макс. {formatPoints(event.maxBet)}
            </button>
          )}
        </div>
      </div>

      {/* Превью выплаты */}
      {potential != null && (
        <div className="flex items-center justify-between rounded-lg bg-neutral-tint px-3 py-2 text-[13px] animate-fade-in">
          <span className="text-fg-2">Потенциальная выплата</span>

          <span className="tnum font-mono font-semibold text-volt drop-shadow-[0_0_12px_rgba(215,255,62,0.18)]">
            {formatPoints(potential)} очков
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-loss">
          {error}
        </p>
      )}

      <Button
        className="w-full btn-primary-glow group"
        size="lg"
        disabled={!valid || pending}
        onClick={async () => {
          if (!selected || !valid) return;
          setPending(true);
          setError(null);

          try {
            await api.bets.place(event.id, {
              outcomeId: selected.outcome.id,
              amount: num,
            });

            // Обновляем серверные данные (SSR), чтобы панель показала
            // «Ставка сделана» и новый пул без ручного перезагруза страницы.
            setPending(false);
            router.refresh();
          } catch (err: any) {
            setError(err.message || "Ошибка при размещении ставки");
            setPending(false);
          }
        }}
      >
        {pending
          ? "Обрабатываем…"
          : `Поставить ${amount ? formatPoints(num) : ""} очков`}
      </Button>

      <p className="text-center text-xs text-muted">
        Общий пул: {formatPoints(totalPool)} очков · при паримутуале пул делится
        между угадавшими
      </p>
    </div>
  );
}