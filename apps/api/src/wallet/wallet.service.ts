import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(seasonId: string, userId: string) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { seasonId_userId: { seasonId, userId } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    return {
      seasonId: wallet.seasonId,
      userId: wallet.userId,
      available: wallet.balance,
      locked: wallet.lockedBalance,
      total: wallet.balance + wallet.lockedBalance,
    };
  }

  async getLedger(seasonId: string, userId: string) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { seasonId_userId: { seasonId, userId } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const ledger = await this.prisma.client.ledgerEntry.findMany({
      where: { walletId: wallet.id },
      include: { event: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return ledger.map((entry) => ({
      ...entry,
      eventTitle: entry.event?.title ?? null,
    }));
  }

  async getSummary(seasonId: string, userId: string) {
    const wallet = await this.getWallet(seasonId, userId);
    const ledger = await this.getLedger(seasonId, userId);
    return { ...wallet, ledger };
  }

  // Internal methods for bets/resolve
  async lockFunds(walletId: string, amount: number) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.balance < amount) throw new Error('Insufficient funds');

    const newBalance = wallet.balance - amount;
    const newLocked = wallet.lockedBalance + amount;

    await this.prisma.client.$transaction([
      this.prisma.client.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance, lockedBalance: newLocked },
      }),
      this.prisma.client.ledgerEntry.create({
        data: {
          walletId,
          type: 'bet_lock',
          amount: amount,
          balanceAfter: newBalance,
        },
      }),
    ]);

    return { balance: newBalance, lockedBalance: newLocked };
  }

  async unlockFunds(walletId: string, amount: number) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.lockedBalance < amount) throw new Error('Invalid unlock amount');

    const newBalance = wallet.balance + amount;
    const newLocked = wallet.lockedBalance - amount;

    await this.prisma.client.$transaction([
      this.prisma.client.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance, lockedBalance: newLocked },
      }),
      this.prisma.client.ledgerEntry.create({
        data: {
          walletId,
          type: 'bet_unlock',
          amount: amount,
          balanceAfter: newBalance,
        },
      }),
    ]);

    return { balance: newBalance, lockedBalance: newLocked };
  }

  async payout(
    walletId: string,
    amount: number,
    eventId: string,
    betId: string,
  ) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const newBalance = wallet.balance + amount;

    await this.prisma.client.$transaction([
      this.prisma.client.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      }),
      this.prisma.client.ledgerEntry.create({
        data: {
          walletId,
          eventId,
          betId,
          type: 'payout',
          amount: amount,
          balanceAfter: newBalance,
        },
      }),
      this.prisma.client.bet.update({
        where: { id: betId },
        data: { status: 'won', payout: amount },
      }),
    ]);

    return { balance: newBalance };
  }

  async refund(
    walletId: string,
    amount: number,
    eventId: string,
    betId: string,
  ) {
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { id: walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const newBalance = wallet.balance + amount;
    const newLocked = wallet.lockedBalance - amount;

    await this.prisma.client.$transaction([
      this.prisma.client.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance, lockedBalance: newLocked },
      }),
      this.prisma.client.ledgerEntry.create({
        data: {
          walletId,
          eventId,
          betId,
          type: 'refund',
          amount: amount,
          balanceAfter: newBalance,
        },
      }),
      this.prisma.client.bet.update({
        where: { id: betId },
        data: { status: 'refunded', payout: null },
      }),
    ]);

    return { balance: newBalance };
  }
}
