import { Controller, Get, Param, UseGuards, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('orders/:orderId/pdf')
  @RequireClaims('PAYMENT_CONFIRM')
  @ApiOperation({ summary: 'Xuất PDF hóa đơn (trước hoặc sau thanh toán)' })
  async orderPdf(@Param('orderId') orderId: string) {
    const { buffer, filename } = await this.invoicesService.buildOrderPdfDownload(orderId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
