import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email?: string; name: string; avatar: string };
}

@ApiTags('Comments')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('events/:eventId/comments')
  @ApiOperation({ summary: 'Add a comment to an event' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async createComment(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(eventId, req.user.sub, dto);
  }

  @Get('events/:eventId/comments')
  @ApiOperation({ summary: 'Get comments for an event' })
  async getComments(
    @Param('eventId') eventId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commentsService.getComments(eventId, page || 1, limit || 50);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthRequest,
  ) {
    return this.commentsService.deleteComment(commentId, req.user.sub);
  }

  @Get('events/:eventId/reactions')
  @ApiOperation({ summary: 'Get reactions for an event' })
  async getReactions(@Param('eventId') eventId: string) {
    return this.commentsService.getReactions(eventId);
  }

  @Post('events/:eventId/reactions')
  @ApiOperation({ summary: 'Add a reaction to an event' })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body('emoji') emoji: string,
  ) {
    return this.commentsService.addReaction(eventId, req.user.sub, emoji);
  }

  @Delete('events/:eventId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from an event' })
  async removeReaction(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Param('emoji') emoji: string,
  ) {
    return this.commentsService.removeReaction(eventId, req.user.sub, emoji);
  }
}
