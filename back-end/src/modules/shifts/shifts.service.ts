import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, ShiftExpenseType } from '@prisma/client';
import { OpenShiftDto } from './dto/open-shift.dto';
import { AddShiftExpenseDto } from './dto/add-expense.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { SettingsService } from '../settings/settings.service';

const TZ = 'Asia/Ho_Chi_Minh';

function formatYmdVN(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Phút trong ngày theo giờ VN (0–1439) */
function currentMinutesVN(now: Date): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return h * 60 + m;
}

function parseHHmm(s: string): number {
  const [h, m] = s.trim().split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Trong [open, close] cùng ngày; hoặc qua đêm khi open > close (vd 17:00–02:00) */
function isWithinOperatingHours(
  openHHmm: string,
  closeHHmm: string,
  now: Date = new Date(),
): boolean {
  const cur = currentMinutesVN(now);
  const o = parseHHmm(openHHmm);
  const c = parseHHmm(closeHHmm);
  if (o <= c) {
    return cur >= o && cur <= c;
  }
  return cur >= o || cur <= c;
}

const EPS = 0.01;

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async userHasClaim(userId: string, claimCode: string): Promise<boolean> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
        userPermissions: { include: { permission: true } },
      },
    });
    if (!u) return false;
    const fromRole = u.role.rolePermissions.map((rp) => rp.permission.code);
    const fromUser = u.userPermissions.map((up) => up.permission.code);
    return new Set([...fromRole, ...fromUser]).has(claimCode);
  }

  async getOpenShift() {
    return this.prisma.shift.findFirst({
      where: { status: 'OPEN' },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
        expenses: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  /**
   * Có ca OPEN → dùng.
   * Chưa có → nếu đang trong giờ vận hành (cài đặt nhà hàng) → tự tạo ca (0đ đầu ca, người mở = system hoặc admin).
   * Ngoài giờ → lỗi rõ ràng.
   */
  async requireOpenShiftId(): Promise<string> {
    const s = await this.prisma.shift.findFirst({
      where: { status: 'OPEN' },
      select: { id: true },
    });
    if (s) return s.id;

    const settings = await this.settingsService.getRestaurantSettings();
    const openT = settings.operationsOpenTime?.trim() || '10:00';
    const closeT = settings.operationsCloseTime?.trim() || '23:00';

    if (!isWithinOperatingHours(openT, closeT)) {
      throw new BadRequestException(
        `Ngoài giờ phục vụ (${openT}–${closeT}, giờ Việt Nam). Ca chỉ tự mở trong khung này; hoặc mở ca thủ công tại quầy.`,
      );
    }

    const openedById = await this.resolveAutoShiftOpenerUserId();
    const shiftDateYmd = formatYmdVN(new Date());
    const created = await this.prisma.shift.create({
      data: {
        openedById,
        openingCash: new Prisma.Decimal(0),
        shiftDateYmd,
      },
      select: { id: true },
    });
    return created.id;
  }

  /** User gán cho ca tự động: system.shift@… (seed) hoặc admin@restaurant.com */
  private async resolveAutoShiftOpenerUserId(): Promise<string> {
    const system = await this.prisma.user.findUnique({
      where: { email: 'system.shift@restaurant.local' },
      select: { id: true },
    });
    if (system) return system.id;
    const admin = await this.prisma.user.findFirst({
      where: { email: 'admin@restaurant.com' },
      select: { id: true },
    });
    if (admin) return admin.id;
    throw new BadRequestException(
      'Chưa có user hệ thống cho ca tự động. Chạy: npx prisma db seed',
    );
  }

  async ensureOrderNotLocked(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { shiftId: true },
    });
    if (!order?.shiftId) return;
    const shift = await this.prisma.shift.findUnique({
      where: { id: order.shiftId },
      select: { status: true },
    });
    if (shift?.status === 'CLOSED') {
      throw new BadRequestException('Ca đã đóng — không thể thay đổi đơn hàng này.');
    }
  }

  async openShift(userId: string, dto: OpenShiftDto) {
    const existing = await this.prisma.shift.findFirst({ where: { status: 'OPEN' } });
    if (existing) {
      throw new BadRequestException('Đã có ca đang mở. Kết ca hiện tại trước khi mở ca mới.');
    }
    const shiftDateYmd = formatYmdVN(new Date());
    return this.prisma.shift.create({
      data: {
        openedById: userId,
        openingCash: new Prisma.Decimal(dto.openingCash),
        shiftDateYmd,
      },
      include: {
        openedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  async addExpense(shiftId: string, userId: string, dto: AddShiftExpenseDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Không ghi chi khi ca đã đóng.');
    }
    return this.prisma.shiftExpense.create({
      data: {
        shiftId,
        amount: new Prisma.Decimal(dto.amount),
        type: dto.type as ShiftExpenseType,
        note: dto.note ?? null,
        createdById: userId,
      },
    });
  }

  private async sumCashSales(shiftId: string, openedAt: Date): Promise<Prisma.Decimal> {
    const agg = await this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        order: { shiftId },
        paidAt: { gte: openedAt },
        paymentMethod: { in: ['cash', 'Cash'] },
      },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Prisma.Decimal(0);
  }

  private async sumExpenses(shiftId: string): Promise<Prisma.Decimal> {
    const agg = await this.prisma.shiftExpense.aggregate({
      where: { shiftId },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? new Prisma.Decimal(0);
  }

  async getClosePreview(shiftId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        openedBy: { select: { id: true, fullName: true } },
        expenses: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { fullName: true } } } },
      },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Ca này đã đóng.');
    }

    const cashSales = await this.sumCashSales(shift.id, shift.openedAt);
    const expensesTotal = await this.sumExpenses(shift.id);
    const expectedCash = new Prisma.Decimal(shift.openingCash).add(cashSales).sub(expensesTotal);

    const blockingOrders = await this.prisma.order.findMany({
      where: {
        shiftId,
        NOT: {
          OR: [{ status: 'CANCELLED' }, { AND: [{ status: 'COMPLETED' }, { payment: { is: { status: 'PAID' } } }] }],
        },
      },
      select: { id: true, orderNumber: true, status: true },
      take: 50,
    });

    const pendingPayments = await this.prisma.payment.count({
      where: {
        status: 'PENDING',
        order: { shiftId },
      },
    });

    const canClose = blockingOrders.length === 0 && pendingPayments === 0;

    return {
      shift: {
        id: shift.id,
        openedAt: shift.openedAt,
        shiftDateYmd: shift.shiftDateYmd,
        openingCash: Number(shift.openingCash),
        openedBy: shift.openedBy,
      },
      cashSales: Number(cashSales),
      expensesTotal: Number(expensesTotal),
      expectedCash: Number(expectedCash),
      expenses: shift.expenses.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        type: e.type,
        note: e.note,
        createdAt: e.createdAt,
      })),
      validation: {
        canClose,
        blockingOrders,
        blockingCount: blockingOrders.length,
        pendingPayments,
        messages: [
          !canClose && blockingOrders.length
            ? `Còn ${blockingOrders.length} đơn chưa hoàn tất thanh toán hoặc chưa xử lý xong.`
            : null,
          pendingPayments ? `Còn ${pendingPayments} thanh toán đang PENDING.` : null,
        ].filter(Boolean),
      },
    };
  }

  async closeShift(shiftId: string, closedById: string, dto: CloseShiftDto, jwtClaims: string[]) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') {
      throw new BadRequestException('Ca đã được đóng trước đó.');
    }

    const preview = await this.getClosePreview(shiftId);
    if (!preview.validation.canClose) {
      throw new BadRequestException(
        preview.validation.messages.join(' ') || 'Không thể kết ca — còn đơn hoặc giao dịch treo.',
      );
    }

    const cashSales = new Prisma.Decimal(preview.cashSales);
    const expensesTotal = new Prisma.Decimal(preview.expensesTotal);
    const expectedCash = new Prisma.Decimal(preview.expectedCash);
    const actualCash = new Prisma.Decimal(dto.actualCash);
    const diff = actualCash.sub(expectedCash);
    const diffNum = Number(diff);

    if (Math.abs(diffNum) >= EPS) {
      const reason = dto.differenceReason?.trim();
      if (!reason || reason.length < 5) {
        throw new BadRequestException('Chênh lệch tiền mặt — vui lòng nhập lý do (tối thiểu 5 ký tự).');
      }
      const hasApprove = jwtClaims.includes('SHIFT_APPROVE_DIFF');
      if (!hasApprove) {
        const mgrId = dto.managerApproverId;
        if (!mgrId) {
          throw new ForbiddenException(
            'Cần quản lý duyệt chênh lệch: truyền managerApproverId hoặc dùng tài khoản có quyền SHIFT_APPROVE_DIFF.',
          );
        }
        if (mgrId === closedById) {
          throw new BadRequestException('Người duyệt không được trùng người kết ca.');
        }
        const ok = await this.userHasClaim(mgrId, 'SHIFT_APPROVE_DIFF');
        if (!ok) {
          throw new ForbiddenException('Người duyệt không có quyền SHIFT_APPROVE_DIFF.');
        }
      }
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const closed = await tx.shift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          closedAt: now,
          closedById,
          expectedCash,
          actualCash,
          cashSalesAtClose: cashSales,
          expensesAtClose: expensesTotal,
          difference: diff,
          differenceReason:
            Math.abs(diffNum) >= EPS ? (dto.differenceReason?.trim() ?? null) : null,
          approvedByManagerId:
            Math.abs(diffNum) >= EPS && jwtClaims.includes('SHIFT_APPROVE_DIFF')
              ? closedById
              : Math.abs(diffNum) >= EPS
                ? dto.managerApproverId ?? null
                : null,
        },
        include: {
          closedBy: { select: { id: true, fullName: true } },
          openedBy: { select: { id: true, fullName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'SHIFT_CLOSED',
          entityType: 'Shift',
          entityId: shiftId,
          actorUserId: closedById,
          metadata: {
            shiftDateYmd: shift.shiftDateYmd,
            openingCash: Number(shift.openingCash),
            expectedCash: Number(expectedCash),
            actualCash: dto.actualCash,
            cashSales: preview.cashSales,
            expensesTotal: preview.expensesTotal,
            difference: diffNum,
            differenceReason: dto.differenceReason ?? null,
            approvedByManagerId: closed.approvedByManagerId,
          } as Prisma.InputJsonValue,
        },
      });

      return closed;
    });

    return updated;
  }
}
