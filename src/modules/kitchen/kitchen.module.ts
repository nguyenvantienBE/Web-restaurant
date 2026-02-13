import { Module } from '@nestjs/common';
import { KitchenController } from './kitchen.controller';
import { OrdersModule } from '../orders/orders.module';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
    imports: [OrdersModule],
    controllers: [KitchenController],
    providers: [PrismaService],
})
export class KitchenModule { }
