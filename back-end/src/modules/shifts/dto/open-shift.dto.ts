import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ description: 'Tiền mặt đầu ca (đếm được)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingCash!: number;
}
