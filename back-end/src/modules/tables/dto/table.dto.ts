import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tableCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTableDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tableName?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: TableStatus })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;
}
