import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateRestaurantSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  restaurantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  hotline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailFrom?: string;

  @ApiPropertyOptional({ description: 'Handlebars: email chi tiết (không đính PDF)' })
  @IsOptional()
  @IsString()
  emailTemplatePlain?: string;

  @ApiPropertyOptional({ description: 'Handlebars: email khi đính kèm PDF' })
  @IsOptional()
  @IsString()
  emailTemplatePdf?: string;

  @ApiPropertyOptional({ description: 'Mở cửa (HH:mm, giờ VN) — ca tự động trong khung này' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Dùng định dạng HH:mm' })
  operationsOpenTime?: string;

  @ApiPropertyOptional({ description: 'Đóng cửa (HH:mm, giờ VN)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Dùng định dạng HH:mm' })
  operationsCloseTime?: string;
}
