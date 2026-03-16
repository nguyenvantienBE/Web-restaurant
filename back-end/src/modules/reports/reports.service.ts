import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue(period: 'day' | 'week' | 'month' | 'today') {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        amount: true,
        paymentMethod: true,
        paidAt: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Group by payment methods
    const revenueByMethod = payments.reduce((acc, p) => {
      const method = p.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      period,
      startDate,
      endDate: now,
      totalRevenue,
      revenueByMethod,
      transactionCount: payments.length,
    };
  }

  async getTopSellingItems(limit: number = 5) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        status: { not: 'CANCELLED' },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Fetch item details
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: {
          in: items.map((i) => i.menuItemId),
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const result = items.map((item) => {
      const details = menuItems.find((m) => m.id === item.menuItemId);
      return {
        menuItemId: item.menuItemId,
        name: details?.name || 'Unknown',
        price: Number(details?.price || 0),
        totalSold: item._sum.quantity || 0,
        revenueGenerated: (item._sum.quantity || 0) * Number(details?.price || 0),
      };
    });

    return result;
  }

  async endShift() {
    // A simple end of shift logic that processes today's orders since last shift.
    // In a real system we'd track a Shift model. Here we just aggregate 'today'.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.getRevenue('today');

    const cancelledOrders = await this.prisma.order.count({
      where: {
        status: 'CANCELLED',
        createdAt: { gte: today },
      },
    });

    return {
      shiftDate: today,
      endedAt: new Date(),
      cashInDrawer: stats.revenueByMethod['cash'] || 0,
      cardPayments: stats.revenueByMethod['card'] || 0,
      totalRevenue: stats.totalRevenue,
      totalTransactions: stats.transactionCount,
      cancelledOrders,
    };
  }
}
