"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type EventsTab = "all" | "open" | "closed" | "resolved";

export interface EventFiltersProps {
  boardSlug: string;
  /** Активная вкладка по статусу (приходит из searchParams). */
  tab: EventsTab;
  /** Текущая категория (пустая строка — все). */
  category: string;
}

const TABS: { key: EventsTab; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "open", label: "Открытые" },
  { key: "closed", label: "Ждут результата" },
  { key: "resolved", label: "Завершённые" },
];

const CATEGORIES = [
  { value: "", label: "Все категории" },
  { value: "board", label: "Настолки" },
  { value: "sport", label: "Спорт" },
  { value: "movie", label: "Кино" },
  { value: "food", label: "Еда" },
  { value: "travel", label: "Поездки" },
  { value: "chaos", label: "Хаос" },
  { value: "meta", label: "Мета" },
  { value: "games", label: "Видеоигры" },
];

/**
 * Фильтры событий. Чистый клиентский компонент: состояние живёт в URL,
 * пересборку страницы делает router.push, а сервер передаёт tab/category.
 */
export function EventFilters({ boardSlug, tab, category }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setQuery = (nextTab: EventsTab, nextCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab !== "all") params.set("status", nextTab);
    else params.delete("status");
    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");
    router.push(`/b/${boardSlug}/events?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setQuery(t.key, category)}
            aria-pressed={tab === t.key}
            className={cn(
              "relative rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
              tab === t.key
                ? "bg-volt-tint text-fg shadow-[0_0_20px_rgba(215,255,62,0.1)]"
                : "text-fg-2 hover:text-fg hover:bg-neutral-tint",
            )}
          >
            {t.label}
            {tab === t.key && (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-volt shadow-[0_0_8px_rgba(215,255,62,0.9)]"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-fg-3" aria-hidden />
        <Select
          value={category}
          onChange={(e) => setQuery(tab, e.target.value)}
          aria-label="Категория"
          className="w-44"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Button asChild size="sm">
          <Link href={`/b/${boardSlug}/events/new`}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Событие
          </Link>
        </Button>
      </div>
    </div>
  );
}
