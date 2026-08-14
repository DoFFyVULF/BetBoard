import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty()
  seasonId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  available: number;

  @ApiProperty()
  locked: number;

  @ApiProperty()
  total: number;
}

export class LedgerEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  eventTitle: string | null;
}

export class WalletSummaryResponseDto {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  locked: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ type: [LedgerEntryResponseDto] })
  ledger: LedgerEntryResponseDto[];
}
