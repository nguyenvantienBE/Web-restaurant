import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class StaffNotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    type: string,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.staffNotification.create({
      data: {
        type,
        title,
        body,
        metadata:
          metadata !== undefined
            ? (metadata as Prisma.InputJsonValue)
            : undefined,
      },
    });
  }

  findRecent(limit = 50) {
    return this.prisma.staffNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
