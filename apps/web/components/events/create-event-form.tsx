"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardBody } from "@/components/ui/card";

export interface CreateEventFormProps {
  /** Идентификатор доски (UUID), не slug — бэкенд проверяет членство по id. */
  boardId: string;
  /** Активный сезон, к которому привязывается событие (если есть). */
  seasonId?: string;
  /** Slug доски для построения URL навигации (/b/[slug]/...). */
  boardSlug: string;
  className?: string;
}

type OutcomeRow = {
  label: string;
  fixedOdds: string;
};

const MIN_OUTCOMES = 2;

export function CreateEventForm({
  boardId,
  seasonId,
  boardSlug,
  className,
}: CreateEventFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("board");
  const [oddsMode, setOddsMode] = useState<"parimutuel" | "fixed">(
    "parimutuel",
  );
  const [closesAt, setClosesAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 3600_000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  });
  const [minBet, setMinBet] = useState("10");
  const [maxBet, setMaxBet] = useState("200");
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([
    { label: "", fixedOdds: "" },
    { label: "", fixedOdds: "" },
  ]);

  const setOutcome = (i: number, patch: Partial<OutcomeRow>) =>
    setOutcomes((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );

  const addOutcome = () =>
    setOutcomes((rows) => [...rows, { label: "", fixedOdds: "" }]);

  const removeOutcome = (i: number) =>
    setOutcomes((rows) =>
      rows.length > MIN_OUTCOMES ? rows.filter((_, idx) => idx !== i) : rows,
    );

  const submit = async () => {
    setError(null);
    setPending(true);

    const fixedOddsParsed = outcomes.map((o) =>
      o.fixedOdds.trim() === ""
        ? undefined
        : Number(o.fixedOdds.replace(",", ".")),
    );

    try {
      const res = await api.events.create(boardId, {
        title,
        seasonId,
        description: description.trim() || undefined,
        category: category as "board",
        closesAt: new Date(closesAt).toISOString(),
        oddsMode,
        minBet: Number(minBet),
        maxBet: Number(maxBet),
        outcomes: outcomes.map((o, i) => ({
          label: o.label.trim(),
          fixedOdds: fixedOddsParsed[i],
        })),
      });

      if (res?.id) {
        router.push(`/b/${boardSlug}/events/${res.id}`);
      } else {
        setError(res?.error || "Ошибка при создании события");
        setPending(false);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при создании события");
      setPending(false);
    }
  };

  return (
    <Card className={cn("terminal-panel card-interactive w-full", className)}>
      <CardBody className="space-y-6 p-5 sm:p-6">
        {/* Основные поля */}
        <div className="space-y-5">
          <Field label="Название события" required htmlFor="ev-title">
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Кто выиграет партию в «Каркассон»?"
              maxLength={120}
              className="transition-colors duration-200 focus:bg-surface-3"
            />
          </Field>

          <Field
            label="Описание"
            htmlFor="ev-desc"
            hint="Контекст, условия победы или особые правила."
          >
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Пара слов о ставке…"
              rows={2}
              maxLength={500}
              className="resize-none transition-colors duration-200 focus:bg-surface-3"
            />
          </Field>

          {/* Сетка параметров: Категория + Модель */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Категория" htmlFor="ev-cat">
              <Select
                id="ev-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="transition-colors duration-200 focus:bg-surface-3"
              >
                <option value="board">Настолки</option>
                <option value="sport">Спорт</option>
                <option value="movie">Кино</option>
                <option value="food">Еда</option>
                <option value="travel">Поездки</option>
                <option value="chaos">Хаос</option>
                <option value="meta">Мета</option>
                <option value="games">Видеоигры</option>
              </Select>
            </Field>

            <Field label="Модель коэффициентов" htmlFor="ev-odds">
              <Select
                id="ev-odds"
                value={oddsMode}
                onChange={(e) =>
                  setOddsMode(e.target.value as "parimutuel" | "fixed")
                }
                className="transition-colors duration-200 focus:bg-surface-3"
              >
                <option value="parimutuel">Паримутуал (пул)</option>
                <option value="fixed">Фиксированные кэфы</option>
              </Select>
            </Field>
          </div>

          {/* Дата закрытия */}
          <Field
            label="Закрытие приёма ставок"
            htmlFor="ev-close"
            hint="После этого времени сделать ставку нельзя."
          >
            <Input
              id="ev-close"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              className="transition-colors duration-200 focus:bg-surface-3"
            />
          </Field>

          {/* Сетка лимитов */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Мин. ставка (очки)" htmlFor="ev-min">
              <Input
                id="ev-min"
                type="number"
                value={minBet}
                onChange={(e) => setMinBet(e.target.value)}
                min={1}
                className="tnum font-mono transition-colors duration-200 focus:bg-surface-3"
              />
            </Field>

            <Field label="Макс. ставка (очки)" htmlFor="ev-max">
              <Input
                id="ev-max"
                type="number"
                value={maxBet}
                onChange={(e) => setMaxBet(e.target.value)}
                min={1}
                className="tnum font-mono transition-colors duration-200 focus:bg-surface-3"
              />
            </Field>
          </div>
        </div>

        {/* Секция исходов с визуальным разделением */}
        <div className="space-y-3 rounded-xl border border-hairline bg-surface/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-fg-2">
              Исходы
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="btn-ghost-glow h-8 gap-1.5 text-xs"
              onClick={addOutcome}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Добавить
            </Button>
          </div>

          <div className="space-y-2">
            {outcomes.map((o, i) => (
              <div
                key={i}
                className="animate-fade-up flex items-center gap-2"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Название исхода: занимает всё свободное место */}
                <Input
                  value={o.label}
                  onChange={(e) => setOutcome(i, { label: e.target.value })}
                  placeholder={`Исход ${i + 1}`}
                  aria-label={`Название исхода ${i + 1}`}
                  className="min-w-0 flex-1 transition-colors duration-200 focus:bg-surface-3"
                  maxLength={80}
                />

                {/* Коэффициент: фиксированная ширина, только для fixed режима */}
                {oddsMode === "fixed" && (
                  <Input
                    value={o.fixedOdds}
                    onChange={(e) =>
                      setOutcome(i, { fixedOdds: e.target.value })
                    }
                    placeholder="Кэф"
                    aria-label={`Коэффициент исхода ${i + 1}`}
                    className="tnum w-20 shrink-0 font-mono transition-colors duration-200 focus:bg-surface-3 sm:w-24"
                  />
                )}

                {/* Кнопка удаления: фиксированный квадрат */}
                <button
                  type="button"
                  onClick={() => removeOutcome(i)}
                  disabled={outcomes.length <= MIN_OUTCOMES}
                  aria-label={`Удалить исход ${i + 1}`}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fg-3 transition-all duration-200",
                    "hover:scale-105 hover:bg-loss-tint hover:text-loss",
                    "disabled:pointer-events-none disabled:opacity-30",
                  )}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <p
            role="alert"
            className="animate-fade-in rounded-lg bg-loss-tint px-3 py-2.5 text-[13px] font-medium text-loss"
          >
            {error}
          </p>
        )}

        {/* Подвал с кнопкой */}
        <div className="flex flex-col-reverse gap-3 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button
            size="lg"
            className="btn-primary-glow group w-full sm:w-auto"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "Создаём…" : "Создать событие"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}