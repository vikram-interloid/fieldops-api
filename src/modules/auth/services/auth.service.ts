import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
    UnauthorizedException,
    NotFoundException
} from "@nestjs/common";

import { createHash, randomBytes } from "crypto";

import { ConfigService } from "@nestjs/config";

import { PrismaService } from "src/core/database/prisma.service";

import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { RoleEnum } from "../enums/role.enum";
import { AuthResponse } from "../responses/auth.response";
import { AUTH_MESSAGES } from "../constants/auth.constants";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { RefreshTokenService } from "./refresh-token.service";
import { MailService } from "./mail.service";
import { OtpService } from "./otp.service";
import { ResetPasswordOtpDto } from "../dto/reset-password-otp.dto";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly mailService: MailService,
        private readonly otpService: OtpService,
        private readonly config: ConfigService,
    ) { }

    private hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    /**
     * Starts a password reset. Always resolves the same way regardless of
     * whether the email exists (avoids leaking which emails are registered).
     * In non-production the reset link is returned so it can be surfaced in the
     * UI while there's no live mail transport.
     */
    async forgotPassword(dto: ForgotPasswordDto): Promise<{ devResetLink?: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true, email: true },
        });

        if (!user) {
            return {};
        }

        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate any outstanding tokens, then issue a fresh one.
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, usedAt: null },
        });
        await this.prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });

        const frontendUrl =
            this.config.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
        const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

        await this.mailService.sendPasswordReset(user.email, resetLink);

        const isProd = this.config.get<string>("NODE_ENV") === "production";
        return isProd ? {} : { devResetLink: resetLink };
    }

    /** Completes a reset: validates the token, sets the new password, and
     *  bumps tokenVersion so existing sessions are invalidated. */
    async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
        const tokenHash = this.hashToken(dto.token);
        const record = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new UnauthorizedException(
                "This reset link is invalid or has expired.",
            );
        }

        const passwordHash = await this.passwordService.hash(dto.password);

        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { passwordHash, tokenVersion: { increment: 1 } },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);

        return { success: true };
    }

    /** Resets a password using an emailed OTP (no reset link). */
    async resetPasswordWithOtp(
        dto: ResetPasswordOtpDto,
    ): Promise<{ success: true }> {
        await this.otpService.consume(dto.email, dto.code, "reset");

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
        }

        const passwordHash = await this.passwordService.hash(dto.password);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash, tokenVersion: { increment: 1 } },
        });

        return { success: true };
    }

    async register(dto: RegisterDto) {
        // Gate account creation on a verified email (single-use OTP).
        await this.otpService.consume(dto.email, dto.otp, "register");

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

        const orgType = dto.orgType === 'operator' ? 'operator' : 'customer';

        // Operator orgs are run by an admin (they manage technicians, customers,
        // etc.). A customer org's registrant IS the customer — they get the
        // Customer role and a linked Customer record so the customer-scoped
        // views (which key off the customer name) resolve to their own data.
        const isCustomerOrg = orgType === 'customer';
        const roleName = isCustomerOrg ? RoleEnum.CUSTOMER : RoleEnum.ADMIN;

        const result = await this.prisma.$transaction(
            async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        name: dto.organizationName,
                        type: orgType,
                        // Operator profile — empty/ignored for customer orgs.
                        categories:
                            orgType === 'operator'
                                ? (dto.categories ?? [])
                                : [],
                        region:
                            orgType === 'operator' ? dto.region : undefined,
                    },
                });

                // For a customer org, create the Customer record the whole
                // customer-scoping model is built around, and link the user to
                // it. The customer's name mirrors the organization name so it
                // matches the session's customerName everywhere.
                const customer = isCustomerOrg
                    ? await tx.customer.create({
                          data: {
                              organizationId: organization.id,
                              name: dto.organizationName,
                              contactName: `${dto.firstName} ${dto.lastName}`,
                              email: dto.email,
                              phone: '',
                              industry: 'General',
                              contractType: 'Standard',
                              status: 'Active',
                              city: dto.city,
                              address: dto.address,
                          },
                      })
                    : null;

                const user = await tx.user.create({
                    data: {
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        email: dto.email,
                        passwordHash,
                        organizationId: organization.id,
                        customerId: customer?.id,
                        // The registrant owns the tenant — they can manage
                        // other users in their org.
                        isOrgAdmin: true,
                    }
                });

                // Store the organization's HQ location when the registrant
                // gave any address details (geolocation is consent-gated, but
                // they may just type an address/city). For a customer org it
                // doubles as their first site, so link it to the customer.
                const hasLocation =
                    (dto.latitude !== undefined &&
                        dto.longitude !== undefined) ||
                    Boolean(dto.address) ||
                    Boolean(dto.city);
                if (hasLocation) {
                    await tx.location.create({
                        data: {
                            organizationId: organization.id,
                            customerId: customer?.id,
                            type: isCustomerOrg ? 'customer_site' : 'hq',
                            name: `${dto.organizationName} HQ`,
                            address: dto.address,
                            city: dto.city,
                            lat: dto.latitude,
                            lng: dto.longitude,
                        },
                    });
                }

                const role = await tx.role.findUnique({
                    where: {
                        name: roleName,
                    },
                });

                if (!role) {
                    throw new InternalServerErrorException(
                        `${roleName} role not found`,
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
                    customer,
                }
            }
        );

        const accessToken = this.tokenService.generateAccessToken({
            sub: result.user.id,
            email: result.user.email,
            roles: [result.role.name],
            tokenVersion: result.user.tokenVersion,
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
                roles: [result.role.name],
                customerName: result.customer?.name ?? null,
                orgType,
                isOrgAdmin: result.user.isOrgAdmin ?? null,
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
                customer: { select: { name: true } },
                technician: { select: { name: true } },
                organization: { select: { type: true } },
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
            tokenVersion: user.tokenVersion
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
                roles,
                customerName: user.customer?.name ?? null,
                technicianName: user.technician?.name ?? null,
                orgType: user.organization?.type ?? null,
                isOrgAdmin: user.isOrgAdmin ?? null,
            },
        };
    }

    async refresh(
        refreshToken: string
    ): Promise<AuthResponse> {
        const payload = this.tokenService.verifyRefreshToken(
            refreshToken,
        );
        const userId = payload.sub
        
        const isValid = await this.refreshTokenService.validate(
            userId,
            refreshToken,
        );

        if (!isValid) {
            throw new UnauthorizedException(
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
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

        const roles = user.userRoles.map(
            (userRole) => userRole.role.name,
        );

        const jwtPayload: JwtPayload = {
            sub: user.id,
            email: user.email,
            roles,
            tokenVersion: user.tokenVersion,
        };

        const accessToken = this.tokenService.generateAccessToken(
            jwtPayload,
        );

        const newRefreshToken = this.tokenService.generateRefreshToken(
            userId,
        );

        await this.refreshTokenService.deleteByUserId(
            user.id,
        );

        await this.refreshTokenService.save(
            userId,
            newRefreshToken,
        );

        return {
            accessToken,
            refreshToken,

            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                roles,
            },
        };
    }

    async logout(
        userId: number,
    ): Promise<void> {
        await this.refreshTokenService.deleteByUserId(
            userId,
        );

        await this.prisma.user.update({
            where: {
                id: userId,
            },

            data: {
                tokenVersion: {
                    increment: 1,
                },
            },
        });
    }
}
