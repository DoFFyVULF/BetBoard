/**
 * Реестр вариантов дашборда.
 * Рендерится тот или иной вариант на странице /board?view=<key>
 * (см. dashboard-router). Это временный механизм для сравнения дизайнов —
 * после выбора пользователем останется один, а не три.
 */

export const VARIANT_KEYS = [
  "current",
  "terminal",
  "calm",
  "sportsbook",
  "player",
] as const;

export type DashboardVariantKey = (typeof VARIANT_KEYS)[number];

export interface DashboardVariantMeta {
  key: DashboardVariantKey;
  label: string;
  hint: string;
}

export const DASHBOARD_VARIANTS: Record<DashboardVariantKey, DashboardVariantMeta> = {
  current: {
    key: "current",
    label: "Текущий",
    hint: "как было",
  },
  terminal: {
    key: "terminal",
    label: "Терминал",
    hint: "плотное табло",
  },
  calm: {
    key: "calm",
    label: "Спокойный",
    hint: "воздух и фокус",
  },
  sportsbook: {
    key: "sportsbook",
    label: "Спортсбук",
    hint: "события как герой",
  },
  player: {
    key: "player",
    label: "Кабинет",
    hint: "фокус на игроке",
  },
};

export function isVariantKey(value: string | undefined): value is DashboardVariantKey {
  return !!value && (VARIANT_KEYS as readonly string[]).includes(value);
}

/** Вариант по умолчанию — рекомендованный. */
export const DEFAULT_VARIANT: DashboardVariantKey = "calm";