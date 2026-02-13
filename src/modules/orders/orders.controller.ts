import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateDineInOrderDto, CreateTakeawayOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // ========== PUBLIC ENDPOINTS ==========
    @Post('public/tables/:tableCode/orders')
    @ApiOperation({ summary: 'Create dine-in order (customer - public)' })
    createDineInOrder(
        @Param('tableCode') tableCode: string,
        @Body() createDto: CreateDineInOrderDto,
    ) {
        return this.ordersService.createDineInOrder(tableCode, createDto);
    }

    @Post('public/takeaway/orders')
    @ApiOperation({ summary: 'Create takeaway order (customer - public)' })
    createTakeawayOrder(@Body() createDto: CreateTakeawayOrderDto) {
        return this.ordersService.createTakeawayOrder(createDto);
    }

    @Post('public/tables/:tableCode/staff-call')
    @ApiOperation({ summary: 'Call staff (customer - public)' })
    callStaff(@Param('tableCode') tableCode: string, @Body() body: { reason?: string }) {
        return this.ordersService.createStaffCall(tableCode, body.reason);
    }

    // ========== STAFF ENDPOINTS (Cashier) ==========
    @Get('orders')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('ORDER_READ')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all orders (staff)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.ordersService.findAll(
            Number(page) || 1,
            Number(limit) || 20,
            status as any,
        );
    }

    @Get('orders/:id')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('ORDER_READ')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get order by ID (staff)' })
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch('orders/:id/confirm')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('ORDER_CONFIRM')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Confirm order (cashier)' })
    confirm(@Param('id') id: string, @CurrentUser() user: any) {
        return this.ordersService.confirm(id, user.id);
    }

    @Patch('orders/:id/cancel')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('ORDER_CANCEL')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel order (cashier)' })
    cancel(@Param('id') id: string) {
        return this.ordersService.cancel(id);
    }

    @Patch('order-items/:id/served')
    @UseGuards(JwtAuthGuard, ClaimsGuard)
    @RequireClaims('ITEM_SERVE')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark item as served (cashier)' })
    markServed(@Param('id') id: string) {
        return this.ordersService.updateItemStatus(id, 'SERVED');
    }
}
