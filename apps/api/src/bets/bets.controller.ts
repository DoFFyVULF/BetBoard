import {
  Controller,
  Get,
  Post,
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
import { BetsService } from './bets.service';
import { PlaceBetDto } from './dto/bet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email?: string; name: string; avatar: string };
}

@ApiTags('Bets')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetsController {
  constructor(private betsService: BetsService) {}

  @Post('events/:eventId/bets')
  @ApiOperation({ summary: 'Place a bet on an event' })
  @ApiResponse({ status: 201, description: 'Bet placed' })
  async placeBet(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body() dto: PlaceBetDto,
  ) {
    return this.betsService.placeBet(eventId, req.user.sub, dto);
  }

  @Get('me/bets')
  @ApiOperation({ summary: 'Get current user bets' })
  async getMyBets(@Req() req: AuthRequest, @Query('eventId') eventId?: string) {
    return this.betsService.getUserBets(req.user.sub, eventId);
  }

  @Get('events/:eventId/bets')
  @ApiOperation({ summary: 'Get all bets for an event (admin)' })
  async getEventBets(@Param('eventId') eventId: string) {
    return this.betsService.getEventBets(eventId);
  }

  @Get('events/:eventId/pool')
  @ApiOperation({ summary: 'Get pool summary for an event' })
  async getPoolSummary(@Param('eventId') eventId: string) {
    return this.betsService.getPoolSummary(eventId);
  }
}
