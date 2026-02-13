import { IsArray, IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    menuItemId: string;

    @ApiProperty()
    @IsNotEmpty()
    quantity: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateDineInOrderDto {
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateTakeawayOrderDto {
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;
}
