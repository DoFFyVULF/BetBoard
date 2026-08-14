import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto, UpdateBoardDto, InviteDto } from './dto/board.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    const existing = await this.prisma.client.board.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Slug already taken');
    }

    const board = await this.prisma.client.board.create({
      data: {
        ...dto,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
            title: 'Хранитель доски',
          },
        },
      },
    });

    return board;
  }

  async findAll(userId: string) {
    return this.prisma.client.board.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true, seasons: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const board = await this.prisma.client.board.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async findById(id: string) {
    const board = await this.prisma.client.board.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async findByInviteCode(inviteCode: string) {
    const board = await this.prisma.client.board.findUnique({
      where: { inviteCode },
      include: { owner: { select: { id: true, name: true, avatar: true } } },
    });

    if (!board) throw new NotFoundException('Invalid invite code');
    return board;
  }

  async update(userId: string, boardId: string, dto: UpdateBoardDto) {
    await this.checkOwnerOrAdmin(userId, boardId);
    return this.prisma.client.board.update({
      where: { id: boardId },
      data: dto,
    });
  }

  async inviteMember(userId: string, boardId: string, dto: InviteDto) {
    await this.checkOwnerOrAdmin(userId, boardId);

    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId: user.id } },
    });

    if (existing) throw new ConflictException('User already a member');

    return this.prisma.client.groupMember.create({
      data: { boardId, userId: user.id, role: dto.role },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  async joinByInviteCode(userId: string, inviteCode: string) {
    const board = await this.prisma.client.board.findUnique({
      where: { inviteCode },
    });
    if (!board) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: board.id, userId } },
    });

    if (existing) throw new ConflictException('Already a member');

    // Вступление в активный сезон: вместе с членством создаём кошелёк
    // (с «сезонным» стартовым балансом), чтобы новый участник мог ставить.
    // Паттерн повторяет создание кошельков при запуске сезона.
    const activeSeason = await this.prisma.client.season.findFirst({
      where: { boardId: board.id, status: 'active' },
    });

    const member = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.groupMember.create({
        data: { boardId: board.id, userId, role: 'member' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });

      if (activeSeason) {
        const wallet = await tx.wallet.create({
          data: {
            seasonId: activeSeason.id,
            userId,
            balance: activeSeason.startingBalance,
            lockedBalance: 0,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: 'season_start',
            amount: activeSeason.startingBalance,
            balanceAfter: activeSeason.startingBalance,
          },
        });
      }

      return created;
    });

    return member;
  }

  async getMembers(boardId: string) {
    return this.prisma.client.groupMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async removeMember(userId: string, boardId: string, targetUserId: string) {
    // Удалять участников могут владелец и админы (создатель группы = админ).
    await this.checkOwnerOrAdmin(userId, boardId);

    if (userId === targetUserId)
      throw new ForbiddenException('Cannot remove yourself');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner')
      throw new ForbiddenException('Cannot remove owner');

    return this.prisma.client.groupMember.delete({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });
  }

  async updateRole(
    userId: string,
    boardId: string,
    targetUserId: string,
    role: 'admin' | 'member',
  ) {
    await this.checkOwner(userId, boardId);

    if (userId === targetUserId)
      throw new ForbiddenException('Cannot change your own role');

    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner')
      throw new ForbiddenException('Cannot change owner role');

    return this.prisma.client.groupMember.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  private async checkOwnerOrAdmin(userId: string, boardId: string) {
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async checkOwner(userId: string, boardId: string) {
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Only owner can perform this action');
    }
  }
}
