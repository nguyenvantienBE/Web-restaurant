import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDineInOrderDto, CreateTakeawayOrderDto } from './dto/create-order.dto';
import { OrderStatus, ItemStatus, TableStatus, Prisma } from '@prisma/client';
import { getPaginationParams, createPaginationMeta } from '@/common/utils/pagination.util';
import { RealtimeGateway } from '@/realtime/realtime.gateway';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => RealtimeGateway))
        private realtimeGateway: RealtimeGateway,
    ) { }

    private generateOrderNumber(): string {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        return `ORD-${dateStr}-${random}`;
    }

    async createDineInOrder(tableCode: string, createDto: CreateDineInOrderDto) {
        // Find table
        const table = await this.prisma.table.findUnique({
            where: { tableCode },
            include: {
                sessions: {
                    where: { status: 'OPEN' },
                },
            },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        // Get or create session
        let session = table.sessions[0];
        if (!session) {
            session = await this.prisma.tableSession.create({
                data: {
                    tableId: table.id,
                    status: 'OPEN',
                },
            });
        }

        // Fetch menu items to get prices
        const menuItemIds = createDto.items.map((item) => item.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: {
                id: { in: menuItemIds },
                isAvailable: true,
            },
        });

        if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException('Some menu items are not available');
        }

        const menuItemMap = Object.fromEntries(menuItems.map((item) => [item.id, item]));

        // Calculate totals
        let subtotal = 0;
        const orderItems = createDto.items.map((item) => {
            const menuItem = menuItemMap[item.menuItemId];
            const itemSubtotal = Number(menuItem.price) * item.quantity;
            subtotal += itemSubtotal;

            return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: menuItem.price,
                subtotal: new Prisma.Decimal(itemSubtotal),
                notes: item.notes,
                status: 'NEW' as ItemStatus,
            };
        });

        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        // Create order
        const order = await this.prisma.order.create({
            data: {
                orderNumber: this.generateOrderNumber(),
                type: 'DINE_IN',
                status: 'NEW',
                sessionId: session.id,
                subtotal: new Prisma.Decimal(subtotal),
                tax: new Prisma.Decimal(tax),
                total: new Prisma.Decimal(total),
                notes: createDto.notes,
                orderItems: {
                    create: orderItems,
                },
            },
            include: {
                orderItems: {
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
        });

        // Update table status to ORDERING
        await this.prisma.table.update({
            where: { id: table.id },
            data: { status: 'ORDERING' },
        });

        // Emit real-time event
        this.realtimeGateway.emitOrderNew(order);

        return order;
    }

    async createTakeawayOrder(createDto: CreateTakeawayOrderDto) {
        // Fetch menu items to get prices
        const menuItemIds = createDto.items.map((item) => item.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: {
                id: { in: menuItemIds },
                isAvailable: true,
            },
        });

        if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException('Some menu items are not available');
        }

        const menuItemMap = Object.fromEntries(menuItems.map((item) => [item.id, item]));

        // Calculate totals
        let subtotal = 0;
        const orderItems = createDto.items.map((item) => {
            const menuItem = menuItemMap[item.menuItemId];
            const itemSubtotal = Number(menuItem.price) * item.quantity;
            subtotal += itemSubtotal;

            return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: menuItem.price,
                subtotal: new Prisma.Decimal(itemSubtotal),
                notes: item.notes,
                status: 'NEW' as ItemStatus,
            };
        });

        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        // Create order
        const order = await this.prisma.order.create({
            data: {
                orderNumber: this.generateOrderNumber(),
                type: 'TAKEAWAY',
                status: 'NEW',
                subtotal: new Prisma.Decimal(subtotal),
                tax: new Prisma.Decimal(tax),
                total: new Prisma.Decimal(total),
                notes: createDto.notes,
                orderItems: {
                    create: orderItems,
                },
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
            },
        });

        // Emit real-time event
        this.realtimeGateway.emitOrderNew(order);

        return order;
    }

    async findAll(page = 1, limit = 20, status?: OrderStatus) {
        const { skip, take } = getPaginationParams(page, limit);

        const where: any = {};
        if (status) where.status = status;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take,
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                    session: {
                        include: {
                            table: true,
                        },
                    },
                    confirmedBy: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            meta: createPaginationMeta(page, limit, total),
        };
    }

    async findOne(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
                session: {
                    include: {
                        table: true,
                    },
                },
                confirmedBy: {
                    select: { id: true, fullName: true, email: true },
                },
                payment: true,
                invoice: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async confirm(id: string, userId: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== 'NEW') {
            throw new BadRequestException('Order is not in NEW status');
        }

        const confirmed = await this.prisma.order.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                confirmedById: userId,
            },
            include: {
                orderItems: {
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
        });

        // Emit kitchen ticket event
        this.realtimeGateway.emitOrderConfirmed(confirmed);

        return confirmed;
    }

    async cancel(id: string) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const cancelled = await this.prisma.$transaction(async (tx) => {
            // Cancel all order items
            await tx.orderItem.updateMany({
                where: { orderId: id },
                data: { status: 'CANCELLED' },
            });

            // Cancel order
            return tx.order.update({
                where: { id },
                data: { status: 'CANCELLED' },
                include: {
                    orderItems: true,
                    session: {
                        include: {
                            table: true,
                        },
                    },
                },
            });
        });

        // Emit cancellation event
        this.realtimeGateway.emitOrderCancelled(cancelled);

        return cancelled;
    }

    async updateItemStatus(itemId: string, status: ItemStatus) {
        const item = await this.prisma.orderItem.findUnique({
            where: { id: itemId },
            include: { order: true },
        });

        if (!item) {
            throw new NotFoundException('Order item not found');
        }

        // Update item
        const updated = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status },
        });

        // Check all items in the order and update table status
        const allItems = await this.prisma.orderItem.findMany({
            where: { orderId: item.orderId },
        });

        const hasNewOrCooking = allItems.some(
            (i) => i.status === 'NEW' || i.status === 'COOKING',
        );
        const hasReady = allItems.some((i) => i.status === 'READY');
        const allServed = allItems.every((i) => i.status === 'SERVED' || i.status === 'CANCELLED');

        // Update table status if dine-in
        if (item.order.sessionId) {
            const session = await this.prisma.tableSession.findUnique({
                where: { id: item.order.sessionId },
                include: { table: true },
            });

            if (session) {
                let newTableStatus: TableStatus;
                if (allServed) {
                    newTableStatus = 'NEED_PAYMENT';
                } else if (hasReady || hasNewOrCooking) {
                    newTableStatus = 'SERVING';
                } else {
                    newTableStatus = 'ORDERING';
                }

                const updatedTable = await this.prisma.table.update({
                    where: { id: session.tableId },
                    data: { status: newTableStatus },
                });

                // Emit table status change
                this.realtimeGateway.emitTableStatusChanged(updatedTable);
            }
        }

        // Emit item status change
        this.realtimeGateway.emitItemStatusChanged(updated);

        return updated;
    }

    async createStaffCall(tableCode: string, reason?: string) {
        const table = await this.prisma.table.findUnique({
            where: { tableCode },
            include: {
                sessions: {
                    where: { status: 'OPEN' },
                    include: {
                        orders: {
                            where: { status: { not: 'CANCELLED' } },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        const session = table.sessions[0];
        if (!session || !session.orders[0]) {
            throw new BadRequestException('No active order for this table');
        }

        const staffCall = await this.prisma.staffCall.create({
            data: {
                orderId: session.orders[0].id,
                reason,
            },
            include: {
                order: {
                    include: {
                        session: {
                            include: {
                                table: true,
                            },
                        },
                    },
                },
            },
        });

        // Emit staff call event
        this.realtimeGateway.emitStaffCall(staffCall);

        return staffCall;
    }
}
