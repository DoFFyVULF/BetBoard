import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Моя компания' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 'my-board' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug: латиница, цифры и дефис' })
  slug: string;

  @ApiProperty({ required: false, example: 'Описание доски' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 'очки', default: 'очки' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  currencyName: string = 'очки';
}

export class UpdateBoardDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  currencyName?: string;
}

export class InviteDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ enum: ['owner', 'admin', 'member'], default: 'member' })
  @IsOptional()
  @IsString()
  role?: 'owner' | 'admin' | 'member' = 'member';
}

export class BoardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  currencyName: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  createdAt: Date;
}

export class MemberResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  title: string | null;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  isCurrentUser: boolean;
}
