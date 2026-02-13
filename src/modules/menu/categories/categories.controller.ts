import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('CATEGORY_CREATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category' })
    create(@Body() createDto: CreateCategoryDto) {
        return this.categoriesService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all categories (public)' })
    @ApiQuery({ name: 'activeOnly', required: false })
    findAll(@Query('activeOnly') activeOnly?: string) {
        return this.categoriesService.findAll(activeOnly === 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID (public)' })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('CATEGORY_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category' })
    update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
        return this.categoriesService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('CATEGORY_DELETE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category' })
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
