import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ||
        'dev-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email?: string }) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, avatar: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { ...user, sub: user.id };
  }
}
