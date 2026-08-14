import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('wallet')
@Controller('seasons/:seasonId/wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wallet summary' })
  async getMyWallet(@CurrentUser() user, @Param('seasonId') seasonId: string) {
    return this.walletService.getSummary(seasonId, user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user wallet (for leaderboard)' })
  async getUserWallet(
    @Param('seasonId') seasonId: string,
    @Param('userId') userId: string,
  ) {
    return this.walletService.getWallet(seasonId, userId);
  }

  @Get(':userId/summary')
  @ApiOperation({ summary: 'Get user wallet summary' })
  async getUserWalletSummary(
    @Param('seasonId') seasonId: string,
    @Param('userId') userId: string,
  ) {
    return this.walletService.getSummary(seasonId, userId);
  }

  @Get(':userId/ledger')
  @ApiOperation({ summary: 'Get user wallet ledger' })
  async getUserWalletLedger(
    @Param('seasonId') seasonId: string,
    @Param('userId') userId: string,
  ) {
    return this.walletService.getLedger(seasonId, userId);
  }
}
