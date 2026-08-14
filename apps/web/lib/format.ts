import type { EventStatus, LedgerType } from "./types";

/** Тонкий неразрывный пробел между разрядами числа. */
export function formatPoints(value: number): string {
  const n = Math.round(value);
  return n.toLocaleString("ru-RU").replace(/ /g, " ");
}

/** Очки со знаком для изменений (прибыль/убыток). */
export function formatSignedPoints(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPoints(Math.abs(value))}`;
}

/** Коэффициент «×2.75» (или «—» когда ещё нет пула на исход). */
export function formatOdds(odds: number | null | undefined): string {
  if (odds == null || !isFinite(odds)) return "—";
  const rounded = Math.round(odds * 100) / 100;
  return `×${rounded.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Короткая дата: «4 авг» */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

/** Дата и время: «4 авг, 19:00» */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Относительное время в духе «2 ч назад». */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 0) return "через " + timeUntil(d);
  if (diffSec < 60) return "только что";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  const weeks = Math.floor(days / 7);
  return `${weeks} нед назад`;
}

/** Относительное время до даты: «через 2 ч». */
export function timeUntil(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
  if (diffSec < 60) return "1 мин";
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч ${minutes % 60} мин`;
  const days = Math.floor(hours / 24);
  return `${days} дн`;
}

/** Компактное время до закрытия для бейджа: «2 ч», «14 мин». */
export function timeUntilShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 1) return "1 мин";
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч`;
  return `${Math.floor(hours / 24)} дн`;
}

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Черновик",
  open: "Приём ставок",
  closed: "Ставки закрыты",
  resolved: "Завершено",
  canceled: "Отменено",
  disputed: "Спорно",
};

export const LEDGER_LABEL: Record<LedgerType, string> = {
  season_start: "Старт сезона",
  bet_lock: "Ставка",
  bet_unlock: "Возврат ставки",
  payout: "Выплата",
  refund: "Возврат",
  adjustment: "Корректировка",
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Склонение числительных: 1 ставка, 2 ставки, 5 ставок. */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
