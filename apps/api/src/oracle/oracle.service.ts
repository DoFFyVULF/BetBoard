import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

@Injectable()
export class OracleService {
  constructor(
    private prisma: PrismaService,
    private leaderboardService: LeaderboardService,
  ) {}

  /**
   * Публичный «профиль оракула» участника в рамках сезона:
   * кошелёк, точность, прибыль, композитный скор, позиция в лидерборде,
   * статистика по категориям и достижения.
   */
  async getOracleProfile(seasonId: string, userId: string) {
    const season = await this.prisma.client.season.findUnique({
      where: { id: seasonId },
      include: { board: { select: { id: true, name: true } } },
    });

    if (!season) throw new NotFoundException('Season not found');

    const wallet = await this.prisma.client.wallet.findUnique({
      where: { seasonId_userId: { seasonId, userId } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!wallet) throw new NotFoundException('Profile not found');

    // Все resolved-ставки участника за сезон (выигранные/проигранные)
    const bets = await this.prisma.client.bet.findMany({
      where: {
        userId,
        event: { seasonId },
        status: { in: ['won', 'lost'] },
      },
      include: {
        outcome: { select: { label: true } },
        event: { select: { category: true } },
      },
    });

    const wonBets = bets.filter((b) => b.status === 'won');
    const lostBets = bets.filter((b) => b.status === 'lost');
    const totalBets = bets.length;

    const accuracy = totalBets > 0 ? wonBets.length / totalBets : 0;

    // Чистая прибыль: выигрыш (payout - amount) минус проигрыши (amount).
    // У проигранной ставки payout = 0 → вклад = -amount.
    const profit = bets.reduce((sum, b) => {
      const stake = b.amount;
      if (b.status === 'won') {
        const payout = b.payout ?? 0;
        return sum + (payout - stake);
      }
      return sum - stake;
    }, 0);

    // Oracle Score: 50% точность + 30% нормализованная прибыль + 20% стабильность.
    // Прибыль нормализуем к 0..1 относительно стартового баланса сезона:
    // 0% = нулевая прибыль, 100% = удвоили стартовый баланс.
    const startingBalance = season.startingBalance || 1000;
    const normalizedProfit = Math.max(
      0,
      Math.min(1, profit / startingBalance),
    );
    const stability = totalBets > 0 ? wonBets.length / totalBets : 0;

    const oracleScore = Math.round(
      accuracy * 50 + normalizedProfit * 30 + stability * 20,
    );

    // Позиция в лидерборде сезона
    const leaderboard = await this.leaderboardService.getSeasonLeaderboard(seasonId);
    const rankIndex = (leaderboard.leaderboard || []).findIndex(
      (row: any) => row.userId === userId,
    );
    const rank = rankIndex === -1 ? 0 : rankIndex + 1;

    // Разбивка по категориям
    const byCategoryMap = new Map<
      string,
      { category: string; count: number; won: number }
    >();
    for (const b of bets) {
      const key = b.event.category;
      const entry = byCategoryMap.get(key) || { category: key, count: 0, won: 0 };
      entry.count += 1;
      if (b.status === 'won') entry.won += 1;
      byCategoryMap.set(key, entry);
    }

    // Достижения участника за сезон
    const userAchievements = await this.prisma.client.userAchievement.findMany({
      where: { userId, seasonId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });

    return {
      user: wallet.user,
      balance: wallet.balance,
      locked: wallet.lockedBalance,
      accuracy,
      profit,
      totalBets,
      wonBets: wonBets.length,
      lostBets: lostBets.length,
      oracleScore,
      rank,
      byCategory: Array.from(byCategoryMap.values()),
      titles: [],
      achievements: userAchievements.map((ua) => ({
        achievement: {
          code: ua.achievement.code,
          title: ua.achievement.title,
          description: ua.achievement.description,
        },
        earnedAt: ua.earnedAt,
      })),
    };
  }
}