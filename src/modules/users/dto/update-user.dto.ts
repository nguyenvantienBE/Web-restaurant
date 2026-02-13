import { IsEmail, IsString, IsUUID, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiPropertyOptional()
    @IsUUID()
    @IsOptional()
    roleId?: string;
}
