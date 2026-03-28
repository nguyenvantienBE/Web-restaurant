import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInReservationDto {
  @ApiProperty({ example: 'AB12CD34' })
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  code!: string;

  /** Bắt buộc nếu đặt bàn chưa chọn bàn cụ thể */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tableId?: string;
}
