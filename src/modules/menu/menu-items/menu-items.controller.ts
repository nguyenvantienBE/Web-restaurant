import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Menu Items')
@Controller('menu-items')
export class MenuItemsController {
    constructor(private readonly menuItemsService: MenuItemsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('MENU_CREATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create menu item' })
    create(@Body() createDto: CreateMenuItemDto) {
        return this.menuItemsService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all menu items (public)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'availableOnly', required: false })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('categoryId') categoryId?: string,
        @Query('availableOnly') availableOnly?: string,
    ) {
        return this.menuItemsService.findAll(
            Number(page) || 1,
            Number(limit) || 50,
            categoryId,
            availableOnly === 'true',
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get menu item by ID (public)' })
    findOne(@Param('id') id: string) {
        return this.menuItemsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('MENU_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update menu item' })
    update(@Param('id') id: string, @Body() updateDto: UpdateMenuItemDto) {
        return this.menuItemsService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('MENU_DELETE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete menu item' })
    remove(@Param('id') id: string) {
        return this.menuItemsService.remove(id);
    }
}
