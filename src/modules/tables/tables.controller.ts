import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
    constructor(private readonly tablesService: TablesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_CREATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create table' })
    create(@Body() createDto: CreateTableDto) {
        return this.tablesService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tables (public for display)' })
    findAll() {
        return this.tablesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get table by ID' })
    findOne(@Param('id') id: string) {
        return this.tablesService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update table' })
    update(@Param('id') id: string, @Body() updateDto: UpdateTableDto) {
        return this.tablesService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_DELETE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete table' })
    remove(@Param('id') id: string) {
        return this.tablesService.remove(id);
    }

    @Post(':id/qr')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('QR_GENERATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate QR code for table' })
    generateQR(@Param('id') id: string) {
        return this.tablesService.generateQRCode(id);
    }

    @Post(':id/sessions/open')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Open table session' })
    openSession(@Param('id') id: string, @Body() body: { guestCount?: number }) {
        return this.tablesService.openSession(id, body.guestCount);
    }

    @Post(':id/sessions/close')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Close table session' })
    closeSession(@Param('id') id: string) {
        return this.tablesService.closeSession(id);
    }

    @Post(':id/clean')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('TABLE_UPDATE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark table as cleaned' })
    markCleaned(@Param('id') id: string) {
        return this.tablesService.markCleaned(id);
    }
}
