import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }

    async login(loginDto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginDto.email },
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

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Collect claims from role permissions
        const roleClaims = user.role.rolePermissions.map((rp) => rp.permission.code);

        // Add user-specific permission overrides
        const userClaims = user.userPermissions.map((up) => up.permission.code);

        // Combine and deduplicate
        const claims = [...new Set([...roleClaims, ...userClaims])];

        const tokens = await this.generateTokens(user.id, user.email, user.role.name, claims);

        // Store refresh token
        await this.prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role.name,
                claims,
            },
            ...tokens,
        };
    }

    async refresh(refreshToken: string) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: {
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
                },
            },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = storedToken.user;

        if (!user.isActive) {
            throw new UnauthorizedException('User is not active');
        }

        // Collect claims
        const roleClaims = user.role.rolePermissions.map((rp) => rp.permission.code);
        const userClaims = user.userPermissions.map((up) => up.permission.code);
        const claims = [...new Set([...roleClaims, ...userClaims])];

        // Generate new tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role.name, claims);

        // Delete old refresh token and create new one
        await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
        await this.prisma.refreshToken.create({
            data: {
                token: tokens.refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return tokens;
    }

    async logout(refreshToken: string) {
        await this.prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
        return { message: 'Logged out successfully' };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
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

        if (!user || !user.isActive) {
            return null;
        }

        const roleClaims = user.role.rolePermissions.map((rp) => rp.permission.code);
        const userClaims = user.userPermissions.map((up) => up.permission.code);
        const claims = [...new Set([...roleClaims, ...userClaims])];

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role.name,
            claims,
        };
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: string,
        claims: string[],
    ) {
        const payload = {
            sub: userId,
            email,
            role,
            claims,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('jwt.secret'),
            expiresIn: this.config.get('jwt.accessExpiration'),
        });

        const refreshToken = this.jwtService.sign(
            { sub: userId },
            {
                secret: this.config.get('jwt.refreshSecret'),
                expiresIn: this.config.get('jwt.refreshExpiration'),
            },
        );

        return {
            accessToken,
            refreshToken,
        };
    }
}
