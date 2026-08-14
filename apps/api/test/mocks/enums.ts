/* Shared enums for BetBoard - mirrors Prisma schema */

export const Role = {
  owner: 'owner',
  admin: 'admin',
  member: 'member',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const SeasonStatus = {
  draft: 'draft',
  active: 'active',
  finished: 'finished',
} as const;

export type SeasonStatus = (typeof SeasonStatus)[keyof typeof SeasonStatus];

export const EventStatus = {
  draft: 'draft',
  open: 'open',
  closed: 'closed',
  resolved: 'resolved',
  canceled: 'canceled',
  disputed: 'disputed',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const OddsMode = {
  fixed: 'fixed',
  parimutuel: 'parimutuel',
} as const;

export type OddsMode = (typeof OddsMode)[keyof typeof OddsMode];

export const BetStatus = {
  active: 'active',
  won: 'won',
  lost: 'lost',
  refunded: 'refunded',
  canceled: 'canceled',
} as const;

export type BetStatus = (typeof BetStatus)[keyof typeof BetStatus];

export const LedgerType = {
  season_start: 'season_start',
  bet_lock: 'bet_lock',
  bet_unlock: 'bet_unlock',
  payout: 'payout',
  refund: 'refund',
  adjustment: 'adjustment',
} as const;

export type LedgerType = (typeof LedgerType)[keyof typeof LedgerType];

export const Category = {
  board: 'board',
  sport: 'sport',
  movie: 'movie',
  food: 'food',
  travel: 'travel',
  chaos: 'chaos',
  meta: 'meta',
  games: 'games',
} as const;

export type Category = (typeof Category)[keyof typeof Category];
