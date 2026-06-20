import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
    NotFoundException
} from "@nestjs/common";

import { PrismaService } from "src/core/database/prisma.service";

import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { RoleEnum } from "../enums/role.enum";
import { AuthResponse } from "../responses/auth.response";
import { AUTH_MESSAGES } from "../constants/auth.constants";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { RefreshTokenService } from "./refresh-token.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly refreshTokenService: RefreshTokenService
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

        const passwordHash = await this.passwordService.hash(
            dto.password,
        );

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
        );

        const accessToken = this.tokenService.generateAccessToken({
            sub: result.user.id,
            email: result.user.email,
            roles: [result.role.name],
        });

        const refreshToken = this.tokenService.generateRefreshToken(
            result.user.id,
        );

        await this.refreshTokenService.save(
            result.user.id,
            refreshToken
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

        const isPasswordValid = await this.passwordService.compare(
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

        const accessToken = this.tokenService.generateAccessToken({
            sub: user.id,
            email: user.email,
            roles,
        });

        const refreshToken = this.tokenService.generateRefreshToken(
            user.id,
        );

        await this.refreshTokenService.save(
            user.id,
            refreshToken,
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
}
