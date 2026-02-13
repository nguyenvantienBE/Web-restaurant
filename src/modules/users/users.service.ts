import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { getPaginationParams, createPaginationMeta } from '@/common/utils/pagination.util';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        // Check if email already exists
        const existing = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existing) {
            throw new ConflictException('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
            include: {
                role: true,
            },
        });

        // Exclude password from response
        const { password, ...result } = user;
        return result;
    }

    async findAll(page = 1, limit = 10) {
        const { skip, take } = getPaginationParams(page, limit);

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take,
                include: {
                    role: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.user.count(),
        ]);

        // Exclude passwords
        const sanitizedUsers = users.map(({ password, ...user }) => user);

        return {
            data: sanitizedUsers,
            meta: createPaginationMeta(page, limit, total),
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
                userPermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...result } = user;
        return result;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (updateUserDto.password) {
            hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...updateUserDto,
                ...(hashedPassword && { password: hashedPassword }),
            },
            include: {
                role: true,
            },
        });

        const { password, ...result } = updated;
        return result;
    }

    async disable(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        const { password, ...result } = updated;
        return result;
    }
}
