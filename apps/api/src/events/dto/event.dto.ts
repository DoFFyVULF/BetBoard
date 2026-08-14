import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Category, OddsMode } from '@generated/prisma/enums';

export class CreateOutcomeDto {
  @ApiProperty({ example: 'Team A wins' })
  @IsString()
  label: string;

  @ApiProperty({ required: false, example: 2.5 })
  @IsOptional()
  @IsNumber()
  fixedOdds?: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Match: Team A vs Team B' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ required: false, example: 'Premier League match' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'season-uuid' })
  @IsOptional()
  @IsString()
  seasonId?: string;

  @ApiProperty({ enum: Category, example: Category.sport })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({ example: '2026-09-15T20:00:00.000Z' })
  @IsDateString()
  closesAt: string;

  @ApiProperty({ required: false, example: '2026-09-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiProperty({ enum: OddsMode, example: OddsMode.parimutuel })
  @IsEnum(OddsMode)
  oddsMode: OddsMode;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minBet?: number = 10;

  @ApiProperty({ required: false, example: 300 })
  @IsOptional()
  @IsNumber()
  @Max(10000)
  maxBet?: number = 300;

  @ApiProperty({ type: [CreateOutcomeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOutcomeDto)
  outcomes: CreateOutcomeDto[];
}

export class UpdateEventDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiProperty({ required: false, enum: OddsMode })
  @IsOptional()
  @IsEnum(OddsMode)
  oddsMode?: OddsMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minBet?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Max(10000)
  maxBet?: number;
}

export class PlaceBetDto {
  @ApiProperty({ example: 'outcome-uuid' })
  @IsString()
  outcomeId: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  amount: number;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  boardId: string;

  @ApiProperty()
  seasonId: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty({ enum: Category })
  category: Category;

  @ApiProperty()
  closesAt: Date;

  @ApiProperty()
  startsAt: Date | null;

  @ApiProperty({
    enum: ['draft', 'open', 'closed', 'resolved', 'canceled', 'disputed'],
  })
  status: string;

  @ApiProperty({ enum: OddsMode })
  oddsMode: OddsMode;

  @ApiProperty()
  minBet: number;

  @ApiProperty()
  maxBet: number;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  resolvedBy: string | null;

  @ApiProperty()
  resolvedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [Object] })
  outcomes: Array<{
    id: string;
    label: string;
    sortOrder: number;
    fixedOdds: number | null;
    winning: boolean | null;
  }>;

  @ApiProperty({ required: false })
  _count?: {
    bets: number;
    comments: number;
    reactions: number;
  };
}

export class EventWithDetailsDto extends EventResponseDto {
  @ApiProperty()
  board: {
    id: string;
    name: string;
    slug: string;
    currencyName: string;
  };

  @ApiProperty({ required: false })
  season: {
    id: string;
    name: string;
    startingBalance: number;
  } | null;

  @ApiProperty()
  creator: {
    id: string;
    name: string;
    avatar: string;
  };

  @ApiProperty({ required: false })
  resolver: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}
