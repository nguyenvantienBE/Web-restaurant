import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @RequireClaims('USER_CREATE')
    @ApiOperation({ summary: 'Create user' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @RequireClaims('USER_READ')
    @ApiOperation({ summary: 'Get all users' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.usersService.findAll(Number(page) || 1, Number(limit) || 10);
    }

    @Get(':id')
    @RequireClaims('USER_READ')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @RequireClaims('USER_UPDATE')
    @ApiOperation({ summary: 'Update user' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(':id/disable')
    @RequireClaims('USER_DISABLE')
    @ApiOperation({ summary: 'Disable user' })
    disable(@Param('id') id: string) {
        return this.usersService.disable(id);
    }
}
