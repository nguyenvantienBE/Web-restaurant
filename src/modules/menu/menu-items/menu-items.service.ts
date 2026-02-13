import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto/menu-item.dto';
import { getPaginationParams, createPaginationMeta } from '@/common/utils/pagination.util';

@Injectable()
export class MenuItemsService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateMenuItemDto) {
        return this.prisma.menuItem.create({
            data: createDto,
            include: {
                category: true,
            },
        });
    }

    async findAll(page = 1, limit = 50, categoryId?: string, availableOnly = false) {
        const { skip, take } = getPaginationParams(page, limit);

        const where: any = {};
        if (categoryId) where.categoryId = categoryId;
        if (availableOnly) where.isAvailable = true;

        const [items, total] = await Promise.all([
            this.prisma.menuItem.findMany({
                where,
                skip,
                take,
                include: {
                    category: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.menuItem.count({ where }),
        ]);

        return {
            data: items,
            meta: createPaginationMeta(page, limit, total),
        };
    }

    async findOne(id: string) {
        const item = await this.prisma.menuItem.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        return item;
    }

    async update(id: string, updateDto: UpdateMenuItemDto) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        return this.prisma.menuItem.update({
            where: { id },
            data: updateDto,
            include: {
                category: true,
            },
        });
    }

    async remove(id: string) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item) {
            throw new NotFoundException('Menu item not found');
        }

        return this.prisma.menuItem.delete({ where: { id } });
    }
}
