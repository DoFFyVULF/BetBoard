import type {
  Board,
  EventView,
  LeaderboardRow,
  Season,
  User,
} from "@/lib/types";

/**
 * Содержимое обёртки кошелька (getWalletFor).
 */
export interface WalletState {
  seasonId: string;
  userId: string;
  available: number;
  locked: number;
  total: number;
}

/**
 * Единый пакет данных, который панель доски отдаёт каждому варианту дашборда.
 * Варианты не ходят в accessors сами — получают готовые данные пропсами,
 * чтобы их можно было свободно подставлять и сравнивать.
 */
export interface DashboardData {
  slug: string;
  board: Board;
  user: User;
  season: Season | null;
  wallet: WalletState | null;
  events: EventView[];
  myBets: EventView[];
  results: EventView[];
  leaderboard: LeaderboardRow[];
  myRow: LeaderboardRow | undefined;
  ballot: {
    board: EventView[];
    /** ждут фиксации результата */
    toResolve: EventView[];
  };
  stats: {
    openCount: number;
    toResolveCount: number;
    myBetsCount: number;
    profit: number;
    accuracy: number;
    isProfitPositive: boolean;
    myRank: number | null;
    totalPlayers: number;
  };
}