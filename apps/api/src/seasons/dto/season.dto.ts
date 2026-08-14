import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class StartSeasonDto {
  @ApiProperty({ example: 'Сентябрь 2026' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 1000, default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startingBalance?: number = 1000;

  @ApiProperty({ required: false, example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiProperty({ required: false, example: '2026-09-30T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class SeasonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  boardId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  startingBalance: number;

  @ApiProperty()
  startsAt: Date;

  @ApiProperty()
  endsAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
