import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status!: ReservationStatus;
}
