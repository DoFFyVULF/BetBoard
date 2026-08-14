import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ResolveEventDto {
  @ApiProperty({ type: [String], example: ['outcome-uuid-1'] })
  @IsArray()
  @IsUUID('4', { each: true })
  winningOutcomeIds: string[];
}

export class AdjustBalanceDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false, example: 'Bonus for winner' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResolveResultDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  winningOutcomeIds: string[];

  @ApiProperty()
  totalPayout: number;

  @ApiProperty()
  winnersCount: number;

  @ApiProperty()
  losersCount: number;

  @ApiProperty()
  refundedCount: number;
}
