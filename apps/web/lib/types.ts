/**
 * Доменные типы BetBoard — зеркало схемы данных из ABOUT.md.
 * Фронтенд работает с этими типами и в мок-режиме, и после подключения API.
 */

export type Role = "owner" | "admin" | "member";

export type SeasonStatus = "draft" | "active" | "finished";

export type EventStatus = "draft" | "open" | "closed" | "resolved" | "canceled" | "disputed";

export type OddsMode = "fixed" | "parimutuel";

export type BetStatus = "active" | "won" | "lost" | "refunded" | "canceled";

export type LedgerType =
  | "season_start"
  | "bet_lock"
  | "bet_unlock"
  | "payout"
  | "refund"
  | "adjustment";

export type Category =
  | "board"
  | "sport"
  | "movie"
  | "food"
  | "travel"
  | "chaos"
  | "meta"
  | "games";

export type AvatarColor =
  | "volt"
  | "sky"
  | "rose"
  | "amber"
  | "mint"
  | "violet"
  | "slate";

export interface User {
  id: string;
  name: string;
  /** Акцентный цвет аватара (ключ палитры). */
  avatar: AvatarColor;
}

/**
 * Учётные данные для входа. Пароль в демо-хранилище хранится в открытом виде —
 * это заглушка до подключения настоящего бекенда (apps/api) с хэшированием.
 */
export interface Credential {
  userId: string;
  /** Идентификатор для входа: имя или handle («vika»). */
  login: string;
  password: string;
}

export interface Board {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string;
  /** Название валюты компании: «очки», «голды», «баранки»… */
  currencyName: string;
  timezone: string;
  inviteCode: string;
  createdAt: string;
  /** Владелец (приходит из API в расширенной форме). */
  owner?: { id: string; name: string; avatar: string } | null;
  /** Участники (из API в расширенной форме). */
  members?: Array<{
    user: { id: string; name: string; avatar: string };
    role?: string;
    joinedAt?: string;
    title?: string | null;
  }>;
}

export interface GroupMember {
  boardId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  /** Действующий титул участника (для игровой подачи). */
  title: string | null;
}

export interface Season {
  id: string;
  boardId: string;
  name: string;
  status: SeasonStatus;
  startingBalance: number;
  startsAt: string;
  endsAt: string | null;
}

export interface Wallet {
  id: string;
  seasonId: string;
  userId: string;
  balance: number;
  lockedBalance: number;
}

export interface WalletState {
  seasonId: string;
  userId: string;
  /** Доступно к ставке. */
  available: number;
  /** Заблокировано активными ставками. */
  locked: number;
  total: number;
}

export interface BetEvent {
  id: string;
  boardId: string;
  seasonId: string;
  title: string;
  description: string | null;
  category: Category;
  closesAt: string;
  startsAt: string | null;
  status: EventStatus;
  oddsMode: OddsMode;
  minBet: number;
  maxBet: number;
  createdBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventOutcome {
  id: string;
  eventId: string;
  label: string;
  sortOrder: number;
  /** Фиксированный коэффициент (для oddsMode === "fixed"). */
  fixedOdds: number | null;
  /** Отмечен ли исход победным после разрешения. */
  winning: boolean | null;
}

export interface Bet {
  id: string;
  eventId: string;
  outcomeId: string;
  userId: string;
  amount: number;
  createdAt: string;
  status: BetStatus;
  payout: number | null;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  eventId: string | null;
  betId: string | null;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface CommentView extends EventComment {
  user: User;
  reactions: { emoji: string; count: number }[];
}

export interface EventReaction {
  id: string;
  eventId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  seasonId: string | null;
  earnedAt: string;
}

/** Публичный профиль оракула — вычисляемая модель. */
export interface OracleProfile {
  user: User;
  balance: number;
  locked: number;
  /** Точность прогнозов, 0..1. */
  accuracy: number;
  /** Чистая прибыль за сезон (может быть отрицательной). */
  profit: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  /** Рейтинг оракула (композитный скоринг). */
  oracleScore: number;
  /** Позиция в таблице сезона. */
  rank: number;
  /** Разбивка по категориям. */
  byCategory: { category: Category; count: number; won: number }[];
  titles: string[];
  achievements: { achievement: Achievement; earnedAt: string }[];
}

/** Строка таблицы лидеров. */
export interface LeaderboardRow {
  rank: number;
  user: User;
  balance: number;
  profit: number;
  accuracy: number;
  totalBets: number;
  title: string | null;
  isCurrentUser: boolean;
}

/** View-модель исхода события (с рыночными данными и моей ставкой). */
export interface EventOutcomeView {
  outcome: EventOutcome;
  pool: number;
  backers: number;
  odds: number | null;
  share: number;
  /** Моя ставка на этот исход (если есть). */
  myBet: Bet | null;
  isWinner: boolean;
}

/** View-модель события для карточки и детальной страницы. */
export interface EventView {
  event: BetEvent;
  board: Pick<Board, "id" | "slug" | "name" | "currencyName">;
  outcomes: EventOutcomeView[];
  totalPool: number;
  totalBets: number;
  totalBackers: number;
  /** Моя ставка на событие (любой исход). */
  myBet: Bet | null;
  createdBy: User;
  /** Эффективный статус (учитывает время закрытия). */
  effectiveStatus: EventStatus;
  /** Победный исход (для resolved). */
  winningOutcome: EventOutcomeView | null;
  /** Сколько ставок сделано участниками (уникальные пользователи). */
  backerCount: number;
}

/** Запись ledger с названием события (для отображения). */
export interface LedgerEntryView extends LedgerEntry {
  eventTitle: string | null;
}

/** Информация об участнике с пользователем. */
export interface MemberView {
  user: User;
  role: Role;
  joinedAt: string;
  title: string | null;
  balance: number;
  isCurrentUser: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  board: "Настолки",
  sport: "Спорт",
  movie: "Кино",
  food: "Еда",
  travel: "Поездки",
  chaos: "Хаос",
  meta: "Мета",
  games: "Видеоигры",
};

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category] || category;
}
