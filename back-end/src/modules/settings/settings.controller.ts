import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { SettingsService } from './settings.service';
import { UpdateRestaurantSettingsDto } from './dto/update-restaurant-settings.dto';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('restaurant')
  @RequireClaims('SETTINGS_MANAGE')
  @ApiOperation({ summary: 'Cấu hình nhà hàng & template hóa đơn (admin)' })
  getRestaurant() {
    return this.settingsService.getRestaurantSettings();
  }

  @Patch('restaurant')
  @RequireClaims('SETTINGS_MANAGE')
  @ApiOperation({ summary: 'Cập nhật cấu hình nhà hàng & template' })
  patchRestaurant(@Body() dto: UpdateRestaurantSettingsDto) {
    return this.settingsService.updateRestaurantSettings(dto);
  }
}
