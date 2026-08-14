import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ResolveService } from './resolve.service';
import { ResolveEventDto, AdjustBalanceDto } from './dto/resolve.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: { sub: string; email?: string; name: string; avatar: string };
}

@ApiTags('Resolve')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResolveController {
  constructor(private resolveService: ResolveService) {}

  @Post('events/:eventId/resolve')
  @ApiOperation({ summary: 'Resolve an event (admin)' })
  @ApiResponse({ status: 200, description: 'Event resolved' })
  async resolveEvent(
    @Param('eventId') eventId: string,
    @Req() req: AuthRequest,
    @Body() dto: ResolveEventDto,
  ) {
    return this.resolveService.resolveEvent(eventId, req.user.sub, dto);
  }

  @Post('wallet/adjust')
  @ApiOperation({ summary: 'Adjust user balance (admin)' })
  async adjustBalance(@Req() req: AuthRequest, @Body() dto: AdjustBalanceDto) {
    return this.resolveService.adjustBalance(dto.userId, req.user.sub, dto);
  }

  @Get('events/:eventId/resolution')
  @ApiOperation({ summary: 'Get event resolution details' })
  async getResolution(@Param('eventId') eventId: string) {
    return this.resolveService.getEventResolution(eventId);
  }
}
