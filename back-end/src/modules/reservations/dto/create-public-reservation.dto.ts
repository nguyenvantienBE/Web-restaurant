import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePublicReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  @IsString()
  @IsNotEmpty()
  reservationTime: string;

  @ApiPropertyOptional({ description: 'Preferred area code e.g. indoor, outdoor' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Table code e.g. T01' })
  @IsOptional()
  @IsString()
  tableCode?: string;
}
