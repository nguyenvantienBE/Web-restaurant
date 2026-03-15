import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RealtimeGateway } from '@/realtime/realtime.gateway';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGateway))
    private realtimeGateway: RealtimeGateway,
    private invoicesService: InvoicesService,
  ) {}

  async createPayment(orderId: string, amount: number, paymentMethod?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

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

  async confirmPayment(id: string, customerEmail?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException('Payment is already paid');
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

    // Fire off invoice mailer asynchronously
    if (customerEmail) {
      this.invoicesService.createAndSendInvoice(confirmedPayment.updatedPayment.orderId, customerEmail)
        .catch((err) => console.error('Background Invoice Error:', err));
    }

    return confirmedPayment.updatedPayment;
  }
}
