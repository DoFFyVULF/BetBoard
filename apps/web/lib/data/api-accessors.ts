/**
 * BetBoard API Accessors
 * Replaces mock data accessors with real API calls for server components
 */

import { serverApi } from "@/lib/api/server";
import type {
  Board,
  Season,
  EventView,
  WalletState,
  LeaderboardRow,
  Bet,
  CommentView,
  EventReaction,
  OracleProfile,
  User,
  EventStatus,
  BetEvent,
  MemberView,
  LedgerEntryView,
  EventOutcomeView,
} from "@/lib/types";


const CATEGORY_LABELS: Record<string, string> = {
  board: "Настолки",
  sport: "Спорт",
  movie: "Кино",
  food: "Еда",
  travel: "Поездки",
  chaos: "Хаос",
  meta: "Мета",
  games: "Видеоигры",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export { categoryLabel };

function effectiveStatus(event: { status: string; closesAt: string }): EventStatus {
  if (event.status === "open" && Date.now() >= new Date(event.closesAt).getTime()) {
    return "closed" as EventStatus;
  }
  return event.status as EventStatus;
}

// ============================================
// Helpers to transform API response to view models
// ============================================

/**
 * Enrich a single event view with pool/market data and myBet.
 * Fetches pool summary from the backend and attaches myBet if the current user has one.
 */
async function transformEventView(
  apiEvent: any,
  options?: {
    pool?: any;
    myBets?: Bet[];
  },
): Promise<EventView> {
  const pool = options?.pool;
  const myBets = options?.myBets || [];

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
      share: pool && pool.totalPool > 0 ? (outcomePool.pool ?? 0) / pool.totalPool : 0,
      myBet: null,
      isWinner: o.winning === true,
    };
  });

  const winningOutcome = outcomes.find((o) => o.isWinner) || null;

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

  const totalPool = pool?.totalPool ?? 0;
  const totalBackers = pool?.outcomes?.reduce(
    (sum: number, po: any) => sum + (po.backers ?? 0),
    0,
  ) ?? 0;

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
    totalBets: totalBackers,
    totalBackers,
    myBet: myBetOnEvent ?? null,
    createdBy: apiEvent.creator
      ? {
          id: apiEvent.creator.id,
          name: apiEvent.creator.name,
          avatar: apiEvent.creator.avatar,
        }
      : { id: "", name: "Unknown", avatar: "slate" },
    effectiveStatus: effectiveStatus(apiEvent),
    winningOutcome,
    backerCount: totalBackers,
  };
}

function transformLeaderboard(apiData: any, currentUserId = ""): LeaderboardRow[] {
  const leaderboard = apiData.leaderboard || [];
  return leaderboard.map((row: any, index: number) => ({
    rank: row.rank || index + 1,
    user: {
      id: row.userId,
      name: row.userName,
      avatar: row.userAvatar || 'slate',
    },
    balance: row.total || row.balance || 0,
    profit: row.profit || 0,
    accuracy: row.accuracy || 0,
    totalBets: row.totalBets || 0,
    title: row.title || null,
    isCurrentUser: row.userId === currentUserId,
  }));
}

function transformWallet(apiData: any, userId: string, seasonId: string): WalletState {
  // /wallet/:id/summary приходит в виде { available, locked, total },
  // но для совместимости поддерживаем и { balance, lockedBalance }.
  const available = apiData.available ?? apiData.balance ?? 0;
  const locked = apiData.locked ?? apiData.lockedBalance ?? 0;
  return {
    seasonId,
    userId,
    available,
    locked,
    total: available + locked,
  };
}

function transformComment(apiComment: any): CommentView {
  return {
    ...apiComment,
    user: apiComment.user || { id: '', name: 'Unknown', avatar: 'slate' },
    reactions: [],
  };
}

function transformReaction(apiReaction: any): EventReaction {
  return apiReaction;
}

function transformMember(apiMember: any): MemberView {
  return {
    user: apiMember.user || { id: '', name: 'Unknown', avatar: 'slate' },
    role: apiMember.role,
    joinedAt: apiMember.joinedAt,
    title: apiMember.title,
    balance: apiMember.balance || 0,
    // Явное поле передаётся из getMembers (вычисляется по реальному
    // текущему пользователю из токена), а не из хардкод-id.
    isCurrentUser: !!apiMember.isCurrentUser,
  };
}

function transformSeason(apiSeason: any): Season {
  return apiSeason;
}

function transformBoard(apiBoard: any): Board {
  return apiBoard;
}

// ============================================
// API Accessors
// ============================================

export async function getCurrentUser(): Promise<User> {
  try {
    const me = await serverApi.auth.me();
    if (me && me.id) {
      return { id: me.id, name: me.name || "Пользователь", avatar: me.avatar || "slate" };
    }
  } catch {
    // Нет токена / не авторизован — аноним.
  }
  return { id: "", name: "Гость", avatar: "slate" };
}

export async function getCurrentUserId(): Promise<string> {
  try {
    const me = await serverApi.auth.me();
    return me?.id || "";
  } catch {
    return "";
  }
}

export async function getUser(id: string): Promise<User | undefined> {
  // Would need a dedicated API endpoint
  return undefined;
}

export async function getBoardBySlug(slug: string): Promise<Board | undefined> {
  try {
    return await serverApi.boards.getBySlug(slug);
  } catch {
    return undefined;
  }
}

export async function getBoard(id: string): Promise<Board | undefined> {
  try {
    return await serverApi.boards.get(id);
  } catch {
    return undefined;
  }
}

export async function getBoards(): Promise<Board[]> {
  // Only one board in current implementation
  return [];
}

export async function getSeasons(boardId: string): Promise<Season[]> {
  try {
    const res = await serverApi.seasons.list(boardId);
    return res || [];
  } catch {
    // Анонимный посетитель не имеет токена → 401. Для него список сезонов
    // закрыт, возвращаем пустой массив (страница доски публичная).
    return [];
  }
}

export async function getActiveSeason(boardId: string): Promise<Season | undefined> {
  try {
    return await serverApi.seasons.getActive(boardId);
  } catch {
    return undefined;
  }
}

export async function getSeason(id: string): Promise<Season | undefined> {
  // Would need a dedicated API endpoint
  try {
    const seasons = await serverApi.seasons.list('');
    return seasons.find(s => s.id === id);
  } catch {
    return undefined;
  }
}

export async function getMembers(boardId: string): Promise<MemberView[]> {
  try {
    const apiMembers = await serverApi.boards.getMembers(boardId);
    const currentUserId = await getCurrentUserId();
    return (apiMembers || []).map((m: any) =>
      transformMember({ ...m, isCurrentUser: m.userId === currentUserId }),
    );
  } catch {
    // Публичный эндпоинт, но на случай сбоя возвращаем пустой список.
    return [];
  }
}

export type BoardRole = "owner" | "admin" | "member";

/** Роль текущего пользователя на доске (или null, если он не участник). */
export async function getMyRole(boardId: string): Promise<BoardRole | null> {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return null;
    const members = await serverApi.boards.getMembers(boardId);
    const me = (members || []).find((m: any) => m.user?.id === currentUserId);
    return me?.role ?? null;
  } catch {
    return null;
  }
}

export async function getEvents(
  boardId: string,
  seasonId?: string,
  currentUserId?: string,
): Promise<EventView[]> {
  try {
    const apiEvents = await serverApi.events.list(boardId, seasonId);

    // Fetch pool summaries and my bets in parallel
    const poolPromises = apiEvents.map((ev) =>
      serverApi.events.getPool(ev.id).catch(() => null),
    );
    const pools = await Promise.all(poolPromises);

    // Fetch my bets if userId provided
    let myBets: Bet[] = [];
    if (currentUserId) {
      const betsRes = await serverApi.bets.getMyBets().catch(() => []);
      myBets = betsRes ?? [];
    }

    const views = await Promise.all(
      apiEvents.map((ev, idx) =>
        transformEventView(ev, { pool: pools[idx] ?? undefined, myBets }),
      ),
    );

    return views.sort((a, b) => {
      const statusRank = (x: EventView) =>
        x.effectiveStatus === "open" ? 0 : x.effectiveStatus === "closed" ? 1 : 2;
      if (statusRank(a) !== statusRank(b)) return statusRank(a) - statusRank(b);
      if (a.effectiveStatus === "open") {
        return new Date(a.event.closesAt).getTime() - new Date(b.event.closesAt).getTime();
      }
      return new Date(b.event.resolvedAt || b.event.closesAt).getTime() -
        new Date(a.event.resolvedAt || a.event.closesAt).getTime();
    });
  } catch {
    return [];
  }
}

export async function getEventById(
  eventId: string,
  currentUserId?: string,
): Promise<EventView | undefined> {
  try {
    const apiEvent = await serverApi.events.get(eventId);

    // Fetch pool summary
    const pool = await serverApi.events.getPool(eventId).catch(() => null);

    // Fetch my bets if userId provided
    let myBets: Bet[] = [];
    if (currentUserId) {
      const betsRes = await serverApi.bets.getMyBets().catch(() => []);
      myBets = betsRes ?? [];
    }

    return transformEventView(apiEvent, { pool: pool ?? undefined, myBets });
  } catch {
    return undefined;
  }
}

export async function getWalletFor(seasonId: string, userId: string): Promise<WalletState> {
  try {
    const apiData = await serverApi.wallet.getSummary(seasonId, userId);
    return transformWallet(apiData, userId, seasonId);
  } catch {
    return { seasonId, userId, available: 0, locked: 0, total: 0 };
  }
}

export async function getWalletLedger(seasonId: string, userId: string): Promise<LedgerEntryView[]> {
  try {
    return await serverApi.wallet.getLedger(seasonId, userId);
  } catch {
    return [];
  }
}

export async function getLeaderboard(boardId: string, seasonId: string): Promise<LeaderboardRow[]> {
  try {
    const apiData = await serverApi.leaderboard.getSeason(seasonId);
    const currentUserId = await getCurrentUserId();
    return transformLeaderboard(apiData, currentUserId);
  } catch {
    return [];
  }
}

export async function getMyActiveBets(boardId: string): Promise<EventView[]> {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) return [];

    // /me/bets уже отдаёт ставки текущего пользователя по токену.
    const myBets = await serverApi.bets.getMyBets();
    const activeBets = myBets.filter((b: any) => b.status === 'active');

    // Get event views for each active bet
    const events: EventView[] = [];
    for (const bet of activeBets) {
      const eventView = await getEventById(bet.eventId, currentUserId);
      if (eventView) {
        events.push(eventView);
      }
    }
    return events;
  } catch {
    return [];
  }
}

export async function getMyBet(eventId: string): Promise<Bet | undefined> {
  try {
    const myBets = await serverApi.bets.getMyBets();
    return myBets.find((b: any) => b.eventId === eventId && b.status === 'active');
  } catch {
    return undefined;
  }
}

export async function getEventComments(eventId: string): Promise<CommentView[]> {
  try {
    const data = await serverApi.comments.list(eventId);
    return (data.comments || []).map(transformComment);
  } catch {
    return [];
  }
}

export async function getEventReactions(eventId: string): Promise<EventReaction[]> {
  try {
    return await serverApi.reactions.list(eventId);
  } catch {
    return [];
  }
}

export async function getOracleProfile(
  boardId: string,
  seasonId: string,
  userId: string,
): Promise<OracleProfile | undefined> {
  try {
    const apiProfile = await serverApi.oracle.get(seasonId, userId);
    return {
      user: {
        id: apiProfile.user?.id,
        name: apiProfile.user?.name || "Пользователь",
        avatar: apiProfile.user?.avatar || "slate",
      },
      balance: apiProfile.balance ?? 0,
      locked: apiProfile.locked ?? 0,
      accuracy: apiProfile.accuracy ?? 0,
      profit: apiProfile.profit ?? 0,
      totalBets: apiProfile.totalBets ?? 0,
      wonBets: apiProfile.wonBets ?? 0,
      lostBets: apiProfile.lostBets ?? 0,
      oracleScore: apiProfile.oracleScore ?? 0,
      rank: apiProfile.rank ?? 0,
      byCategory: (apiProfile.byCategory || []).map((c: any) => ({
        category: c.category,
        count: c.count ?? 0,
        won: c.won ?? 0,
      })),
      titles: apiProfile.titles || [],
      achievements: (apiProfile.achievements || []).map((a: any) => ({
        achievement: {
          code: a.achievement?.code ?? "",
          title: a.achievement?.title ?? "",
          description: a.achievement?.description ?? "",
        },
        earnedAt: a.earnedAt,
      })),
    };
  } catch {
    return undefined;
  }
}

export async function getResolvedEvents(boardId: string): Promise<EventView[]> {
  const events = await getEvents(boardId);
  return events.filter(
    (v) => v.effectiveStatus === "resolved" || v.effectiveStatus === "canceled",
  );
}

export async function getRecentResults(boardId: string, limit = 4): Promise<EventView[]> {
  try {
    const events = await getEvents(boardId);
    return events
      .filter((v) => v.effectiveStatus === "resolved" || v.effectiveStatus === "canceled")
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function payoutForBet(bet: Bet, totalPool: number): number {
  // This would need to be computed server-side
  return 0;
}
