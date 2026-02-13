import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateCategoryDto) {
        return this.prisma.category.create({
            data: createDto,
        });
    }

    async findAll(activeOnly = false) {
        const where = activeOnly ? { isActive: true } : {};

        return this.prisma.category.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: { menuItems: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                menuItems: {
                    where: { isAvailable: true },
                    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async update(id: string, updateDto: UpdateCategoryDto) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return this.prisma.category.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return this.prisma.category.delete({ where: { id } });
    }
}
