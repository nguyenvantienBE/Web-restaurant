import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PublicPaymentsController } from './public-payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RealtimeModule } from '@/realtime/realtime.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [RealtimeModule, InvoicesModule, ShiftsModule],
  controllers: [PaymentsController, PublicPaymentsController],
  providers: [PaymentsService, PrismaService],
})
export class PaymentsModule {}
