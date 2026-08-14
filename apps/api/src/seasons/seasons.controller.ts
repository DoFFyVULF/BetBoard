import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';
import { StartSeasonDto } from './dto/season.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('seasons')
@Controller('boards/:boardId/seasons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeasonsController {
  constructor(private seasonsService: SeasonsService) {}

  @Post()
  @ApiOperation({ summary: 'Start new season (owner/admin)' })
  async startSeason(
    @CurrentUser() user,
    @Param('boardId') boardId: string,
    @Body() dto: StartSeasonDto,
  ) {
    return this.seasonsService.startSeason(boardId, user.id, dto);
  }

  @Patch(':seasonId/finish')
  @ApiOperation({ summary: 'Finish active season (owner/admin)' })
  async finishSeason(
    @CurrentUser() user,
    @Param('boardId') boardId: string,
    @Param('seasonId') seasonId: string,
  ) {
    return this.seasonsService.finishSeason(boardId, user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active season' })
  async getActiveSeason(@Param('boardId') boardId: string) {
    return this.seasonsService.getActiveSeason(boardId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seasons for board' })
  async getSeasons(@Param('boardId') boardId: string) {
    return this.seasonsService.getSeasons(boardId);
  }

  @Get(':seasonId')
  @ApiOperation({ summary: 'Get season by ID' })
  async getSeason(@Param('seasonId') seasonId: string) {
    return this.seasonsService.getSeasonById(seasonId);
  }
}
