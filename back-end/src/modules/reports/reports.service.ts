import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const TZ = 'Asia/Ho_Chi_Minh';

function formatYmdVN(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

function vnAddDays(ymd: string, delta: number): string {
  const d = new Date(`${ymd}T12:00:00+07:00`);
  d.setTime(d.getTime() + delta * 86400000);
  return formatYmdVN(d);
}

function vnDayBounds(ymd: string): { start: Date; end: Date } {
  return {
    start: new Date(`${ymd}T00:00:00+07:00`),
    end: new Date(`${ymd}T23:59:59.999+07:00`),
  };
}

function vnWeekBounds(ymd: string): { start: Date; end: Date } {
  const ref = new Date(`${ymd}T12:00:00+07:00`);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(ref);
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const idx = order.indexOf(weekday);
  const safeIdx = idx >= 0 ? idx : 0;
  const mondayYmd = formatYmdVN(new Date(ref.getTime() - safeIdx * 86400000));
  const sundayYmd = vnAddDays(mondayYmd, 6);
  return {
    start: new Date(`${mondayYmd}T00:00:00+07:00`),
    end: new Date(`${sundayYmd}T23:59:59.999+07:00`),
  };
}

function vnMonthBounds(ymd: string): { start: Date; end: Date } {
  const [y, m] = ymd.split('-').map(Number);
  const firstYmd = `${y}-${String(m).padStart(2, '0')}-01`;
  const nextMonthY = m === 12 ? y + 1 : y;
  const nextMonthM = m === 12 ? 1 : m + 1;
  const nextFirstYmd = `${nextMonthY}-${String(nextMonthM).padStart(2, '0')}-01`;
  const lastYmd = vnAddDays(nextFirstYmd, -1);
  return {
    start: new Date(`${firstYmd}T00:00:00+07:00`),
    end: new Date(`${lastYmd}T23:59:59.999+07:00`),
  };
}

/** Mỗi ngày trong [startYmd, endYmd] (chuỗi YYYY-MM-DD tăng dần) */
function eachDayInclusive(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  let cur = startYmd;
  out.push(cur);
  while (cur < endYmd) {
    cur = vnAddDays(cur, 1);
    out.push(cur);
  }
  return out;
}

function shortWeekdayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00+07:00`);
  const w = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, weekday: 'short' }).format(d);
  return w.replace('.', '');
}

function labelDayMonth(ymd: string): string {
  const [y, m, day] = ymd.split('-');
  return `${day}/${m}`;
}

export type DashboardMode = 'day' | 'week' | 'month';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Giữ tương thích: today = 0h–hiện tại (VN), week = 7 ngày lịch trở lại, month = 30 ngày.
   * `day` = hôm nay (cùng today).
   */
  async getRevenue(period: 'day' | 'week' | 'month' | 'today') {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today' || period === 'day') {
      const ymd = formatYmdVN(now);
      startDate = vnDayBounds(ymd).start;
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 86400000);
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

    const revenueByMethod = payments.reduce(
      (acc, p) => {
        const method = p.paymentMethod || 'cash';
        acc[method] = (acc[method] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      period,
      startDate,
      endDate: now,
      totalRevenue,
      revenueByMethod,
      transactionCount: payments.length,
    };
  }

  async getDashboard(anchorYmd: string | undefined, mode: DashboardMode) {
    const anchor = anchorYmd?.trim() || formatYmdVN(new Date());
    let start: Date;
    let end: Date;
    let seriesDays: string[] = [];

    if (mode === 'day') {
      const b = vnDayBounds(anchor);
      start = b.start;
      end = b.end;
      seriesDays = [anchor];
    } else if (mode === 'week') {
      const b = vnWeekBounds(anchor);
      start = b.start;
      end = b.end;
      const mondayYmd = formatYmdVN(b.start);
      const sundayYmd = formatYmdVN(b.end);
      seriesDays = eachDayInclusive(mondayYmd, sundayYmd);
    } else {
      const b = vnMonthBounds(anchor);
      start = b.start;
      end = b.end;
      const firstYmd = formatYmdVN(b.start);
      const lastYmd = formatYmdVN(b.end);
      seriesDays = eachDayInclusive(firstYmd, lastYmd);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      select: {
        orderId: true,
        amount: true,
        paymentMethod: true,
        paidAt: true,
      },
    });

    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
    const orderIds = [...new Set(payments.map((p) => p.orderId))];
    const orderCount = orderIds.length;
    const transactionCount = payments.length;

    const revenueByMethodRaw = payments.reduce(
      (acc, p) => {
        const method = p.paymentMethod || 'cash';
        acc[method] = (acc[method] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const methodTotal = Object.values(revenueByMethodRaw).reduce((a, b) => a + b, 0);
    const revenueByMethodPct = Object.entries(revenueByMethodRaw).map(([method, amount]) => ({
      method,
      amount,
      percent: methodTotal > 0 ? Math.round((amount / methodTotal) * 1000) / 10 : 0,
    }));

    const byDay: Record<string, { revenue: number; orderIds: Set<string> }> = {};
    for (const d of seriesDays) {
      byDay[d] = { revenue: 0, orderIds: new Set() };
    }

    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = formatYmdVN(new Date(p.paidAt));
      if (!byDay[key]) {
        byDay[key] = { revenue: 0, orderIds: new Set() };
      }
      byDay[key].revenue += Number(p.amount);
      byDay[key].orderIds.add(p.orderId);
    }

    const series = seriesDays.map((ymd) => {
      const bucket = byDay[ymd] || { revenue: 0, orderIds: new Set<string>() };
      let label: string;
      if (mode === 'week') {
        label = shortWeekdayLabel(ymd);
      } else if (mode === 'month') {
        label = labelDayMonth(ymd);
      } else {
        label = labelDayMonth(ymd);
      }
      return {
        date: ymd,
        label,
        revenue: bucket.revenue,
        orders: bucket.orderIds.size,
      };
    });

    const numSeriesDays = seriesDays.length || 1;
    const avgPerDay = totalRevenue / numSeriesDays;
    const avgPerOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    const topItems = await this.getTopSellingItemsInRange(start, end, 5);

    return {
      mode,
      anchorDate: anchor,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
        labelVi:
          mode === 'day'
            ? `Ngày ${labelDayMonth(anchor)}/${anchor.split('-')[0]}`
            : mode === 'week'
              ? `Tuần ${formatYmdVN(start)} → ${formatYmdVN(end)}`
              : `Tháng ${anchor.split('-')[1]}/${anchor.split('-')[0]}`,
      },
      summary: {
        totalRevenue,
        orderCount,
        transactionCount,
        avgPerDay,
        avgPerOrder,
      },
      series,
      revenueByMethod: revenueByMethodRaw,
      revenueByMethodPct,
    };
  }

  async getTopSellingItemsInRange(
    start: Date,
    end: Date,
    limit: number = 5,
  ) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      select: { orderId: true },
    });
    const orderIds = [...new Set(payments.map((p) => p.orderId))];
    if (orderIds.length === 0) {
      return [];
    }

    const items = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        orderId: { in: orderIds },
        status: { not: 'CANCELLED' },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
      select: { id: true, name: true, price: true },
    });

    return items.map((item) => {
      const details = menuItems.find((m) => m.id === item.menuItemId);
      const qty = item._sum.quantity || 0;
      const subSum = item._sum.subtotal;
      const revenue = subSum != null ? Number(subSum) : qty * Number(details?.price || 0);
      return {
        menuItemId: item.menuItemId,
        name: details?.name || 'Unknown',
        price: Number(details?.price || 0),
        totalSold: qty,
        revenueGenerated: revenue,
      };
    });
  }

  async getTopSellingItems(limit: number = 5) {
    const end = new Date();
    const start = new Date(0);
    return this.getTopSellingItemsInRange(start, end, limit);
  }

  /** Tổng kết ca trong ngày (theo giờ VN) — chỉ đọc, không ghi DB */
  async getShiftSummary(ymd?: string) {
    const day = ymd?.trim() || formatYmdVN(new Date());
    const { start, end } = vnDayBounds(day);
    const dashboard = await this.getDashboard(day, 'day');
    const topItems = await this.getTopSellingItemsInRange(start, end, 10);

    const cancelledOrders = await this.prisma.order.count({
      where: {
        status: 'CANCELLED',
        createdAt: { gte: start, lte: end },
      },
    });

    const completedOrders = await this.prisma.order.count({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: start, lte: end },
      },
    });

    const transfer =
      (dashboard.revenueByMethod['transfer'] ?? 0) +
      (dashboard.revenueByMethod['qr'] ?? 0);

    return {
      shiftDate: day,
      generatedAt: new Date().toISOString(),
      range: { start: start.toISOString(), end: end.toISOString() },
      totalRevenue: dashboard.summary.totalRevenue,
      totalTransactions: dashboard.summary.transactionCount,
      orderCount: dashboard.summary.orderCount,
      revenueByMethod: dashboard.revenueByMethod,
      revenueByMethodPct: dashboard.revenueByMethodPct,
      cashTotal: dashboard.revenueByMethod['cash'] || 0,
      cardTotal: dashboard.revenueByMethod['card'] || 0,
      transferTotal: transfer,
      cancelledOrders,
      completedOrders,
      topItems,
    };
  }

  async endShift() {
    const day = formatYmdVN(new Date());
    const { start, end } = vnDayBounds(day);
    const dashboard = await this.getDashboard(day, 'day');
    const cancelledOrders = await this.prisma.order.count({
      where: {
        status: 'CANCELLED',
        createdAt: { gte: start, lte: end },
      },
    });

    const transfer =
      (dashboard.revenueByMethod['transfer'] ?? 0) +
      (dashboard.revenueByMethod['qr'] ?? 0);

    return {
      shiftDate: day,
      endedAt: new Date().toISOString(),
      cashInDrawer: dashboard.revenueByMethod['cash'] || 0,
      cardPayments: dashboard.revenueByMethod['card'] || 0,
      transferPayments: transfer,
      totalRevenue: dashboard.summary.totalRevenue,
      totalTransactions: dashboard.summary.transactionCount,
      orderCount: dashboard.summary.orderCount,
      cancelledOrders,
      revenueByMethod: dashboard.revenueByMethod,
      revenueByMethodPct: dashboard.revenueByMethodPct,
    };
  }
}
