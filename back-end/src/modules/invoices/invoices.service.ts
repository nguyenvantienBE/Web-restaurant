import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { SettingsService } from '../settings/settings.service';
import { ShiftsService } from '../shifts/shifts.service';
import type { Invoice, Payment } from '@prisma/client';

// pdfmake: dùng bản js/ (CommonJS). src/ là ESM — Node gặp lỗi resolve ./PDFDocument.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/js/printer').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfVfs = require('pdfmake/build/vfs_fonts');

const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

export type InvoiceEmailMode = 'none' | 'email_plain' | 'email_pdf';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private settingsService: SettingsService,
    private shiftsService: ShiftsService,
  ) {
    const host = this.config.get<string>('smtp.host');
    const user = this.config.get<string>('smtp.user');
    const pass = this.config.get<string>('smtp.pass');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('smtp.port') ?? 587,
        secure: this.config.get<boolean>('smtp.secure') ?? false,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — gửi email hóa đơn sẽ bị bỏ qua (cấu hình SMTP_* trong .env).');
    }
  }

  private formatVnd(n: number | string | { toString(): string }): string {
    const v = typeof n === 'string' ? parseFloat(n) : Number(n);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INV-${dateStr}-${random}`;
  }

  /** Khách QR: đảm bảo đơn thuộc đúng mã bàn trước khi tải PDF. */
  async assertOrderBelongsToTable(orderId: string, tableCode: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { session: { include: { table: true } } },
    });
    if (!order?.session?.table) {
      throw new BadRequestException('Đơn không gắn phiên bàn');
    }
    if (order.session.table.tableCode !== tableCode) {
      throw new BadRequestException('Mã bàn không khớp với đơn');
    }
  }

  /** Tạo hoặc lấy bản ghi hóa đơn (một đơn — một mã HĐ). */
  async getOrCreateInvoice(orderId: string): Promise<Invoice> {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;
    return this.prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: this.generateInvoiceNumber(),
      },
    });
  }

  async buildTemplateContext(orderId: string, payment: Payment | null, customerName: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { menuItem: true } },
        session: { include: { table: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const settings = await this.settingsService.getRestaurantSettings();
    const inv = await this.prisma.invoice.findUnique({ where: { orderId } });
    const items = order.orderItems.map((it) => ({
      name: it.menuItem.name,
      quantity: it.quantity,
      price: this.formatVnd(it.subtotal),
    }));

    const pm = (payment?.paymentMethod || 'cash').toLowerCase();
    const pmLabel =
      pm === 'cash' ? 'Tiền mặt' : pm === 'card' ? 'Thẻ' : pm === 'transfer' ? 'Chuyển khoản' : pm;

    return {
      customer_name: customerName || 'Quý khách',
      restaurant_name: settings.restaurantName,
      invoice_number: inv?.invoiceNumber ?? '—',
      date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      guest_count: order.session?.guestCount ?? '—',
      items,
      subtotal: this.formatVnd(order.subtotal),
      discount: 'Không có',
      tax: this.formatVnd(order.tax),
      total_amount: this.formatVnd(order.total),
      payment_method: pmLabel,
      hotline: settings.hotline || '—',
      address: settings.address || '—',
      website: settings.website || '—',
    };
  }

  async generatePdfBuffer(orderId: string): Promise<Buffer> {
    await this.shiftsService.ensureOrderNotLocked(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { menuItem: true } },
        session: { include: { table: true } },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== 'SERVED' && order.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ xuất hóa đơn khi đơn đã phục vụ xong.');
    }

    const invoice = await this.getOrCreateInvoice(orderId);
    const settings = await this.settingsService.getRestaurantSettings();
    const tableRows = order.orderItems.map((it) => [
      { text: it.menuItem.name, style: 'cell' },
      { text: String(it.quantity), style: 'cell', alignment: 'center' },
      { text: this.formatVnd(it.price), style: 'cell', alignment: 'right' },
      { text: this.formatVnd(it.subtotal), style: 'cell', alignment: 'right' },
    ]);

    const docDefinition = {
      defaultStyle: { font: 'Roboto', fontSize: 10 },
      content: [
        { text: settings.restaurantName, style: 'header', fontSize: 18, bold: true, alignment: 'center' },
        { text: 'HÓA ĐƠN THANH TOÁN', style: 'sub', fontSize: 12, alignment: 'center', margin: [0, 4, 0, 8] },
        {
          columns: [
            {
              stack: [
                { text: `Mã hóa đơn: ${invoice.invoiceNumber}`, margin: [0, 0, 0, 4] },
                { text: `Mã đơn: ${order.orderNumber}`, margin: [0, 0, 0, 4] },
                { text: `Bàn: ${order.session?.table?.tableCode ?? '—'}` },
              ],
            },
            {
              stack: [
                { text: `Ngày: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`, alignment: 'right' },
              ],
            },
          ],
        },
        { text: ' ', margin: [0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 50, 90, 90],
            body: [
              [
                { text: 'Món', style: 'tableHeader', bold: true },
                { text: 'SL', style: 'tableHeader', alignment: 'center', bold: true },
                { text: 'Đơn giá', style: 'tableHeader', alignment: 'right', bold: true },
                { text: 'Thành tiền', style: 'tableHeader', alignment: 'right', bold: true },
              ],
              ...tableRows,
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: ' ', margin: [0, 12] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 220,
              stack: [
                { text: `Tạm tính: ${this.formatVnd(order.subtotal)}`, alignment: 'right', margin: [0, 2] },
                { text: `Thuế: ${this.formatVnd(order.tax)}`, alignment: 'right', margin: [0, 2] },
                { text: `Tổng cộng: ${this.formatVnd(order.total)}`, alignment: 'right', bold: true, fontSize: 12, margin: [0, 6] },
              ],
            },
          ],
        },
        { text: ' ', margin: [0, 20] },
        {
          text: [settings.hotline ? `📞 ${settings.hotline}  ` : '', settings.address || ''].join(''),
          fontSize: 9,
          color: '#666666',
          alignment: 'center',
        },
      ],
      styles: {
        header: { color: '#333333' },
        sub: { color: '#666666' },
        cell: { margin: [2, 4] },
        tableHeader: { fillColor: '#eeeeee', margin: [4, 6] },
      },
    };

    const printer = new PdfPrinter(fonts, pdfVfs);
    const pdfDoc = await printer.createPdfKitDocument(docDefinition);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (c: Buffer) => chunks.push(c));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  /** @deprecated dùng generatePdfBuffer */
  async generatePdf(orderId: string): Promise<Buffer> {
    return this.generatePdfBuffer(orderId);
  }

  /** PDF + tên file sau khi đã gắn mã hóa đơn. */
  async buildOrderPdfDownload(orderId: string): Promise<{ buffer: Buffer; filename: string }> {
    const buffer = await this.generatePdfBuffer(orderId);
    const inv = await this.prisma.invoice.findUniqueOrThrow({ where: { orderId } });
    return { buffer, filename: `${inv.invoiceNumber}.pdf` };
  }

  private renderEmail(template: string, ctx: Record<string, unknown>): string {
    return Handlebars.compile(template)(ctx);
  }

  async sendInvoiceEmail(
    orderId: string,
    customerEmail: string,
    mode: 'plain' | 'pdf',
    payment: Payment,
    customerName: string,
  ) {
    if (!this.transporter) {
      this.logger.warn(`SMTP chưa cấu hình — bỏ qua gửi mail tới ${customerEmail}`);
      return null;
    }

    await this.getOrCreateInvoice(orderId);
    const settings = await this.settingsService.getRestaurantSettings();
    const ctx = await this.buildTemplateContext(orderId, payment, customerName);

    const pdfBuffer = mode === 'pdf' ? await this.generatePdfBuffer(orderId) : null;
    const templateStr =
      mode === 'pdf' ? settings.emailTemplatePdf : settings.emailTemplatePlain;
    const body = this.renderEmail(templateStr, ctx);

    const from = settings.emailFrom || this.config.get<string>('smtp.from') || this.config.get<string>('smtp.user');
    if (!from) {
      this.logger.warn('Không có email From — bỏ qua gửi mail');
      return null;
    }

    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { orderId },
    });

    await this.transporter.sendMail({
      from: `"${settings.restaurantName}" <${from}>`,
      to: customerEmail,
      subject:
        mode === 'pdf'
          ? `Hóa đơn ${invoice.invoiceNumber} — ${settings.restaurantName}`
          : `Hóa đơn chi tiết ${invoice.invoiceNumber} — ${settings.restaurantName}`,
      text: body,
      attachments: pdfBuffer
        ? [
            {
              filename: `${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : [],
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { sentToEmail: customerEmail, emailSentAt: new Date() },
    });

    return invoice;
  }

  async createAndSendInvoice(orderId: string, customerEmail: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order?.payment) return;
    return this.sendInvoiceEmail(orderId, customerEmail, 'pdf', order.payment, 'Quý khách');
  }
}
