import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

const graceMs = () =>
  (Number(process.env.RESERVATION_NO_SHOW_GRACE_MINUTES) || 45) * 60 * 1000;

/**
 * Đặt CONFIRMED quá giờ (theo grace) mà chưa check-in → NO_SHOW.
 */
@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async markNoShows() {
    const cutoff = new Date(Date.now() - graceMs());
    const result = await this.prisma.reservation.updateMany({
      where: {
        status: 'CONFIRMED',
        checkedInAt: null,
        reservationTime: { lt: cutoff },
      },
      data: { status: 'NO_SHOW' },
    });
    if (result.count > 0) {
      this.logger.log(`NO_SHOW: ${result.count} đặt bàn`);
    }
  }
}
