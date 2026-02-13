import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCategoryDto {
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
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
