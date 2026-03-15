import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Get revenue statistics (Manager/Admin)' })
  @ApiQuery({ name: 'period', enum: ['today', 'day', 'week', 'month'], required: false })
  getRevenue(@Query('period') period?: 'today' | 'day' | 'week' | 'month') {
    return this.reportsService.getRevenue(period || 'today');
  }

  @Get('top-items')
  @RequireClaims('REPORT_VIEW')
  @ApiOperation({ summary: 'Get top selling items (Manager/Admin)' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  getTopItems(@Query('limit') limit?: string) {
    return this.reportsService.getTopSellingItems(limit ? parseInt(limit, 10) : 5);
  }

  @Post('end-shift')
  @RequireClaims('SHIFT_CLOSE')
  @ApiOperation({ summary: 'Process end of shift and return summary (Manager)' })
  endShift() {
    return this.reportsService.endShift();
  }
}
