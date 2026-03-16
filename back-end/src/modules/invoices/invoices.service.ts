import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Note: Ethereal Email is used for testing purposes.
    // For production, configure SMTP settings in .env
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mylene.lubowitz36@ethereal.email', // Replace with real or dynamic ethereal account
        pass: '6JmVy4bKZb5qE1FwDq', // Replace with real or dynamic ethereal account
      },
    });
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INV-${dateStr}-${random}`;
  }

  async generatePdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found for invoice generation');
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc
          .fillColor('#444444')
          .fontSize(20)
          .text('RESTAURANT INVOICE', 50, 50, { align: 'center' })
          .fontSize(10)
          .text(`Order Number: ${order.orderNumber}`, 50, 80, { align: 'right' })
          .text(`Date: ${new Date().toLocaleDateString()}`, 50, 95, { align: 'right' })
          .moveDown();

        // Line
        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        // Items Header
        doc
          .fontSize(12)
          .text('Item', 50, 140)
          .text('Qty', 250, 140)
          .text('Price', 350, 140)
          .text('Subtotal', 450, 140);

        doc.moveTo(50, 160).lineTo(550, 160).stroke();

        let yPosition = 180;
        doc.fontSize(10);
        order.orderItems.forEach((item) => {
          doc
            .text(item.menuItem.name, 50, yPosition)
            .text(item.quantity.toString(), 250, yPosition)
            .text(`$${Number(item.price).toFixed(2)}`, 350, yPosition)
            .text(`$${Number(item.subtotal).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });

        // Line
        doc.moveTo(50, yPosition + 10).lineTo(550, yPosition + 10).stroke();

        // Totals
        yPosition += 30;
        doc
          .text('Subtotal:', 350, yPosition)
          .text(`$${Number(order.subtotal).toFixed(2)}`, 450, yPosition);
        
        yPosition += 20;
        doc
          .text('Tax (10%):', 350, yPosition)
          .text(`$${Number(order.tax).toFixed(2)}`, 450, yPosition);

        yPosition += 20;
        doc
          .fontSize(12)
          .text('Total:', 350, yPosition)
          .text(`$${Number(order.total).toFixed(2)}`, 450, yPosition);

        // Footer
        doc
          .fontSize(10)
          .text('Thank you for dining with us!', 50, 700, { align: 'center', width: 500 });
          
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async createAndSendInvoice(orderId: string, customerEmail: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) return;

      // 1. Generate PDF
      const pdfBuffer = await this.generatePdf(orderId);
      const invoiceNumber = this.generateInvoiceNumber();

      // 2. Save to DB
      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId,
          sentToEmail: customerEmail,
        },
      });

      // 3. Send Email
      const mailOptions = {
        from: '"Restaurant System" <noreply@restaurant.com>',
        to: customerEmail,
        subject: `Invoice for Order ${order.orderNumber}`,
        text: `Dear Customer,\n\nThank you for your order! Attached is your invoice.\n\nBest Regards,\nRestaurant Team`,
        attachments: [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invoice sent to ${customerEmail}. Message ID: ${info.messageId}`);
      if (nodemailer.getTestMessageUrl(info)) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      // Update emailSentAt
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { emailSentAt: new Date() },
      });

      return invoice;
    } catch (error) {
      this.logger.error(`Failed to send invoice for order ${orderId}: ${error.message}`);
    }
  }
}
