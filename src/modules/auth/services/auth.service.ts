import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
    NotFoundException
} from "@nestjs/common";

import { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/core/database/prisma.service";

import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { RoleEnum } from "../enums/role.enum";
import { AuthResponse } from "../responses/auth.response";
import { ConfigService } from "@nestjs/config";
import { AUTH_MESSAGES } from "../constants/auth.constants";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            },
        });

        if (existingUser) {
            throw new ConflictException(
                AUTH_MESSAGES.EMAIL_ALREADY_EXISTS,
            );
        }

        const passwordHash = await this.hashPassword(
            dto.password,
        )

        const result = await this.prisma.$transaction(
            async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        name: dto.organizationName,
                    },
                });

                const user = await tx.user.create({
                    data: {
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        email: dto.email,
                        passwordHash,
                        organizationId: organization.id,
                    }
                });

                const role = await tx.role.findUnique({
                    where: {
                        name: RoleEnum.CUSTOMER,
                    },
                });

                if (!role) {
                    throw new InternalServerErrorException(
                        'Customer role not found',
                    );
                }

                await tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: role.id,
                    },
                });

                return {
                    user,
                    role,
                }
            }
        )

        const accessToken = this.generateAccessToken(
            result.user.id,
            result.user.email,
            [result.role.name],
        );

        const refreshToken = this.generateRefreshToken(
            result.user.id,
        );

        return {
            accessToken,
            refreshToken,

            user: {
                id: result.user.id,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                email: result.user.email,
            },
        };
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(
                AUTH_MESSAGES.USER_NOT_FOUND,
            );
        }

        const isPasswordValid = await this.comparePassword(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        }

        const roles = user.userRoles.map(
            (userRole) => userRole.role.name,
        );

        const accessToken = this.generateAccessToken(
            user.id,
            user.email,
            roles,
        );

        const refreshToken = this.generateRefreshToken(
            user.id,
        );

        return {
            accessToken,
            refreshToken,

            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        };
    }

    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    private async comparePassword(
        password: string,
        hash: string,
    ): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    private generateAccessToken(
        userId: number,
        email: string,
        roles: string[],
    ): string {
        return this.jwtService.sign(
            {
                sub: userId,
                email,
                roles,
            },
            {
                expiresIn: this.configService.getOrThrow<StringValue>(
                    'JWT_EXPIRATION',
                ),
            },
        )
    }

    private generateRefreshToken(
        userId: number,
    ): string {
        return this.jwtService.sign(
            {
                sub: userId,
            },
            {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
                expiresIn: this.configService.getOrThrow<StringValue>(
                    'JWT_REFRESH_EXPIRATION',
                ),
            },
        )
    }
}