import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
