import { Controller, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/create')
  @ApiOperation({ summary: 'Create a payment for an order' })
  // Customer can create payment, or cashier, so we might not strict RequireClaims here
  createPayment(
    @Param('orderId') orderId: string,
    @Body() body: { amount: number; paymentMethod?: string },
  ) {
    return this.paymentsService.createPayment(orderId, body.amount, body.paymentMethod);
  }

  @Patch(':id/confirm')
  @RequireClaims('PAYMENT_CONFIRM')
  @ApiOperation({ summary: 'Confirm a payment (Cashier) — tùy chọn gửi hóa đơn email' })
  confirmPayment(@Param('id') id: string, @Body() body?: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(id, body);
  }
}
