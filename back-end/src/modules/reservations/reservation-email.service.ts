import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** Email khách — khi manager duyệt (CONFIRMED), chỉ gửi nếu khách có email lúc đặt */
export type ApprovedReservationEmailPayload = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  confirmationCode: string;
  reservationTime: Date;
  guestCount: number;
  tableAreaLabel: string;
  /** Mã bàn mong muốn hoặc thông báo chưa chọn */
  tableCodeLabel: string;
  /** Ghi chú (đã tách prefix khu vực) */
  specialRequest: string;
  /** Ghi chú đầy đủ trong DB (có dòng khu vực nếu có) */
  notesFullRaw: string;
};

/** Email manager — khi có đơn đặt bàn mới */
export type NewReservationManagerPayload = {
  confirmationCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  reservationTime: Date;
  guestCount: number;
  tableAreaLabel: string;
  tableCodeLabel: string;
  specialRequestStripped: string;
  notesFullRaw: string;
};

/**
 * SMTP + nội dung mail. Thông tin nhà hàng: RESTAURANT_* trong cấu hình (ConfigService).
 */
@Injectable()
export class ReservationEmailService {
  private readonly logger = new Logger(ReservationEmailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('smtp.host');
    const user = this.config.get<string>('smtp.user');
    const rawPass = this.config.get<string>('smtp.pass');
    const pass = rawPass?.replace(/\s/g, '') ?? '';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('smtp.port') || 587,
        secure: this.config.get<boolean>('smtp.secure') === true,
        auth: { user, pass },
      });
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP chưa cấu hình (SMTP_HOST / SMTP_USER / SMTP_PASS). Email không gửi.',
      );
    }
  }

  /** Khách: form xác nhận đặt bàn đã duyệt (theo template + đủ phiếu) */
  async notifyApprovedGuest(payload: ApprovedReservationEmailPayload): Promise<void> {
    const email = payload.customerEmail?.trim();
    if (!email) {
      this.logger.warn('Khách không có email — bỏ qua mail xác nhận sau duyệt');
      return;
    }

    if (!this.transporter) {
      this.logger.warn(`[email] Chưa cấu SMTP → ${email}`);
      return;
    }

    const from = this.config.get<string>('smtp.from') || this.config.get<string>('smtp.user');
    const vars = this.buildApprovedGuestVars(payload);
    const restaurantName = vars.restaurant_name;

    const subject = `Đặt bàn đã được xác nhận — ${restaurantName}`;

    const html = this.applyVars(
      RESERVATION_APPROVED_HTML,
      this.escapeUserFieldsForHtml(vars, APPROVED_GUEST_ESCAPE_KEYS),
    );
    const text = this.applyVars(RESERVATION_APPROVED_TEXT, vars);

    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Đã gửi email xác nhận đặt bàn tới khách ${email}`);
    } catch (err) {
      this.logger.error(
        `Gửi email khách thất bại: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Manager/Admin: phiếu đặt bàn mới (copy thông tin user gửi) */
  async notifyManagersNewReservation(
    payload: NewReservationManagerPayload,
    managerEmails: string[],
  ): Promise<void> {
    if (!managerEmails.length || !this.transporter) {
      if (!this.transporter) {
        this.logger.warn('Chưa cấu SMTP — không gửi mail cho manager');
      }
      return;
    }

    const from = this.config.get<string>('smtp.from') || this.config.get<string>('smtp.user');
    const restaurant = this.getRestaurantBlock();
    const subject = `[${restaurant.name}] Đặt bàn mới — ${payload.confirmationCode} — ${payload.customerName}`;

    const vars = this.buildManagerNewVars(payload);
    const html = this.applyVars(
      MANAGER_NEW_RESERVATION_HTML,
      this.escapeUserFieldsForHtml(vars, MANAGER_NEW_ESCAPE_KEYS),
    );
    const text = this.applyVars(MANAGER_NEW_RESERVATION_TEXT, vars);

    for (const to of managerEmails) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        this.logger.log(`Đã gửi thông báo đặt bàn mới tới manager ${to}`);
      } catch (err) {
        this.logger.error(
          `Gửi mail manager ${to} thất bại: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private getRestaurantBlock() {
    const r = this.config.get<{
      name: string;
      phone: string;
      website: string;
      address: string;
      arrivalBufferMinutes: number;
      cancelLimitHours: number;
    }>('restaurant');
    return {
      name: r?.name ?? 'The Albion',
      phone: (r?.phone ?? '').trim() || '—',
      website: (r?.website ?? '').trim() || '—',
      address: (r?.address ?? '').trim() || '—',
      arrivalBufferMinutes: Number.isFinite(r?.arrivalBufferMinutes)
        ? r!.arrivalBufferMinutes
        : 15,
      cancelLimitHours: Number.isFinite(r?.cancelLimitHours) ? r!.cancelLimitHours : 24,
    };
  }

  private buildApprovedGuestVars(p: ApprovedReservationEmailPayload): Record<string, string> {
    const restaurant = this.getRestaurantBlock();
    return {
      customer_name: p.customerName,
      customer_phone: (p.customerPhone ?? '').trim() || '—',
      guest_email: (p.customerEmail ?? '').trim() || '—',
      restaurant_name: restaurant.name,
      reservation_date: formatDateLongVi(p.reservationTime),
      reservation_time: formatTimeOnlyVi(p.reservationTime),
      number_of_guests: String(p.guestCount),
      table_area: p.tableAreaLabel,
      table_code: p.tableCodeLabel,
      special_request: p.specialRequest.trim() || 'Không có',
      notes_full: p.notesFullRaw.trim() || 'Không có',
      arrival_buffer: String(restaurant.arrivalBufferMinutes),
      cancel_time_limit: `${restaurant.cancelLimitHours} giờ`,
      restaurant_phone: restaurant.phone,
      restaurant_website: restaurant.website,
      restaurant_address: restaurant.address,
      confirmation_code: p.confirmationCode,
    };
  }

  private buildManagerNewVars(p: NewReservationManagerPayload): Record<string, string> {
    const restaurant = this.getRestaurantBlock();
    const frontendRaw = this.config.get<string>('frontend.url') || 'http://localhost:3001';
    const frontendBase = frontendRaw.split(',')[0].trim();
    const manageUrl = `${frontendBase.replace(/\/$/, '')}/manager/reservations`;

    return {
      restaurant_name: restaurant.name,
      confirmation_code: p.confirmationCode,
      customer_name: p.customerName,
      customer_phone: (p.customerPhone ?? '').trim() || '—',
      guest_email: (p.customerEmail ?? '').trim() || '—',
      reservation_date: formatDateLongVi(p.reservationTime),
      reservation_time: formatTimeOnlyVi(p.reservationTime),
      number_of_guests: String(p.guestCount),
      table_area: p.tableAreaLabel,
      table_code: p.tableCodeLabel,
      special_request: p.specialRequestStripped.trim() || 'Không có',
      notes_full: p.notesFullRaw.trim() || 'Không có',
      manage_url: manageUrl,
      restaurant_phone: restaurant.phone,
      restaurant_address: restaurant.address,
    };
  }

  private applyVars(template: string, vars: Record<string, string>): string {
    let out = template;
    for (const [key, val] of Object.entries(vars)) {
      out = out.split(`{{${key}}}`).join(val);
    }
    return out;
  }

  private escapeUserFieldsForHtml(
    vars: Record<string, string>,
    keys: readonly string[],
  ): Record<string, string> {
    const out = { ...vars };
    for (const k of keys) {
      if (out[k]) out[k] = escapeHtml(out[k]);
    }
    return out;
  }
}

const APPROVED_GUEST_ESCAPE_KEYS = [
  'customer_name',
  'customer_phone',
  'guest_email',
  'table_area',
  'table_code',
  'special_request',
  'notes_full',
] as const;

const MANAGER_NEW_ESCAPE_KEYS = [
  'customer_name',
  'customer_phone',
  'guest_email',
  'table_area',
  'table_code',
  'special_request',
  'notes_full',
] as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateLongVi(d: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function formatTimeOnlyVi(d: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

const RESERVATION_APPROVED_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.65; max-width: 640px; margin: 0 auto; padding: 16px;">
<p>Xin chào <strong>{{customer_name}}</strong>,</p>
<p>Cảm ơn bạn đã đặt bàn tại <strong>{{restaurant_name}}</strong>. Chúng tôi xin xác nhận thông tin đặt chỗ của bạn như sau:</p>
<p style="margin: 12px 0;">
<strong>🎫 Mã phiếu:</strong> <code style="font-size: 1.05em; letter-spacing: 0.05em;">{{confirmation_code}}</code><br/>
<strong>📧 Email:</strong> {{guest_email}}<br/>
<strong>📞 Điện thoại:</strong> {{customer_phone}}<br/>
<strong>📅 Ngày:</strong> {{reservation_date}}<br/>
<strong>⏰ Thời gian:</strong> {{reservation_time}}<br/>
<strong>👥 Số khách:</strong> {{number_of_guests}} người<br/>
<strong>📍 Khu vực mong muốn:</strong> {{table_area}}<br/>
<strong>🪑 Bàn (nếu đã chọn):</strong> {{table_code}}<br/>
<strong>📝 Ghi chú (nội dung):</strong> {{special_request}}<br/>
<strong>📋 Ghi chú đầy đủ (hệ thống):</strong> {{notes_full}}
</p>
<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
<p style="font-weight: 600;">🔔 Lưu ý quan trọng:</p>
<ul style="margin: 8px 0 16px 20px; padding: 0;">
<li>Vui lòng đến đúng giờ hoặc trước <strong>{{arrival_buffer}} phút</strong> để chúng tôi phục vụ tốt nhất.</li>
<li>Nếu bạn cần thay đổi hoặc hủy đặt bàn, vui lòng liên hệ trước <strong>{{cancel_time_limit}}</strong>.</li>
</ul>
<p>
<strong>📞 Hotline:</strong> {{restaurant_phone}}<br/>
<strong>🌐 Website:</strong> {{restaurant_website}}<br/>
<strong>📍 Địa chỉ:</strong> {{restaurant_address}}
</p>
<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
<p>Chúng tôi rất mong được phục vụ bạn tại <strong>{{restaurant_name}}</strong>!</p>
<p>Trân trọng,<br/><strong>{{restaurant_name}} Team</strong></p>
</body>
</html>`;

const RESERVATION_APPROVED_TEXT = `Xin chào {{customer_name}},

Cảm ơn bạn đã đặt bàn tại {{restaurant_name}}. Chúng tôi xin xác nhận thông tin đặt chỗ của bạn như sau:

🎫 Mã phiếu: {{confirmation_code}}
📧 Email: {{guest_email}}
📞 Điện thoại: {{customer_phone}}
📅 Ngày: {{reservation_date}}
⏰ Thời gian: {{reservation_time}}
👥 Số khách: {{number_of_guests}} người
📍 Khu vực mong muốn: {{table_area}}
🪑 Bàn (nếu đã chọn): {{table_code}}
📝 Ghi chú (nội dung): {{special_request}}
📋 Ghi chú đầy đủ (hệ thống): {{notes_full}}

---

🔔 Lưu ý quan trọng:

* Vui lòng đến đúng giờ hoặc trước {{arrival_buffer}} phút để chúng tôi phục vụ tốt nhất.
* Nếu bạn cần thay đổi hoặc hủy đặt bàn, vui lòng liên hệ trước {{cancel_time_limit}}.

📞 Hotline: {{restaurant_phone}}
🌐 Website: {{restaurant_website}}
📍 Địa chỉ: {{restaurant_address}}

---

Chúng tôi rất mong được phục vụ bạn tại {{restaurant_name}}!

Trân trọng,
{{restaurant_name}} Team`;

const MANAGER_NEW_RESERVATION_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 16px;">
<p><strong>{{restaurant_name}}</strong> — có <strong>đặt bàn mới</strong> cần xử lý.</p>
<p style="background:#f8f8f8;padding:12px;border-radius:8px;">
<strong>🎫 Mã phiếu:</strong> {{confirmation_code}}<br/>
<strong>👤 Họ tên:</strong> {{customer_name}}<br/>
<strong>📞 SĐT:</strong> {{customer_phone}}<br/>
<strong>📧 Email khách:</strong> {{guest_email}}<br/>
<strong>📅 Ngày:</strong> {{reservation_date}}<br/>
<strong>⏰ Giờ:</strong> {{reservation_time}}<br/>
<strong>👥 Số khách:</strong> {{number_of_guests}}<br/>
<strong>📍 Khu vực:</strong> {{table_area}}<br/>
<strong>🪑 Bàn mong muốn:</strong> {{table_code}}<br/>
<strong>📝 Ghi chú (rút gọn):</strong> {{special_request}}<br/>
<strong>📋 Ghi chú đầy đủ:</strong> {{notes_full}}
</p>
<p>👉 <a href="{{manage_url}}">Mở trang quản lý đặt bàn</a></p>
<p style="font-size:12px;color:#666;">Hotline: {{restaurant_phone}} · {{restaurant_address}}</p>
</body>
</html>`;

const MANAGER_NEW_RESERVATION_TEXT = `[{{restaurant_name}}] Đặt bàn mới

Mã phiếu: {{confirmation_code}}
Họ tên: {{customer_name}}
SĐT: {{customer_phone}}
Email khách: {{guest_email}}
Ngày: {{reservation_date}} · Giờ: {{reservation_time}}
Số khách: {{number_of_guests}}
Khu vực: {{table_area}}
Bàn mong muốn: {{table_code}}
Ghi chú (rút gọn): {{special_request}}
Ghi chú đầy đủ: {{notes_full}}

Quản lý: {{manage_url}}
Hotline: {{restaurant_phone}} · {{restaurant_address}}
`;
