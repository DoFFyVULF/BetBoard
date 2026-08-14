import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSeasonDto } from './dto/season.dto';

@Injectable()
export class SeasonsService {
  constructor(private prisma: PrismaService) {}

  async startSeason(boardId: string, userId: string, dto: StartSeasonDto) {
    await this.checkOwner(boardId, userId);

    const now = dto.startsAt ? new Date(dto.startsAt) : new Date();
    const startingBalance = dto.startingBalance ?? 1000;

    const season = await this.prisma.client.$transaction(async (tx) => {
      // Freeze the current active season (if any) into history before starting a new one
      const activeSeason = await tx.season.findFirst({
        where: { boardId, status: 'active' },
      });

      if (activeSeason) {
        await tx.season.update({
          where: { id: activeSeason.id },
          data: { status: 'finished', endsAt: new Date() },
        });
      }

      const board = await tx.board.findUnique({
        where: { id: boardId },
        include: { members: true },
      });

      if (!board) throw new NotFoundException('Board not found');

      const createdSeason = await tx.season.create({
        data: {
          boardId,
          name: dto.name,
          startingBalance,
          status: 'active',
          startsAt: now,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        },
      });

      // Create wallets + ledger entries for all members
      for (const member of board.members) {
        const wallet = await tx.wallet.create({
          data: {
            seasonId: createdSeason.id,
            userId: member.userId,
            balance: startingBalance,
            lockedBalance: 0,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'season_start',
            amount: startingBalance,
            balanceAfter: startingBalance,
          },
        });
      }

      return createdSeason;
    });

    return season;
  }

  async finishSeason(boardId: string, userId: string) {
    await this.checkOwner(boardId, userId);

    const season = await this.prisma.client.season.findFirst({
      where: { boardId, status: 'active' },
    });

    if (!season) throw new NotFoundException('No active season found');

    return this.prisma.client.season.update({
      where: { id: season.id },
      data: { status: 'finished', endsAt: new Date() },
    });
  }

  async getActiveSeason(boardId: string) {
    return this.prisma.client.season.findFirst({
      where: { boardId, status: 'active' },
      include: { board: true },
    });
  }

  async getSeasons(boardId: string) {
    return this.prisma.client.season.findMany({
      where: { boardId },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getSeasonById(id: string) {
    const season = await this.prisma.client.season.findUnique({
      where: { id },
      include: { board: true },
    });

    if (!season) throw new NotFoundException('Season not found');
    return season;
  }

  private async checkOwner(boardId: string, userId: string) {
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Only owner can perform this action');
    }
  }
}
