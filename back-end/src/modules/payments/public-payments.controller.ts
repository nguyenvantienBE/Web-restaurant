import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('Payments')
@Controller()
export class PublicPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('public/tables/:tableCode/orders/:orderId/payment')
  @ApiOperation({ summary: 'Khách QR — tạo thanh toán (PENDING) khi đơn đã phục vụ xong' })
  createPublicPayment(
    @Param('tableCode') tableCode: string,
    @Param('orderId') orderId: string,
    @Body() body: { amount: number; paymentMethod?: string },
  ) {
    return this.paymentsService.createPublicPayment(
      tableCode,
      orderId,
      body.amount,
      body.paymentMethod,
    );
  }

  @Patch('public/tables/:tableCode/payments/:paymentId/confirm')
  @ApiOperation({ summary: 'Khách QR — xác nhận đã thanh toán (PAID)' })
  confirmPublicPayment(
    @Param('tableCode') tableCode: string,
    @Param('paymentId') paymentId: string,
    @Body() body?: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmPublicPayment(tableCode, paymentId, body);
  }
}
