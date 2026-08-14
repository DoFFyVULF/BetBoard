import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Александр' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  name: string;

  @ApiProperty({ example: 'alex' })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(4)
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alex' })
  @IsString()
  @MinLength(3)
  login: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(4)
  @MaxLength(128)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  };

  @ApiProperty()
  accessToken: string;
}
