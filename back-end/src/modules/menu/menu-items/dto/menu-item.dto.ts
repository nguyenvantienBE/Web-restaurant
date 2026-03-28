import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const MENU_ITEM_TAG_VALUES = ['BEST_SELLER', 'RECOMMENDED', 'CHEFS_PICK', 'NEW'] as const;

export class CreateMenuItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: MENU_ITEM_TAG_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn([...MENU_ITEM_TAG_VALUES], { each: true })
  tags?: string[];
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: MENU_ITEM_TAG_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn([...MENU_ITEM_TAG_VALUES], { each: true })
  tags?: string[];
}
