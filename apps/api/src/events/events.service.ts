import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { Category, OddsMode, EventStatus, Role } from '@generated/prisma/enums';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(
    boardId: string,
    seasonId: string | undefined,
    userId: string,
    dto: CreateEventDto,
  ) {
    // Check if user is member of board
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this board');
    }

    // Validate season if provided
    if (seasonId) {
      const season = await this.prisma.client.season.findUnique({
        where: { id: seasonId },
      });
      if (!season || season.boardId !== boardId) {
        throw new BadRequestException('Invalid season for this board');
      }
      if (season.status !== 'active') {
        throw new BadRequestException('Season must be active');
      }
    } else if (dto.seasonId) {
      // Use seasonId from DTO if not explicitly passed
      const season = await this.prisma.client.season.findUnique({
        where: { id: dto.seasonId },
      });
      if (!season || season.boardId !== boardId) {
        throw new BadRequestException('Invalid season for this board');
      }
      if (season.status !== 'active') {
        throw new BadRequestException('Season must be active');
      }
      seasonId = dto.seasonId;
    }

    // Validate outcomes - at least 2 outcomes
    if (dto.outcomes.length < 2) {
      throw new BadRequestException('Event must have at least 2 outcomes');
    }

    // For fixed odds, validate that odds are provided
    if (dto.oddsMode === 'fixed') {
      for (const outcome of dto.outcomes) {
        if (!outcome.fixedOdds || outcome.fixedOdds < 1.01) {
          throw new BadRequestException(
            'Fixed odds must be >= 1.01 for fixed odds mode',
          );
        }
      }
    }

    const now = new Date();
    const closesAt = new Date(dto.closesAt);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;

    if (closesAt <= now) {
      throw new BadRequestException('closesAt must be in the future');
    }

    if (startsAt && startsAt >= closesAt) {
      throw new BadRequestException('startsAt must be before closesAt');
    }

    // Create event with outcomes
    const eventData: any = {
      boardId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      closesAt,
      startsAt,
      // Автоматически открываем событие для ставок сразу. Если нужен флоу
      // «черновик → опубликовать», вернуть значение 'draft'.
      status: 'open',
      oddsMode: dto.oddsMode,
      minBet: dto.minBet ?? 10,
      maxBet: dto.maxBet ?? 300,
      createdBy: userId,
      outcomes: {
        create: dto.outcomes.map((o, index) => ({
          label: o.label,
          sortOrder: o.sortOrder ?? index,
          fixedOdds: o.fixedOdds,
          winning: false,
        })),
      },
    };

    if (seasonId) {
      eventData.seasonId = seasonId;
    }

    const event = await this.prisma.client.betEvent.create({
      data: eventData,
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return this.formatEventResponse(event);
  }

  async getEvents(boardId: string, seasonId?: string) {
    const where: any = { boardId };
    if (seasonId) where.seasonId = seasonId;

    const events = await this.prisma.client.betEvent.findMany({
      where,
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, avatar: true } },
        resolver: { select: { id: true, name: true, avatar: true } },
        board: {
          select: { id: true, name: true, slug: true, currencyName: true },
        },
        season: { select: { id: true, name: true, startingBalance: true } },
        _count: { select: { bets: true, comments: true, reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return events.map(this.formatEventResponse);
  }

  async getEventById(eventId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, avatar: true } },
        resolver: { select: { id: true, name: true, avatar: true } },
        board: {
          select: { id: true, name: true, slug: true, currencyName: true },
        },
        season: { select: { id: true, name: true, startingBalance: true } },
        _count: { select: { bets: true, comments: true, reactions: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    return this.formatEventResponse(event);
  }

  async updateEvent(eventId: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Only creator or board admin/owner can update
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (
      !member ||
      (event.createdBy !== userId && !['owner', 'admin'].includes(member.role))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Can only update draft events
    if (event.status !== 'draft') {
      throw new BadRequestException('Can only update draft events');
    }

    const updateData: any = { ...dto };
    if (dto.closesAt) updateData.closesAt = new Date(dto.closesAt);
    if (dto.startsAt) updateData.startsAt = new Date(dto.startsAt);

    const updated = await this.prisma.client.betEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, avatar: true } },
        resolver: { select: { id: true, name: true, avatar: true } },
        board: {
          select: { id: true, name: true, slug: true, currencyName: true },
        },
        season: { select: { id: true, name: true, startingBalance: true } },
        _count: { select: { bets: true, comments: true, reactions: true } },
      },
    });

    return this.formatEventResponse(updated);
  }

  async openEvent(eventId: string, userId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only admins can open events');
    }

    if (event.status !== 'draft') {
      throw new BadRequestException('Event must be in draft status to open');
    }

    const updated = await this.prisma.client.betEvent.update({
      where: { id: eventId },
      data: { status: 'open' },
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, avatar: true } },
        resolver: { select: { id: true, name: true, avatar: true } },
        board: {
          select: { id: true, name: true, slug: true, currencyName: true },
        },
        season: { select: { id: true, name: true, startingBalance: true } },
        _count: { select: { bets: true, comments: true, reactions: true } },
      },
    });

    return this.formatEventResponse(updated);
  }

  async closeEvent(eventId: string, userId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only admins can close events');
    }

    if (event.status !== 'open') {
      throw new BadRequestException('Event must be open to close');
    }

    const updated = await this.prisma.client.betEvent.update({
      where: { id: eventId },
      data: { status: 'closed' },
      include: {
        outcomes: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true, avatar: true } },
        resolver: { select: { id: true, name: true, avatar: true } },
        board: {
          select: { id: true, name: true, slug: true, currencyName: true },
        },
        season: { select: { id: true, name: true, startingBalance: true } },
        _count: { select: { bets: true, comments: true, reactions: true } },
      },
    });

    return this.formatEventResponse(updated);
  }

  async cancelEvent(eventId: string, userId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only admins can cancel events');
    }

    if (event.status === 'resolved') {
      throw new BadRequestException('Cannot cancel a resolved event');
    }

    // Refund all bets
    await this.prisma.client.$transaction(async (tx) => {
      const bets = await tx.bet.findMany({
        where: { eventId, status: 'active' },
      });

      for (const bet of bets) {
        const wallet = await tx.wallet.findUnique({
          where: {
            seasonId_userId: { seasonId: event.seasonId, userId: bet.userId },
          },
        });

        if (wallet) {
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
        }
      }

      await tx.betEvent.update({
        where: { id: eventId },
        data: { status: 'canceled' },
      });
    });

    return { message: 'Event canceled and bets refunded' };
  }

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Only admins can delete events');
    }

    if (event.status !== 'draft') {
      throw new BadRequestException('Can only delete draft events');
    }

    await this.prisma.client.betEvent.delete({ where: { id: eventId } });
    return { message: 'Event deleted' };
  }

  private formatEventResponse(event: any) {
    return {
      id: event.id,
      boardId: event.boardId,
      seasonId: event.seasonId,
      title: event.title,
      description: event.description,
      category: event.category,
      closesAt: event.closesAt,
      startsAt: event.startsAt,
      status: event.status,
      oddsMode: event.oddsMode,
      minBet: event.minBet,
      maxBet: event.maxBet,
      createdBy: event.createdBy,
      resolvedBy: event.resolvedBy,
      resolvedAt: event.resolvedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      outcomes:
        event.outcomes?.map((o: any) => ({
          id: o.id,
          label: o.label,
          sortOrder: o.sortOrder,
          fixedOdds: o.fixedOdds,
          winning: o.winning,
        })) || [],
      _count: event._count,
      board: event.board,
      season: event.season,
      creator: event.creator,
      resolver: event.resolver,
    };
  }
}
