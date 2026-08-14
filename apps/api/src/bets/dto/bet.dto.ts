import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class PlaceBetDto {
  @ApiProperty({ example: 'outcome-id' })
  @IsString()
  outcomeId: string;

  @ApiProperty({ example: 50, minimum: 1, maximum: 10000 })
  @IsNumber()
  @Min(1)
  @Max(10000)
  amount: number;
}

export class BetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  outcomeId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['active', 'won', 'lost', 'refunded', 'canceled'] })
  status: string;

  @ApiProperty()
  payout: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  outcome?: {
    id: string;
    label: string;
  };

  @ApiProperty({ required: false })
  event?: {
    id: string;
    title: string;
    status: string;
  };
}

export class PoolSummaryDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  totalPool: number;

  @ApiProperty()
  totalBackers: number;

  @ApiProperty()
  outcomes: Array<{
    outcomeId: string;
    label: string;
    pool: number;
    backers: number;
    odds: number;
    percent: number;
  }>;
}
