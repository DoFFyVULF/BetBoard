import type { BetEvent, EventOutcome, OddsMode } from "./types";

/**
 * Паримутуальная математика BetBoard (по ABOUT.md).
 * Коэффициент исхода = общий пул / пул исхода. Выплата = доля от пула.
 */

export interface OutcomePool {
  /** Сколько очков суммарно поставлено на исход. */
  pool: number;
  /** Сколько человек поставило на исход. */
  backers: number;
  /** Текущий ориентировочный коэффициент (null, пока на исход нет ставок). */
  odds: number | null;
  /** Доля пула исхода в общем пуле (0..1). */
  share: number;
}

export interface EventMarket {
  totalPool: number;
  totalBets: number;
  totalBackers: number;
  /** По каждому исходу: пул и коэффициент. */
  byOutcome: Map<string, OutcomePool>;
}

/**
 * Считает состояние рынка события: пулы и коэффициенты.
 * Для fixed — коэффициенты из исходов; для parimutuel — из пулов.
 */
export function computeMarket(
  event: Pick<BetEvent, "id" | "oddsMode">,
  outcomes: EventOutcome[],
  bets: { outcomeId: string; amount: number }[],
): EventMarket {
  const byOutcome = new Map<string, OutcomePool>();
  let totalPool = 0;
  let totalBackers = 0;

  const initialPool = (o: EventOutcome): OutcomePool => ({
    pool: 0,
    backers: 0,
    odds: event.oddsMode === "fixed" ? o.fixedOdds ?? null : null,
    share: 0,
  });

  for (const o of outcomes) byOutcome.set(o.id, initialPool(o));

  for (const b of bets) {
    const slot = byOutcome.get(b.outcomeId);
    if (!slot) continue;
    slot.pool += b.amount;
    slot.backers += 1;
    totalPool += b.amount;
    totalBackers += 1;
  }

  if (event.oddsMode === "parimutuel") {
    for (const slot of byOutcome.values()) {
      slot.odds = slot.pool > 0 ? totalPool / slot.pool : null;
    }
  }

  for (const slot of byOutcome.values()) {
    slot.share = totalPool > 0 ? slot.pool / totalPool : 0;
  }

  return {
    totalPool,
    totalBets: bets.length,
    totalBackers,
    byOutcome,
  };
}

/**
 * Потенциальная выплата для ставки (до результата).
 * parimutuel: amount × текущий коэффициент. fixed: amount × fixedOdds.
 */
export function potentialPayout(
  mode: OddsMode,
  amount: number,
  odds: number | null,
): number | null {
  if (odds == null || !isFinite(odds)) return null;
  return Math.floor(amount * odds);
}

/**
 * Реальный расчёт выплаты после разрешения события (ABOUT.md):
 * payout = общийПул × (ставка / пулПобедителей).
 * Используется и для parimutuel, и для fixed (в обоих случаях пул делится).
 */
export function computePayoutShare(
  amount: number,
  winningPool: number,
  totalPool: number,
): number {
  if (winningPool <= 0 || totalPool <= 0) return 0;
  return Math.floor(totalPool * (amount / winningPool));
}

/** Чистая прибыль после результата. */
export function netProfit(payout: number, amount: number): number {
  return payout - amount;
}
