import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.client.user.findFirst({
      where: {
        OR: [{ email: dto.login }, { name: dto.name }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this name already exists');
    }

    const existingCredential = await this.prisma.client.credential.findUnique({
      where: { login: dto.login },
    });

    if (existingCredential) {
      throw new ConflictException('Login already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.login,
        password: hashedPassword,
        avatar: 'volt',
        credentials: {
          create: {
            login: dto.login,
            passwordHash: hashedPassword,
          },
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        email: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id);

    return { user, accessToken: token };
  }

  async login(dto: LoginDto) {
    const credential = await this.prisma.client.credential.findUnique({
      where: { login: dto.login },
      include: { user: true },
    });

    if (!credential || !credential.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, credential.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(credential.user.id);

    return {
      user: {
        id: credential.user.id,
        name: credential.user.name,
        avatar: credential.user.avatar,
        email: credential.user.email,
      },
      accessToken: token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }
}
