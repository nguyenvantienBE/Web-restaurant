import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller()
export class PublicInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('public/tables/:tableCode/orders/:orderId/invoice.pdf')
  @ApiOperation({ summary: 'Khách QR — tải PDF hóa đơn (không JWT)' })
  async orderPdf(
    @Param('tableCode') tableCode: string,
    @Param('orderId') orderId: string,
  ) {
    await this.invoicesService.assertOrderBelongsToTable(orderId, tableCode);
    const { buffer, filename } =
      await this.invoicesService.buildOrderPdfDownload(orderId);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
