import { Module } from '@nestjs/common';
import { ResolveController } from './resolve.controller';
import { ResolveService } from './resolve.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [ResolveController],
  providers: [ResolveService],
  exports: [ResolveService],
})
export class ResolveModule {}
