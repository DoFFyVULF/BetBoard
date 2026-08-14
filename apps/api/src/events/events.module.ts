import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsPublicController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [EventsController, EventsPublicController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
