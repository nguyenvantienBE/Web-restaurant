import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    roleId: string;
}
