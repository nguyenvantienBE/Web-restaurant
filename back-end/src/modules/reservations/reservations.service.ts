import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Reservation, ReservationStatus, Table } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import { TablesService } from '@/modules/tables/tables.service';
import { StaffNotificationsService } from './staff-notifications.service';
import { ReservationEmailService } from './reservation-email.service';

const AREA_LABELS: Record<string, string> = {
  indoor: 'Trong nhà',
  outdoor: 'Ngoài trời',
  rooftop: 'Sân thượng',
  bar: 'Khu bar',
};

const LABEL_TO_AREA_KEY: Record<string, string> = {
  'Trong nhà': 'indoor',
  'Ngoài trời': 'outdoor',
  'Sân thượng': 'rooftop',
  'Khu bar': 'bar',
};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type ReservationRow = Reservation & { table?: Table | null };

export interface ReservationListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  date: string;
  time: string;
  area?: string;
  note?: string;
  status: ReservationStatus;
  confirmationCode: string;
  checkedInAt?: string;
  tableCode?: string;
  createdAt: string;
}

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
    private tables: TablesService,
    private staffNotifications: StaffNotificationsService,
    private emails: ReservationEmailService,
  ) {}

  async createPublic(dto: CreatePublicReservationDto) {
    const at = new Date(dto.reservationTime);
    if (Number.isNaN(at.getTime())) {
      throw new BadRequestException('Invalid reservation time');
    }

    let tableId: string | undefined;
    if (dto.tableCode?.trim()) {
      const code = dto.tableCode.trim();
      const table = await this.prisma.table.findFirst({
        where: {
          tableCode: { equals: code, mode: Prisma.QueryMode.insensitive },
        },
      });
      if (!table) {
        throw new BadRequestException(`Bàn "${code}" không tồn tại`);
      }
      if (!table.isActive) {
        throw new BadRequestException('Bàn này hiện không khả dụng');
      }
      tableId = table.id;
    }

    let notes = dto.notes?.trim() ?? '';
    if (dto.area?.trim()) {
      const label = AREA_LABELS[dto.area] ?? dto.area;
      const prefix = `[Khu vực mong muốn: ${label}]`;
      notes = notes ? `${prefix}\n${notes}` : prefix;
    }

    const confirmationCode = await this.generateUniqueConfirmationCode();

    const created = await this.prisma.reservation.create({
      data: {
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        customerEmail: dto.customerEmail?.trim() || null,
        guestCount: dto.guestCount,
        reservationTime: at,
        notes: notes || null,
        tableId: tableId ?? null,
        status: 'PENDING',
        confirmationCode,
      },
      include: { table: true },
    });

    const shortWhen = this.formatReservationParts(created.reservationTime);
    await this.staffNotifications.create(
      'RESERVATION_NEW',
      'Đặt bàn mới',
      `${created.customerName} · Mã ${created.confirmationCode} · ${shortWhen.date} ${shortWhen.time}`,
      {
        reservationId: created.id,
        confirmationCode: created.confirmationCode,
      },
    );

    this.realtime.emitReservationNew({
      id: created.id,
      confirmationCode: created.confirmationCode,
      customerName: created.customerName,
      reservationTime: created.reservationTime.toISOString(),
    });

    const item = this.toListItem(created);
    const managerEmails = await this.resolveManagerNotificationEmails();
    if (managerEmails.length > 0) {
      void this.emails.notifyManagersNewReservation(
        {
          confirmationCode: created.confirmationCode,
          customerName: created.customerName,
          customerPhone: created.customerPhone,
          customerEmail: created.customerEmail ?? '',
          reservationTime: created.reservationTime,
          guestCount: created.guestCount,
          tableAreaLabel: this.areaLabelViForEmail(item.area),
          tableCodeLabel: item.tableCode ?? 'Chưa chọn — nhà hàng sắp xếp',
          specialRequestStripped: item.note?.trim() ?? '',
          notesFullRaw: created.notes?.trim() || 'Không có',
        },
        managerEmails,
      );
    }

    return created;
  }

  /** Manager + Admin trong DB + MANAGER_NOTIFICATION_EMAILS trong .env (không trùng email) */
  private async resolveManagerNotificationEmails(): Promise<string[]> {
    const fromEnv =
      process.env.MANAGER_NOTIFICATION_EMAILS?.split(',').map((s) => s.trim()).filter((e) => e.includes('@')) ??
      [];
    const staff = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: ['Manager', 'Admin'] } },
      },
      select: { email: true },
    });
    const byLower = new Map<string, string>();
    for (const e of fromEnv) {
      byLower.set(e.toLowerCase(), e);
    }
    for (const u of staff) {
      byLower.set(u.email.toLowerCase(), u.email);
    }
    return [...byLower.values()];
  }

  async findAllForManager(status?: string): Promise<ReservationListItem[]> {
    const where = this.buildStatusWhere(status);
    const rows = await this.prisma.reservation.findMany({
      where,
      orderBy: { reservationTime: 'desc' },
      include: { table: true },
    });
    return rows.map((r) => this.toListItem(r));
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
  ): Promise<ReservationListItem> {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy đặt bàn');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true },
    });

    if (status === 'CONFIRMED' && existing.status === 'PENDING') {
      await this.emails.notifyApprovedGuest(this.buildGuestEmailPayload(updated));
    }

    this.realtime.emitReservationUpdated({
      id: updated.id,
      status: updated.status,
      confirmationCode: updated.confirmationCode,
    });

    return this.toListItem(updated);
  }

  /** Gửi lại email xác nhận (cùng nội dung khi duyệt) — thủ công từ quản lý */
  async sendConfirmationEmailToGuest(id: string): Promise<{ message: string }> {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
      include: { table: true },
    });
    if (!r) {
      throw new NotFoundException('Không tìm thấy đặt bàn');
    }
    if (!r.customerEmail?.trim()) {
      throw new BadRequestException('Khách chưa có email trên đơn đặt bàn');
    }
    if (r.status === 'PENDING') {
      throw new BadRequestException(
        'Chưa duyệt — vui lòng xác nhận đặt bàn trước khi gửi email xác nhận',
      );
    }
    if (r.status === 'CANCELLED') {
      throw new BadRequestException('Không gửi email cho đơn đã hủy');
    }

    await this.emails.notifyApprovedGuest(this.buildGuestEmailPayload(r));
    return { message: 'Đã gửi email tới khách' };
  }

  private buildGuestEmailPayload(r: ReservationRow) {
    const item = this.toListItem(r);
    return {
      customerEmail: r.customerEmail ?? '',
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      confirmationCode: r.confirmationCode,
      reservationTime: r.reservationTime,
      guestCount: r.guestCount,
      tableAreaLabel: this.areaLabelViForEmail(item.area),
      tableCodeLabel: item.tableCode ?? 'Chưa chọn — nhà hàng sắp xếp',
      specialRequest: item.note?.trim() ?? '',
      notesFullRaw: r.notes?.trim() || 'Không có',
    };
  }

  async checkInByCode(rawCode: string, tableIdOverride?: string) {
    const code = rawCode.trim().toUpperCase();
    const r = await this.prisma.reservation.findUnique({
      where: { confirmationCode: code },
      include: { table: true },
    });
    if (!r) {
      throw new NotFoundException('Mã đặt bàn không đúng');
    }
    if (r.status !== 'CONFIRMED') {
      if (r.status === 'COMPLETED') {
        throw new BadRequestException('Khách đã check-in rồi');
      }
      throw new BadRequestException(
        'Đặt bàn chưa được xác nhận hoặc đã hủy / vắng mặt',
      );
    }
    if (r.checkedInAt) {
      throw new BadRequestException('Khách đã check-in rồi');
    }

    if (!this.isCheckInDayAllowed(r.reservationTime)) {
      throw new BadRequestException(
        'Chỉ check-in trong ngày đặt bàn (giờ Việt Nam)',
      );
    }

    let effectiveTableId = r.tableId;
    if (r.tableId && tableIdOverride && tableIdOverride !== r.tableId) {
      throw new BadRequestException('Bàn chọn không khớp với đặt bàn');
    }
    if (!effectiveTableId) {
      if (!tableIdOverride) {
        throw new BadRequestException(
          'Đặt bàn chưa gán bàn — chọn bàn khi check-in',
        );
      }
      effectiveTableId = tableIdOverride;
    }

    const table = await this.prisma.table.findUnique({
      where: { id: effectiveTableId },
    });
    if (!table || !table.isActive) {
      throw new BadRequestException('Bàn không hợp lệ');
    }
    if (r.guestCount > table.capacity) {
      throw new BadRequestException(
        `Số khách vượt sức chứa bàn (tối đa ${table.capacity})`,
      );
    }

    await this.tables.openSession(table.id, r.guestCount);

    const done = await this.prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: 'COMPLETED',
        checkedInAt: new Date(),
        ...(r.tableId ? {} : { tableId: effectiveTableId }),
      },
      include: { table: true },
    });

    const tableFresh = await this.prisma.table.findUnique({
      where: { id: effectiveTableId },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          include: { orders: true },
        },
      },
    });
    if (tableFresh) {
      this.realtime.emitTableStatusChanged(tableFresh);
    }

    this.realtime.emitReservationUpdated({
      id: done.id,
      status: done.status,
      confirmationCode: done.confirmationCode,
    });

    return {
      message: 'Check-in thành công',
      reservation: this.toListItem(done),
      tableCode: table.tableCode,
    };
  }

  private async generateUniqueConfirmationCode(): Promise<string> {
    for (let attempt = 0; attempt < 24; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      const exists = await this.prisma.reservation.findUnique({
        where: { confirmationCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new BadRequestException('Không tạo được mã đặt bàn, thử lại sau');
  }

  private buildStatusWhere(
    status?: string,
  ): Prisma.ReservationWhereInput | undefined {
    if (!status || status === 'all') return undefined;
    const upper = status.toUpperCase();
    if (!Object.values(ReservationStatus).includes(upper as ReservationStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    return { status: upper as ReservationStatus };
  }

  private isCheckInDayAllowed(reservationTime: Date): boolean {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const resDay = fmt.format(reservationTime);
    const today = fmt.format(new Date());
    return resDay === today;
  }

  private formatReservationParts(utc: Date): { date: string; time: string } {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(utc);
    const get = (t: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === t)?.value ?? '';
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const h = get('hour');
    const min = get('minute');
    return { date: `${y}-${m}-${d}`, time: `${h}:${min}` };
  }

  private parseAreaFromNotes(notes: string | null): string | undefined {
    if (!notes) return undefined;
    const m = notes.match(/^\[Khu vực mong muốn: ([^\]]+)\]/);
    if (!m) return undefined;
    const label = m[1].trim();
    return LABEL_TO_AREA_KEY[label] ?? undefined;
  }

  private areaLabelViForEmail(areaKey: string | undefined): string {
    if (areaKey && areaKey in AREA_LABELS) {
      return AREA_LABELS[areaKey];
    }
    return 'Theo sắp xếp nhà hàng';
  }

  private stripAreaPrefixFromNotes(notes: string | null): string | undefined {
    if (!notes) return undefined;
    const m = notes.match(/^\[Khu vực mong muốn: [^\]]+\]\n?([\s\S]*)$/);
    if (m) {
      const rest = m[1].trim();
      return rest || undefined;
    }
    const t = notes.trim();
    return t || undefined;
  }

  private toListItem(r: ReservationRow): ReservationListItem {
    const { date, time } = this.formatReservationParts(r.reservationTime);
    return {
      id: r.id,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      customerEmail: r.customerEmail ?? undefined,
      partySize: r.guestCount,
      date,
      time,
      area: this.parseAreaFromNotes(r.notes),
      note: this.stripAreaPrefixFromNotes(r.notes),
      status: r.status,
      confirmationCode: r.confirmationCode,
      checkedInAt: r.checkedInAt?.toISOString(),
      tableCode: r.table?.tableCode,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
