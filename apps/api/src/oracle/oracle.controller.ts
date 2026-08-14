import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OracleService } from './oracle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Oracle')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OracleController {
  constructor(private oracleService: OracleService) {}

  @Get('seasons/:seasonId/oracle/:userId')
  @ApiOperation({ summary: 'Get oracle profile for a user in a season' })
  async getOracleProfile(
    @Param('seasonId') seasonId: string,
    @Param('userId') userId: string,
  ) {
    return this.oracleService.getOracleProfile(seasonId, userId);
  }
}