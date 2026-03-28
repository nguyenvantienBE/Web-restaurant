import { BadRequestException, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, DashboardMode } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Báo cáo theo ngày / tuần / tháng (mốc VN)' })
  @ApiQuery({ name: 'mode', enum: ['day', 'week', 'month'], required: true })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD, mặc định hôm nay (VN)' })
  getDashboard(@Query('mode') mode?: string, @Query('date') date?: string) {
    const m = (['day', 'week', 'month'].includes(mode || '')
      ? mode
      : 'week') as DashboardMode;
    return this.reportsService.getDashboard(date, m);
  }

  @Get('revenue')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Get revenue statistics (legacy)' })
  @ApiQuery({ name: 'period', enum: ['today', 'day', 'week', 'month'], required: false })
  getRevenue(@Query('period') period?: 'today' | 'day' | 'week' | 'month') {
    return this.reportsService.getRevenue(period || 'today');
  }

  @Get('top-items')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Top món (toàn thời gian — legacy)' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getTopItems(@Query('limit') limit?: string) {
    return this.reportsService.getTopSellingItems(limit ? parseInt(limit, 10) : 5);
  }

  @Get('shift-summary')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Tổng kết ca theo ngày (đọc dữ liệu, không đóng ca)' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD, mặc định hôm nay' })
  getShiftSummary(@Query('date') date?: string) {
    return this.reportsService.getShiftSummary(date);
  }

  @Post('end-shift')
  @RequireClaims('SHIFT_CLOSE')
  @ApiOperation({
    summary: 'Deprecated — dùng POST /shifts/:id/close (kết ca POS có kiểm kê tiền)',
  })
  endShift() {
    throw new BadRequestException(
      'Luồng cũ đã thay thế. Mở màn Kết ca và dùng POST /shifts/{id}/close với actualCash và kiểm tra chênh lệch.',
    );
  }
}
