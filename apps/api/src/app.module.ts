import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { SeasonsModule } from './seasons/seasons.module';
import { WalletModule } from './wallet/wallet.module';
import { EventsModule } from './events/events.module';
import { BetsModule } from './bets/bets.module';
import { ResolveModule } from './resolve/resolve.module';
import { CommentsModule } from './comments/comments.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { OracleModule } from './oracle/oracle.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BoardsModule,
    SeasonsModule,
    WalletModule,
    EventsModule,
    BetsModule,
    ResolveModule,
    CommentsModule,
    LeaderboardModule,
    OracleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
