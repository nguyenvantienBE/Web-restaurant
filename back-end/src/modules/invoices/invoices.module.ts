import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { PublicInvoicesController } from './public-invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SettingsModule } from '../settings/settings.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [SettingsModule, ShiftsModule],
  controllers: [InvoicesController, PublicInvoicesController],
  providers: [InvoicesService, PrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
