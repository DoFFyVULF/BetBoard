import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ResolveEventDto, AdjustBalanceDto } from './dto/resolve.dto';
import {
  BetStatus,
  EventStatus,
  LedgerType,
  OddsMode,
} from '@generated/prisma/enums';

@Injectable()
export class ResolveService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async resolveEvent(eventId: string, userId: string, dto: ResolveEventDto) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
      include: { outcomes: true, board: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    // Check permissions
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only admins can resolve events');
    }

    // Check event status
    if (event.status !== 'closed' && event.status !== 'open') {
      throw new BadRequestException('Event must be closed or open to resolve');
    }

    // Validate winning outcomes
    if (dto.winningOutcomeIds.length === 0) {
      throw new BadRequestException(
        'At least one winning outcome must be selected',
      );
    }

    for (const id of dto.winningOutcomeIds) {
      if (!event.outcomes.find((o) => o.id === id)) {
        throw new BadRequestException(`Invalid outcome ID: ${id}`);
      }
    }

    // Get all active bets for this event
    const bets = await this.prisma.client.bet.findMany({
      where: { eventId, status: 'active' },
      include: { outcome: true },
    });

    const winningOutcomeIdsSet = new Set(dto.winningOutcomeIds);

    const result = await this.prisma.client.$transaction(async (tx) => {
      // Mark winning outcomes
      await tx.eventOutcome.updateMany({
        where: { eventId, id: { in: dto.winningOutcomeIds } },
        data: { winning: true },
      });

      // Mark losing outcomes
      const losingOutcomeIds = event.outcomes
        .filter((o) => !winningOutcomeIdsSet.has(o.id))
        .map((o) => o.id);
      await tx.eventOutcome.updateMany({
        where: { eventId, id: { in: losingOutcomeIds } },
        data: { winning: false },
      });

      let totalPayout = 0;
      let winnersCount = 0;
      let losersCount = 0;
      let refundedCount = 0;

      if (event.oddsMode === 'fixed') {
        // Fixed odds: payout = amount * fixedOdds
        for (const bet of bets) {
          const isWinner = winningOutcomeIdsSet.has(bet.outcomeId);
          const wallet = await tx.wallet.findUnique({
            where: {
              seasonId_userId: {
                seasonId: event.seasonId,
                userId: bet.userId,
              },
            },
          });

          if (!wallet) continue;

          if (isWinner) {
            const fixedOdds = bet.outcome.fixedOdds || 1;
            const payout = bet.amount * fixedOdds;

            const newBalance = wallet.balance + payout;
            const newLocked = wallet.lockedBalance - bet.amount;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance, lockedBalance: newLocked },
            });

            await tx.ledgerEntry.create({
              data: {
                walletId: wallet.id,
                eventId: event.id,
                betId: bet.id,
                type: 'payout',
                amount: payout,
                balanceAfter: newBalance,
              },
            });

            await tx.bet.update({
              where: { id: bet.id },
              data: { status: 'won', payout },
            });

            totalPayout += payout;
            winnersCount++;
          } else {
            // Loser - just unlock the funds
            const newBalance = wallet.balance;
            const newLocked = wallet.lockedBalance - bet.amount;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance, lockedBalance: newLocked },
            });

            await tx.ledgerEntry.create({
              data: {
                walletId: wallet.id,
                eventId: event.id,
                betId: bet.id,
                type: 'bet_unlock',
                amount: bet.amount,
                balanceAfter: newBalance,
              },
            });

            await tx.bet.update({
              where: { id: bet.id },
              data: { status: 'lost', payout: 0 },
            });

            losersCount++;
          }
        }
      } else {
        // Parimutuel: distribute pool among winners proportionally
        const winnerBets = bets.filter((b) =>
          winningOutcomeIdsSet.has(b.outcomeId),
        );
        const loserBets = bets.filter(
          (b) => !winningOutcomeIdsSet.has(b.outcomeId),
        );

        const totalWinningPool = winnerBets.reduce(
          (sum, b) => sum + b.amount,
          0,
        );
        const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);

        // Process losers first (just unlock)
        for (const bet of loserBets) {
          const wallet = await tx.wallet.findUnique({
            where: {
              seasonId_userId: {
                seasonId: event.seasonId,
                userId: bet.userId,
              },
            },
          });

          if (!wallet) continue;

          const newBalance = wallet.balance;
          const newLocked = wallet.lockedBalance - bet.amount;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: newBalance, lockedBalance: newLocked },
          });

          await tx.ledgerEntry.create({
            data: {
              walletId: wallet.id,
              eventId: event.id,
              betId: bet.id,
              type: 'bet_unlock',
              amount: bet.amount,
              balanceAfter: newBalance,
            },
          });

          await tx.bet.update({
            where: { id: bet.id },
            data: { status: 'lost', payout: 0 },
          });

          losersCount++;
        }

        // Process winners (proportional payout)
        if (totalWinningPool > 0) {
          for (const bet of winnerBets) {
            const wallet = await tx.wallet.findUnique({
              where: {
                seasonId_userId: {
                  seasonId: event.seasonId,
                  userId: bet.userId,
                },
              },
            });

            if (!wallet) continue;

            const share = bet.amount / totalWinningPool;
            const payout = Math.floor(totalPool * share);

            const newBalance = wallet.balance + payout;
            const newLocked = wallet.lockedBalance - bet.amount;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance, lockedBalance: newLocked },
            });

            await tx.ledgerEntry.create({
              data: {
                walletId: wallet.id,
                eventId: event.id,
                betId: bet.id,
                type: 'payout',
                amount: payout,
                balanceAfter: newBalance,
              },
            });

            await tx.bet.update({
              where: { id: bet.id },
              data: { status: 'won', payout },
            });

            totalPayout += payout;
            winnersCount++;
          }
        } else {
          // No winners? Refund all
          for (const bet of bets) {
            const wallet = await tx.wallet.findUnique({
              where: {
                seasonId_userId: {
                  seasonId: event.seasonId,
                  userId: bet.userId,
                },
              },
            });

            if (!wallet) continue;

            const newBalance = wallet.balance + bet.amount;
            const newLocked = wallet.lockedBalance - bet.amount;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance, lockedBalance: newLocked },
            });

            await tx.ledgerEntry.create({
              data: {
                walletId: wallet.id,
                eventId: event.id,
                betId: bet.id,
                type: 'refund',
                amount: bet.amount,
                balanceAfter: newBalance,
              },
            });

            await tx.bet.update({
              where: { id: bet.id },
              data: { status: 'refunded', payout: null },
            });

            refundedCount++;
          }
        }
      }

      // Update event status
      await tx.betEvent.update({
        where: { id: eventId },
        data: {
          status: 'resolved',
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
      });

      return {
        eventId,
        winningOutcomeIds: dto.winningOutcomeIds,
        totalPayout,
        winnersCount,
        losersCount,
        refundedCount,
      };
    });

    return result;
  }

  async adjustBalance(userId: string, adminId: string, dto: AdjustBalanceDto) {
    // Check admin permissions - need to find a board where both are members
    const userWalls = await this.prisma.client.wallet.findMany({
      where: { userId: dto.userId },
      include: { season: { include: { board: true } } },
    });

    let foundBoard = false;
    for (const wallet of userWalls) {
      const adminMember = await this.prisma.client.groupMember.findUnique({
        where: {
          boardId_userId: { boardId: wallet.season.boardId, userId: adminId },
        },
      });
      if (adminMember && ['owner', 'admin'].includes(adminMember.role)) {
        foundBoard = true;
        break;
      }
    }

    if (!foundBoard) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // For simplicity, adjust the first wallet found
    const wallet = userWalls[0];
    if (!wallet) throw new NotFoundException('Wallet not found');

    const newBalance = wallet.balance + dto.amount;
    if (newBalance < 0)
      throw new BadRequestException('Insufficient balance for adjustment');

    await this.prisma.client.$transaction([
      this.prisma.client.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      }),
      this.prisma.client.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'adjustment',
          amount: dto.amount,
          balanceAfter: newBalance,
        },
      }),
    ]);

    return { newBalance };
  }

  async getEventResolution(eventId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        bets: {
          include: {
            outcome: true,
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    return {
      eventId: event.id,
      status: event.status,
      oddsMode: event.oddsMode,
      winningOutcomes: event.outcomes.filter((o) => o.winning),
      totalBets: event.bets.length,
      bets: event.bets.map((b) => ({
        betId: b.id,
        userId: b.userId,
        userName: b.user.name,
        userAvatar: b.user.avatar,
        outcomeId: b.outcomeId,
        outcomeLabel: b.outcome.label,
        amount: b.amount,
        status: b.status,
        payout: b.payout,
      })),
    };
  }
}
