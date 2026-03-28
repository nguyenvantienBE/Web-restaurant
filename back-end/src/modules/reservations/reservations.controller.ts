import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { CheckInReservationDto } from './dto/check-in-reservation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Reservations')
@Controller('public')
export class PublicReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('reservations')
  @ApiOperation({ summary: 'Guest: create table reservation (no auth)' })
  create(@Body() dto: CreatePublicReservationDto) {
    return this.reservationsService.createPublic(dto);
  }
}

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class ManagerReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @RequireClaims('RESERVATION_READ')
  @ApiOperation({ summary: 'Staff: list reservations (optional status filter)' })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) {
    return this.reservationsService.findAllForManager(status);
  }

  @Patch(':id/status')
  @RequireClaims('RESERVATION_UPDATE')
  @ApiOperation({ summary: 'Staff: update reservation status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto.status);
  }

  @Post('check-in')
  @RequireClaims('TABLE_UPDATE')
  @ApiOperation({ summary: 'Staff: check-in bằng mã đặt bàn (mở session bàn)' })
  checkIn(@Body() dto: CheckInReservationDto) {
    return this.reservationsService.checkInByCode(dto.code, dto.tableId);
  }

  @Post(':id/send-email')
  @RequireClaims('RESERVATION_UPDATE')
  @ApiOperation({ summary: 'Gửi lại email xác nhận đặt bàn tới khách' })
  sendEmailToGuest(@Param('id') id: string) {
    return this.reservationsService.sendConfirmationEmailToGuest(id);
  }
}
