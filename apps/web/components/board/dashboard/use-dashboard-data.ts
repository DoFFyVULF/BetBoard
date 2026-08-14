"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { DashboardData } from "./dashboard-data";
import type { EventView, Bet, EventOutcomeView } from "@/lib/types";

async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (err: any) {
    // Ignore 401/403 - user is not a member of the board.
    // Любые остальные ошибки (сеть, пустой JSON, таймаут) тоже глушим,
    // чтобы один упавший виджет не ломал весь дашборд — виджет просто
    // покажет пустые/нулевые данные.
    return null;
  }
}

/** Build EventView objects from raw API event data + pool + myBets. */
function buildEventViews(
  apiEvents: any[],
  poolByEvent: Map<string, any>,
  myBets: Bet[],
  userId: string,
): EventView[] {
  return apiEvents.map((apiEvent) => {
    const pool = poolByEvent.get(apiEvent.id);
    const isClosed =
      apiEvent.status === "open" &&
      Date.now() >= new Date(apiEvent.closesAt).getTime();
    const effectiveStatus = isClosed ? "closed" : apiEvent.status;

    const outcomes: EventOutcomeView[] = (apiEvent.outcomes || []).map((o: any) => {
      const outcomePool = pool?.outcomes?.find((po: any) => po.outcomeId === o.id) ?? {
        pool: 0,
        backers: 0,
        odds: o.fixedOdds ?? null,
      };
      return {
        outcome: o,
        pool: outcomePool.pool ?? 0,
        backers: outcomePool.backers ?? 0,
        odds: outcomePool.odds ?? o.fixedOdds ?? null,
        share: pool ? (outcomePool.pool ?? 0) / (pool.totalPool || 1) : 0,
        myBet: null,
        isWinner: o.winning === true,
      };
    });

    // Attach myBet to the matching outcome
    const myBetOnEvent = myBets.find(
      (b) => b.eventId === apiEvent.id && b.status === "active",
    );
    if (myBetOnEvent) {
      const outcomeView = outcomes.find((ov) => ov.outcome.id === myBetOnEvent.outcomeId);
      if (outcomeView) {
        outcomeView.myBet = myBetOnEvent;
      }
    }

    // Compute total pool and backers
    const totalPool = pool?.totalPool ?? 0;
    const totalBackers = pool?.totalBackers ?? 0;
    const totalBets = totalBackers;

    // Find winning outcome
    const winningOutcome = outcomes.find((o) => o.isWinner) || null;

    return {
      event: {
        id: apiEvent.id,
        boardId: apiEvent.boardId,
        seasonId: apiEvent.seasonId,
        title: apiEvent.title,
        description: apiEvent.description,
        category: apiEvent.category,
        closesAt: apiEvent.closesAt,
        startsAt: apiEvent.startsAt,
        status: apiEvent.status,
        oddsMode: apiEvent.oddsMode,
        minBet: apiEvent.minBet,
        maxBet: apiEvent.maxBet,
        createdBy: apiEvent.createdBy,
        resolvedBy: apiEvent.resolvedBy,
        resolvedAt: apiEvent.resolvedAt,
        createdAt: apiEvent.createdAt,
        updatedAt: apiEvent.updatedAt,
      },
      board: apiEvent.board
        ? {
            id: apiEvent.board.id,
            slug: apiEvent.board.slug,
            name: apiEvent.board.name,
            currencyName: apiEvent.board.currencyName,
          }
        : { id: "", slug: "", name: "", currencyName: "очки" },
      outcomes,
      totalPool,
      totalBets,
      totalBackers,
      myBet: myBetOnEvent ?? null,
      createdBy: apiEvent.creator
        ? {
            id: apiEvent.creator.id,
            name: apiEvent.creator.name,
            avatar: apiEvent.creator.avatar,
          }
        : { id: "", name: "Unknown", avatar: "slate" },
      effectiveStatus,
      winningOutcome,
      backerCount: totalBackers,
    };
  });
}

/** Build EventView objects for "my bets" section — events where current user has active bets. */
function buildMyBetViews(
  events: EventView[],
  myBets: Bet[],
): EventView[] {
  // Group bets by event
  const betByEvent = new Map<string, Bet[]>();
  for (const bet of myBets) {
    const arr = betByEvent.get(bet.eventId) || [];
    arr.push(bet);
    betByEvent.set(bet.eventId, arr);
  }

  const result: EventView[] = [];
  for (const eventView of events) {
    const bets = betByEvent.get(eventView.event.id);
    if (!bets || bets.length === 0) continue;

    // Clone the event view and attach myBet on the matching outcome
    const cloned: EventView = {
      ...eventView,
      outcomes: eventView.outcomes.map((o) => ({ ...o, myBet: null })),
    };
    for (const bet of bets) {
      const ov = cloned.outcomes.find((o) => o.outcome.id === bet.outcomeId);
      if (ov) {
        ov.myBet = bet;
      }
    }
    // Attach the most recent active bet
    const activeBet = bets.find((b) => b.status === "active");
    cloned.myBet = activeBet ?? bets[0] ?? null;
    result.push(cloned);
  }
  return result;
}

export function useDashboardData(slug: string = "board"): {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get board (public)
        const board = await api.boards.getBySlug(slug);
        if (!board) {
          if (mounted) setError("Доска не найдена");
          return;
        }

        // 2. Get current user (always works with valid token)
        const user = await api.auth.me();
        if (!user || !user.id) {
          if (mounted) setError("Ошибка авторизации: не удалось получить данные пользователя");
          return;
        }

        // 3. Fetch other data in parallel, gracefully handling 401/403
        const [seasonRes, eventsRes, betsRes, leaderboardRes] = await Promise.all([
          safeFetch(api.seasons.getActive(board.id)),
          safeFetch(api.events.list(board.id)),
          safeFetch(api.bets.getMyBets()),
          safeFetch(api.leaderboard.getBoard(board.id)),
        ]);

        if (!mounted) return;

        const season = seasonRes;
        const rawEvents = eventsRes || [];
        const myBets: Bet[] = betsRes || [];

        // 4. Fetch pool summaries for each event in parallel
        const poolByEvent = new Map<string, any>();
        await Promise.all(
          rawEvents.map(async (ev: any) => {
            try {
              const pool = await api.events.getPool(ev.id);
              poolByEvent.set(ev.id, pool);
            } catch {
              // If pool fetch fails, event will just show zeroed market data
            }
          }),
        );

        // Build enriched EventView objects with market data and myBets attached
        const events = buildEventViews(rawEvents, poolByEvent, myBets, user.id);

        // Build myBets views (events where user has bets)
        const myBetViews = buildMyBetViews(events, myBets);

        // Results = resolved/canceled events where user has bets with outcomes
        const results = events.filter(
          (e) =>
            e.effectiveStatus === "resolved" || e.effectiveStatus === "canceled",
        );

        // Build leaderboard
        const rawLeaderboard = leaderboardRes?.leaderboard || [];
        const leaderboard = rawLeaderboard.map((row: any, index: number) => ({
          rank: row.rank || index + 1,
          user: {
            id: row.userId || row.user?.id || '',
            name: row.userName || row.user?.name || 'Unknown',
            avatar: (row.userAvatar || row.user?.avatar || 'slate') as any,
          },
          balance: row.total || row.balance || 0,
          profit: row.profit || 0,
          accuracy: row.accuracy || 0,
          totalBets: row.totalBets || 0,
          title: row.title || null,
          isCurrentUser: row.userId === user.id || row.user?.id === user.id,
        }));
        const myRow = leaderboard.find((r: any) => r.user.id === user.id);

        const openEvents = events.filter((e) => e.effectiveStatus === "open");
        const closedForResult = events.filter((e) => e.effectiveStatus === "closed");

        const profit = myRow?.profit ?? 0;
        const accuracy = Math.round((myRow?.accuracy ?? 0) * 100);
        const isProfitPositive = profit >= 0;

        // Wallet - try to fetch if season exists
        let wallet = null;
        if (season) {
          try {
            const walletRes = await api.wallet.getSummary(season.id, user.id);
            wallet = {
              seasonId: season.id,
              userId: user.id,
              available: walletRes.available ?? walletRes.balance ?? 1000,
              locked: walletRes.locked ?? 0,
              total: walletRes.total ?? walletRes.balance ?? 1000,
            };
          } catch {
            // User not a member - use placeholder
            wallet = {
              seasonId: season.id,
              userId: user.id,
              available: 1000,
              locked: 0,
              total: 1000,
            };
          }
        }

        setData({
          slug,
          board,
          user,
          season,
          wallet,
          events,
          myBets: myBetViews,
          results,
          leaderboard,
          myRow,
          ballot: {
            board: openEvents,
            toResolve: closedForResult,
          },
          stats: {
            openCount: openEvents.length,
            toResolveCount: closedForResult.length,
            myBetsCount: myBetViews.length,
            profit,
            accuracy,
            isProfitPositive,
            myRank: myRow?.rank ?? null,
            totalPlayers: leaderboard.length,
          },
        });
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Ошибка загрузки данных");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  return { data, loading, error };
}