import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PlaceBetDto } from './dto/bet.dto';
import { BetStatus, EventStatus, OddsMode } from '@generated/prisma/enums';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async placeBet(eventId: string, userId: string, dto: PlaceBetDto) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
      include: { outcomes: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    // Check event status
    if (event.status !== 'open') {
      throw new BadRequestException('Event is not open for betting');
    }

    // Check if event is closed (past closesAt)
    if (new Date() > event.closesAt) {
      throw new BadRequestException('Betting period has ended');
    }

    // Check if user is a member of the board
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this board');
    }

    // Check if season is active (if event has season)
    if (event.seasonId) {
      const season = await this.prisma.client.season.findUnique({
        where: { id: event.seasonId },
      });
      if (!season || season.status !== 'active') {
        throw new BadRequestException('Season is not active');
      }
    }

    // Validate outcome
    const outcome = event.outcomes.find((o) => o.id === dto.outcomeId);
    if (!outcome) {
      throw new BadRequestException('Invalid outcome');
    }

    // Check bet amount limits
    if (dto.amount < event.minBet || dto.amount > event.maxBet) {
      throw new BadRequestException(
        `Bet amount must be between ${event.minBet} and ${event.maxBet}`,
      );
    }

    // Check if user already bet on this event (unique constraint)
    const existingBet = await this.prisma.client.bet.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existingBet) {
      throw new BadRequestException(
        'You have already placed a bet on this event',
      );
    }

    // Get or create wallet
    let wallet;
    if (event.seasonId) {
      wallet = await this.prisma.client.wallet.findUnique({
        where: { seasonId_userId: { seasonId: event.seasonId, userId } },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found for this season');
      }
    } else {
      // For board-level events without season, we might need a different approach
      // For now, require a season
      throw new BadRequestException('Event must belong to an active season');
    }

    // Check wallet balance
    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient funds');
    }

    // Lock funds and create bet in transaction
    const bet = await this.prisma.client.$transaction(async (tx) => {
      // Lock funds
      const newBalance = wallet.balance - dto.amount;
      const newLocked = wallet.lockedBalance + dto.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance, lockedBalance: newLocked },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          eventId: event.id,
          type: 'bet_lock',
          amount: dto.amount,
          balanceAfter: newBalance,
        },
      });

      // Create bet
      const bet = await tx.bet.create({
        data: {
          eventId,
          outcomeId: dto.outcomeId,
          userId,
          amount: dto.amount,
          status: 'active',
        },
      });

      return bet;
    });

    return this.formatBetResponse(bet);
  }

  async getUserBets(userId: string, eventId?: string) {
    const where: any = { userId };
    if (eventId) where.eventId = eventId;

    const bets = await this.prisma.client.bet.findMany({
      where,
      include: {
        outcome: { select: { id: true, label: true } },
        event: {
          select: { id: true, title: true, status: true, closesAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bets.map(this.formatBetResponse);
  }

  async getEventBets(eventId: string) {
    const bets = await this.prisma.client.bet.findMany({
      where: { eventId },
      include: {
        outcome: { select: { id: true, label: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bets.map(this.formatBetResponse);
  }

  async getPoolSummary(eventId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
      include: { outcomes: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const bets = await this.prisma.client.bet.findMany({
      where: { eventId, status: 'active' },
      select: { outcomeId: true, userId: true, amount: true },
    });

    // Track pool amount and backer count per outcome
    const poolByOutcome = new Map<string, number>();
    const backersByOutcome = new Map<string, Set<string>>();
    for (const bet of bets) {
      const current = poolByOutcome.get(bet.outcomeId) || 0;
      poolByOutcome.set(bet.outcomeId, current + bet.amount);

      if (!backersByOutcome.has(bet.outcomeId)) {
        backersByOutcome.set(bet.outcomeId, new Set());
      }
      backersByOutcome.get(bet.outcomeId)!.add(bet.userId);
    }

    const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalBackers = new Set(bets.map((b) => b.userId)).size;

    // Calculate implied odds for parimutuel
    const outcomes = event.outcomes.map((o) => {
      const pool = poolByOutcome.get(o.id) || 0;
      const backers = backersByOutcome.get(o.id)?.size || 0;
      const percent = totalPool > 0 ? (pool / totalPool) * 100 : 0;
      // Для паримутуала без ставок на исход коэффициента ещё нет → null,
      // чтобы в UI показывалось «—», а не «×0,00».
      let odds: number | null = null;
      if (pool > 0) {
        odds = Number((totalPool / pool).toFixed(2)); // Parimutuel odds = total pool / winning pool
      }

      return {
        outcomeId: o.id,
        label: o.label,
        pool,
        backers,
        odds,
        percent: Number(percent.toFixed(1)),
      };
    });

    // For fixed odds mode, use fixed odds from outcomes
    if (event.oddsMode === 'fixed') {
      for (const o of outcomes) {
        const fixedOutcome = event.outcomes.find((fo) => fo.id === o.outcomeId);
        if (fixedOutcome?.fixedOdds) {
          o.odds = fixedOutcome.fixedOdds;
        }
      }
    }

    return {
      eventId,
      totalPool,
      totalBackers,
      outcomes,
    };
  }

  private formatBetResponse(bet: any) {
    return {
      id: bet.id,
      eventId: bet.eventId,
      outcomeId: bet.outcomeId,
      userId: bet.userId,
      amount: bet.amount,
      status: bet.status,
      payout: bet.payout,
      createdAt: bet.createdAt,
      updatedAt: bet.updatedAt,
      outcome: bet.outcome,
      event: bet.event,
    };
  }
}
