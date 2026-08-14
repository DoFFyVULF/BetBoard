import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(eventId: string, userId: string, dto: CreateCommentDto) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check if user is a member of the board
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this board');
    }

    const comment = await this.prisma.client.eventComment.create({
      data: {
        eventId,
        userId,
        text: dto.text,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return this.formatCommentResponse(comment);
  }

  async getComments(eventId: string, page = 1, limit = 50) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const [comments, total] = await Promise.all([
      this.prisma.client.eventComment.findMany({
        where: { eventId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.eventComment.count({ where: { eventId } }),
    ]);

    return {
      comments: comments.map(this.formatCommentResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.client.eventComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Only author or admin can delete
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: comment.eventId },
    });
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event!.boardId, userId } },
    });

    if (
      comment.userId !== userId &&
      (!member || !['owner', 'admin'].includes(member.role))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.client.eventComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }

  async getReactions(eventId: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const reactions = await this.prisma.client.eventReaction.findMany({
      where: { eventId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Group by emoji
    const grouped = new Map<string, { emoji: string; count: number; users: any[] }>();
    for (const reaction of reactions) {
      const existing = grouped.get(reaction.emoji) || { emoji: reaction.emoji, count: 0, users: [] };
      existing.count++;
      existing.users.push(reaction.user);
      grouped.set(reaction.emoji, existing);
    }

    return Array.from(grouped.values());
  }

  async addReaction(eventId: string, userId: string, emoji: string) {
    const event = await this.prisma.client.betEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check if user is a member of the board
    const member = await this.prisma.client.groupMember.findUnique({
      where: { boardId_userId: { boardId: event.boardId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this board');
    }

    const reaction = await this.prisma.client.eventReaction.upsert({
      where: { eventId_userId_emoji: { eventId, userId, emoji } },
      update: {},
      create: { eventId, userId, emoji },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return this.formatReactionResponse(reaction);
  }

  async removeReaction(eventId: string, userId: string, emoji: string) {
    await this.prisma.client.eventReaction.delete({
      where: { eventId_userId_emoji: { eventId, userId, emoji } },
    });
    return { message: 'Reaction removed' };
  }

  private formatCommentResponse(comment: any) {
    return {
      id: comment.id,
      eventId: comment.eventId,
      userId: comment.userId,
      text: comment.text,
      createdAt: comment.createdAt,
      user: comment.user,
    };
  }

  private formatReactionResponse(reaction: any) {
    return {
      id: reaction.id,
      eventId: reaction.eventId,
      userId: reaction.userId,
      emoji: reaction.emoji,
      createdAt: reaction.createdAt,
      user: reaction.user,
    };
  }
}
