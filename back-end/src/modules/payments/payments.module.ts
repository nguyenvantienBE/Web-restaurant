import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RealtimeModule } from '@/realtime/realtime.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [RealtimeModule, InvoicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
})
export class PaymentsModule {}
