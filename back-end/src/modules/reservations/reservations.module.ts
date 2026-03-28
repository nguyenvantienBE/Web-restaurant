import { Module } from '@nestjs/common';
import {
  ManagerReservationsController,
  PublicReservationsController,
} from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '@/prisma/prisma.service';
import { TablesModule } from '@/modules/tables/tables.module';
import { ReservationsScheduler } from './reservations.scheduler';
import { StaffNotificationsService } from './staff-notifications.service';
import { ReservationEmailService } from './reservation-email.service';
import { StaffNotificationsController } from './staff-notifications.controller';

@Module({
  imports: [TablesModule],
  controllers: [
    PublicReservationsController,
    ManagerReservationsController,
    StaffNotificationsController,
  ],
  providers: [
    ReservationsService,
    ReservationsScheduler,
    StaffNotificationsService,
    ReservationEmailService,
    PrismaService,
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}
