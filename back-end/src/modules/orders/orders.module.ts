import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '@/prisma/prisma.service';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [ShiftsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
