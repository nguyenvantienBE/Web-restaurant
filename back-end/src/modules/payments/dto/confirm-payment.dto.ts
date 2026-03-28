import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  /** none | email_plain (nội dung mail) | email_pdf (mail + đính PDF) */
  @ApiPropertyOptional({ enum: ['none', 'email_plain', 'email_pdf'] })
  @IsOptional()
  @IsIn(['none', 'email_plain', 'email_pdf'])
  invoiceMode?: 'none' | 'email_plain' | 'email_pdf';
}
