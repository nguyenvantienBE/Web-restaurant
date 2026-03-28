import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StaffNotificationsService } from './staff-notifications.service';

@ApiTags('Staff notifications')
@Controller('staff/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffNotificationsController {
  constructor(private readonly staffNotifications: StaffNotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo nội bộ (chuông)' })
  findRecent() {
    return this.staffNotifications.findRecent(50);
  }
}
