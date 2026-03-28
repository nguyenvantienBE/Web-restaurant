import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CloseShiftDto {
  @ApiProperty({ description: 'Tiền mặt đếm thực tế trong két' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualCash!: number;

  @ApiPropertyOptional({ description: 'Bắt buộc khi chênh lệch ≠ 0' })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Lý do chênh lệch tối thiểu 5 ký tự' })
  differenceReason?: string;

  /** Bắt buộc khi chênh lệch và user hiện tại không có SHIFT_APPROVE_DIFF */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerApproverId?: string;
}
