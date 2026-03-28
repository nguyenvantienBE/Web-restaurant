import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { AddShiftExpenseDto } from './dto/add-expense.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

type AuthUser = { id: string; claims: string[] };

@ApiTags('Shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Ca đang mở (hoặc null) — mọi user đăng nhập' })
  getCurrent() {
    return this.shiftsService.getOpenShift();
  }

  @Post('open')
  @RequireClaims('SHIFT_OPEN')
  @ApiOperation({ summary: 'Mở ca — nhập tiền đầu ca' })
  open(@CurrentUser() user: AuthUser, @Body() dto: OpenShiftDto) {
    return this.shiftsService.openShift(user.id, dto);
  }

  @Get(':id/close-preview')
  @RequireClaims('SHIFT_CLOSE')
  @ApiOperation({ summary: 'Xem trước kết ca + kiểm tra điều kiện' })
  closePreview(@Param('id') id: string) {
    return this.shiftsService.getClosePreview(id);
  }

  @Post(':id/expenses')
  @RequireClaims('SHIFT_EXPENSE')
  @ApiOperation({ summary: 'Ghi chi tiền mặt trong ca' })
  addExpense(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddShiftExpenseDto,
  ) {
    return this.shiftsService.addExpense(id, user.id, dto);
  }

  @Post(':id/close')
  @RequireClaims('SHIFT_CLOSE')
  @ApiOperation({ summary: 'Kết ca — kiểm kê tiền mặt, khóa đơn' })
  close(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CloseShiftDto) {
    return this.shiftsService.closeShift(id, user.id, dto, user.claims);
  }
}
