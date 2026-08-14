import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email?: string; name: string; avatar: string };
}

@ApiTags('Leaderboard')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('seasons/:seasonId/leaderboard')
  @ApiOperation({ summary: 'Get season leaderboard' })
  async getSeasonLeaderboard(@Param('seasonId') seasonId: string) {
    return this.leaderboardService.getSeasonLeaderboard(seasonId);
  }

  @Get('boards/:boardId/leaderboard')
  @ApiOperation({ summary: 'Get board leaderboard (all seasons)' })
  async getBoardLeaderboard(@Param('boardId') boardId: string) {
    return this.leaderboardService.getBoardLeaderboard(boardId);
  }

  @Get('me/rank')
  @ApiOperation({ summary: 'Get current user rank' })
  async getMyRank(
    @Req() req: AuthRequest,
    @Query('seasonId') seasonId?: string,
  ) {
    if (seasonId) {
      return this.leaderboardService.getUserRank(req.user.sub, seasonId);
    }
    return { rank: null, message: 'Provide seasonId for season-specific rank' };
  }
}
