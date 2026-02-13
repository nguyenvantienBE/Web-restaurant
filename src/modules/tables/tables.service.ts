import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateTableDto) {
        return this.prisma.table.create({
            data: createDto,
        });
    }

    async findAll() {
        return this.prisma.table.findMany({
            where: { isActive: true },
            orderBy: { tableCode: 'asc' },
            include: {
                sessions: {
                    where: { status: 'OPEN' },
                    include: {
                        orders: {
                            include: {
                                orderItems: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const table = await this.prisma.table.findUnique({
            where: { id },
            include: {
                sessions: {
                    where: { status: 'OPEN' },
                    include: {
                        orders: {
                            include: {
                                orderItems: true,
                            },
                        },
                    },
                },
            },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return table;
    }

    async findByCode(tableCode: string) {
        const table = await this.prisma.table.findUnique({
            where: { tableCode },
            include: {
                sessions: {
                    where: { status: 'OPEN' },
                    include: {
                        orders: true,
                    },
                },
            },
        });

        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return table;
    }

    async update(id: string, updateDto: UpdateTableDto) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return this.prisma.table.update({
            where: { id },
            data: updateDto,
        });
    }

    async updateStatus(id: string, status: TableStatus) {
        return this.prisma.table.update({
            where: { id },
            data: { status },
        });
    }

    async remove(id: string) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return this.prisma.table.delete({ where: { id } });
    }

    async generateQRCode(id: string) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        // Generate QR code as data URL
        const qrData = `${process.env.FRONTEND_URL}/tables/${table.tableCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        // Update table with QR code
        const updated = await this.prisma.table.update({
            where: { id },
            data: { qrCode: qrCodeDataUrl },
        });

        return {
            tableCode: updated.tableCode,
            qrCode: qrCodeDataUrl,
        };
    }

    async openSession(id: string, guestCount?: number) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        // Check if there's already an open session
        const existingSession = await this.prisma.tableSession.findFirst({
            where: {
                tableId: id,
                status: 'OPEN',
            },
        });

        if (existingSession) {
            throw new BadRequestException('Table already has an open session');
        }

        // Create new session and update table status
        const session = await this.prisma.tableSession.create({
            data: {
                tableId: id,
                guestCount,
                status: 'OPEN',
            },
        });

        // Update table status to SEATED
        await this.updateStatus(id, 'SEATED');

        return session;
    }

    async closeSession(id: string) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        // Find open session
        const session = await this.prisma.tableSession.findFirst({
            where: {
                tableId: id,
                status: 'OPEN',
            },
        });

        if (!session) {
            throw new BadRequestException('No open session found');
        }

        // Close session
        const closed = await this.prisma.tableSession.update({
            where: { id: session.id },
            data: {
                status: 'CLOSED',
                endTime: new Date(),
            },
        });

        // Update table status to NEED_CLEAN
        await this.updateStatus(id, 'NEED_CLEAN');

        return closed;
    }

    async markCleaned(id: string) {
        const table = await this.prisma.table.findUnique({ where: { id } });
        if (!table) {
            throw new NotFoundException('Table not found');
        }

        return this.updateStatus(id, 'EMPTY');
    }
}
