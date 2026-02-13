import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ClaimsGuard } from '@/common/guards/claims.guard';
import { RequireClaims } from '@/common/decorators/claims.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { getPaginationParams, createPaginationMeta } from '@/common/utils/pagination.util';

@ApiTags('Kitchen')
@Controller('kitchen')
@UseGuards(JwtAuthGuard, ClaimsGuard)
@ApiBearerAuth()
export class KitchenController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('tickets')
    @RequireClaims('KITCHEN_TICKET_READ')
    @ApiOperation({ summary: 'Get kitchen tickets (orders with items to cook)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async getTickets(@Query('page') page?: string, @Query('limit') limit?: string) {
        const { skip, take } = getPaginationParams(Number(page) || 1, Number(limit) || 20);

        // Get orders that are confirmed and have items not yet ready
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
                    orderItems: {
                        some: {
                            status: { in: ['NEW', 'COOKING'] },
                        },
                    },
                },
                skip,
                take,
                include: {
                    orderItems: {
                        where: {
                            status: { in: ['NEW', 'COOKING', 'READY'] },
                        },
                        include: {
                            menuItem: true,
                        },
                    },
                    session: {
                        include: {
                            table: true,
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.order.count({
                where: {
                    status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
                    orderItems: {
                        some: {
                            status: { in: ['NEW', 'COOKING'] },
                        },
                    },
                },
            }),
        ]);

        return {
            data: orders,
            meta: createPaginationMeta(Number(page) || 1, Number(limit) || 20, total),
        };
    }

    @Patch('order-items/:id/cooking')
    @RequireClaims('ITEM_COOK_UPDATE')
    @ApiOperation({ summary: 'Mark item as cooking' })
    async markCooking(@Param('id') id: string) {
        return this.ordersService.updateItemStatus(id, 'COOKING');
    }

    @Patch('order-items/:id/ready')
    @RequireClaims('ITEM_COOK_UPDATE')
    @ApiOperation({ summary: 'Mark item as ready' })
    async markReady(@Param('id') id: string) {
        return this.ordersService.updateItemStatus(id, 'READY');
    }
}
