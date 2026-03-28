import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftExpenseType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddShiftExpenseDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: ShiftExpenseType })
  @IsEnum(ShiftExpenseType)
  type!: ShiftExpenseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
