import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getSeasonLeaderboard(seasonId: string) {
    const season = await this.prisma.client.season.findUnique({
      where: { id: seasonId },
      include: { board: { select: { currencyName: true } } },
    });

    if (!season) throw new Error('Season not found');

    const wallets = await this.prisma.client.wallet.findMany({
      where: { seasonId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { balance: 'desc' },
    });

    return {
      seasonId,
      seasonName: season.name,
      currencyName: season.board.currencyName,
      leaderboard: wallets.map((w, index) => ({
        rank: index + 1,
        userId: w.userId,
        userName: w.user.name,
        userAvatar: w.user.avatar,
        balance: w.balance,
        lockedBalance: w.lockedBalance,
        total: w.balance + w.lockedBalance,
      })),
    };
  }

  async getBoardLeaderboard(boardId: string) {
    const board = await this.prisma.client.board.findUnique({
      where: { id: boardId },
      select: { id: true, name: true, currencyName: true },
    });

    if (!board) throw new Error('Board not found');

    // Get all finished and active seasons for this board
    const seasons = await this.prisma.client.season.findMany({
      where: { boardId, status: { in: ['active', 'finished'] } },
      select: { id: true, name: true },
    });

    if (seasons.length === 0) {
      return {
        boardId,
        boardName: board.name,
        currencyName: board.currencyName,
        leaderboard: [],
      };
    }

    // Get all wallets across all seasons for members of this board
    const memberWallets = await this.prisma.client.wallet.findMany({
      where: { seasonId: { in: seasons.map((s) => s.id) } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        season: { select: { id: true, name: true } },
      },
    });

    // Aggregate by user
    const userStats = new Map<
      string,
      {
        userId: string;
        userName: string;
        userAvatar: string;
        totalBalance: number;
        totalLocked: number;
        seasons: Map<string, { balance: number; locked: number }>;
      }
    >();

    for (const wallet of memberWallets) {
      const existing = userStats.get(wallet.userId);
      if (existing) {
        existing.totalBalance += wallet.balance;
        existing.totalLocked += wallet.lockedBalance;
        existing.seasons.set(wallet.seasonId, {
          balance: wallet.balance,
          locked: wallet.lockedBalance,
        });
      } else {
        userStats.set(wallet.userId, {
          userId: wallet.userId,
          userName: wallet.user.name,
          userAvatar: wallet.user.avatar,
          totalBalance: wallet.balance,
          totalLocked: wallet.lockedBalance,
          seasons: new Map([
            [
              wallet.seasonId,
              { balance: wallet.balance, locked: wallet.lockedBalance },
            ],
          ]),
        });
      }
    }

    const leaderboard = Array.from(userStats.values())
      .map((u) => ({
        userId: u.userId,
        userName: u.userName,
        userAvatar: u.userAvatar,
        totalBalance: u.totalBalance,
        totalLocked: u.totalLocked,
        total: u.totalBalance + u.totalLocked,
        seasons: Array.from(u.seasons.entries()).map(([seasonId, stats]) => ({
          seasonId,
          balance: stats.balance,
          locked: stats.locked,
        })),
      }))
      .sort((a, b) => b.total - a.total)
      .map((u, index) => ({ ...u, rank: index + 1 }));

    return {
      boardId,
      boardName: board.name,
      currencyName: board.currencyName,
      leaderboard,
    };
  }

  async getUserRank(userId: string, seasonId?: string) {
    if (seasonId) {
      const wallets = await this.prisma.client.wallet.findMany({
        where: { seasonId },
        orderBy: { balance: 'desc' },
      });

      const index = wallets.findIndex((w) => w.userId === userId);
      if (index === -1) return { rank: null };

      return { rank: index + 1, total: wallets[index].balance };
    }

    // Overall rank across all seasons
    throw new Error('Overall rank not implemented yet');
  }
}
