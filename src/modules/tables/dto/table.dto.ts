import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
