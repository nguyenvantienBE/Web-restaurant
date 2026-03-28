import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import { InvoicesService } from '../invoices/invoices.service';
import { ShiftsService } from '../shifts/shifts.service';
import type { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGateway))
    private realtimeGateway: RealtimeGateway,
    private invoicesService: InvoicesService,
    private shiftsService: ShiftsService,
  ) {}

  /** Đảm bảo đơn thuộc đúng bàn (API công khai). */
  private async assertDineInOrderOnTable(orderId: string, tableCode: string) {
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
    return order;
  }

  /** Khách tự tạo thanh toán (QR) — cùng logic createPayment sau khi kiểm tra bàn. */
  async createPublicPayment(
    tableCode: string,
    orderId: string,
    amount: number,
    paymentMethod?: string,
  ) {
    await this.assertDineInOrderOnTable(orderId, tableCode);
    return this.createPayment(orderId, amount, paymentMethod);
  }

  /** Khách tự xác nhận đã trả tiền (QR). */
  async confirmPublicPayment(
    tableCode: string,
    paymentId: string,
    body?: ConfirmPaymentDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { session: { include: { table: true } } } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    const code = payment.order.session?.table?.tableCode;
    if (!code || code !== tableCode) {
      throw new BadRequestException('Mã bàn không khớp với thanh toán');
    }
    return this.confirmPayment(paymentId, body);
  }

  async createPayment(orderId: string, amount: number, paymentMethod?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.shiftsService.ensureOrderNotLocked(orderId);

    if (order.status !== 'SERVED') {
      throw new BadRequestException('Order is not ready for payment');
    }

    if (order.payment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        paymentMethod: paymentMethod || 'cash',
        status: 'PENDING',
      },
    });

    return payment;
  }

  async confirmPayment(id: string, body?: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.shiftsService.ensureOrderNotLocked(payment.orderId);

    if (payment.status === 'PAID') {
      throw new BadRequestException('Payment is already paid');
    }

    const customerEmail = body?.customerEmail?.trim();
    const invoiceMode = body?.invoiceMode;
    const customerName = body?.customerName?.trim() || 'Quý khách';

    if (
      (invoiceMode === 'email_plain' || invoiceMode === 'email_pdf') &&
      !customerEmail
    ) {
      throw new BadRequestException('Cần email khách để gửi hóa đơn điện tử.');
    }

    const confirmedPayment = await this.prisma.$transaction(async (tx) => {
      // Update Payment Status
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'COMPLETED' },
      });

      // If dine-in, close session and update table status
      if (payment.order.sessionId) {
        await tx.tableSession.update({
          where: { id: payment.order.sessionId },
          data: {
            status: 'CLOSED',
            endTime: new Date(),
          },
        });

        const session = await tx.tableSession.findUnique({
          where: { id: payment.order.sessionId },
        });

        let updatedTable = null;
        if (session) {
          updatedTable = await tx.table.update({
            where: { id: session.tableId },
            data: { status: 'NEED_CLEAN' },
          });
        }
        return { updatedPayment, updatedTable };
      }

      return { updatedPayment, updatedTable: null };
    });

    // Fire off events after transaction success
    this.realtimeGateway.emitPaymentCompleted(confirmedPayment.updatedPayment);
    if (confirmedPayment.updatedTable) {
      this.realtimeGateway.emitTableStatusChanged(confirmedPayment.updatedTable);
    }

    const orderId = confirmedPayment.updatedPayment.orderId;
    const paid = confirmedPayment.updatedPayment;

    const sendPlain = invoiceMode === 'email_plain' && customerEmail;
    const sendPdfMail = invoiceMode === 'email_pdf' && customerEmail;
    const legacyEmail = !invoiceMode && customerEmail;

    if (sendPlain) {
      this.invoicesService
        .sendInvoiceEmail(orderId, customerEmail!, 'plain', paid, customerName)
        .catch((err) => console.error('Invoice email:', err));
    } else if (sendPdfMail || legacyEmail) {
      this.invoicesService
        .sendInvoiceEmail(orderId, customerEmail!, 'pdf', paid, customerName)
        .catch((err) => console.error('Invoice email:', err));
    }

    return confirmedPayment.updatedPayment;
  }
}
