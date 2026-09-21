import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/core/database/prisma.service';

import { SendOtpDto } from '../dto/send-otp.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RoleEnum } from '../enums/role.enum';
import { AuthResponse } from '../responses/auth.response';
import { OTP_EXPIRY_MINUTES } from '../constants/otp.constants';
import { OTP_PURPOSE } from '../constants/otp-purpose.constants';
import { AUTH_MESSAGES } from '../constants/auth.constants';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RefreshTokenService } from './refresh-token.service';
import { OtpService } from './otp.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResetPasswordOtpDto } from '../dto/reset-password-otp.dto';
import { EmailService } from 'src/core/email/services/email.service';
import { CloudFrontSignerService } from 'src/core/storage/services/cloudfront-signer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly cloudFrontSigner: CloudFrontSignerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const verifiedOtp = await this.otpService.isVerified(
      dto.email,
      OTP_PURPOSE.REGISTER,
    );

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const orgType = dto.orgType === 'operator' ? 'operator' : 'customer';

    const isCustomerOrg = orgType === 'customer';
    const roleName = isCustomerOrg ? RoleEnum.CUSTOMER : RoleEnum.ADMIN;

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          type: orgType,
          categories: orgType === 'operator' ? (dto.categories ?? []) : [],
          region: orgType === 'operator' ? dto.region : undefined,
        },
      });

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
          isOrgAdmin: true,
        },
      });

      const hasLocation =
        (dto.latitude !== undefined && dto.longitude !== undefined) ||
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
        throw new InternalServerErrorException(`${roleName} role not found`);
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      await tx.emailOtp.update({
        where: {
          id: verifiedOtp.id,
        },
        data: {
          consumedAt: new Date(),
        },
      });

      return {
        user,
        role,
        customer,
      };
    });

    const accessToken = this.tokenService.generateAccessToken({
      sub: result.user.id,
      email: result.user.email,
      roles: [result.role.name],
      tokenVersion: result.user.tokenVersion,
    });

    const refreshToken = this.tokenService.generateRefreshToken(result.user.id);

    await this.refreshTokenService.save(result.user.id, refreshToken);

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
        verificationStatus: 'pending',
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
        customer: { select: { id: true, name: true, contactName: true } },
        technician: { select: { name: true } },
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    let customer = user.customer;
    if (!customer && user.organization?.type === 'customer') {
      customer = await this.prisma.customer.findFirst({
        where: {
          OR: [{ email: user.email }, { organizationId: user.organizationId }],
        },
        select: { id: true, name: true, contactName: true },
      });

      if (customer) {
        await this.prisma.user
          .update({
            where: { id: user.id },
            data: { customerId: customer.id },
          })
          .catch(() => {});
      }
    }

    let firstName = user.firstName;
    let lastName = user.lastName;
    if (customer?.contactName) {
      const parts = customer.contactName.trim().split(/\s+/);
      const contactFirst = parts[0] || customer.contactName.trim();
      const contactLast = parts.slice(1).join(' ') || '';
      if (
        contactFirst &&
        (contactFirst !== firstName || contactLast !== lastName)
      ) {
        firstName = contactFirst;
        lastName = contactLast;
        await this.prisma.user
          .update({
            where: { id: user.id },
            data: { firstName, lastName },
          })
          .catch(() => {});
      }
    }

    const roles = user.userRoles.map((userRole) => userRole.role.name);

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      tokenVersion: user.tokenVersion,
    });

    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    await this.refreshTokenService.save(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,

      user: {
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        avatarUrl: user.avatarKey
          ? this.cloudFrontSigner.getSignedUrl(user.avatarKey)
          : user.avatarUrl
            ? user.avatarUrl.startsWith('data:')
              ? user.avatarUrl
              : this.cloudFrontSigner.getSignedUrl(user.avatarUrl)
            : null,
        roles,
        customerName: customer?.name ?? user.customer?.name ?? null,
        technicianName: user.technician?.name ?? null,
        organizationName: user.organization?.name ?? customer?.name ?? null,
        orgType: user.organization?.type ?? null,
        isOrgAdmin: user.isOrgAdmin ?? null,
        verificationStatus: user.organization?.verificationStatus ?? null,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const userId = payload.sub;

    const isValid = await this.refreshTokenService.validate(
      userId,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
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
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const roles = user.userRoles.map((userRole) => userRole.role.name);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.tokenService.generateAccessToken(jwtPayload);

    const newRefreshToken = this.tokenService.generateRefreshToken(userId);

    await this.refreshTokenService.deleteByUserId(user.id);

    await this.refreshTokenService.save(userId, newRefreshToken);

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

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.deleteByUserId(userId);

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

  async sendOtp(dto: SendOtpDto): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (dto.purpose === OTP_PURPOSE.REGISTER && existingUser) {
      throw new ConflictException(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    if (dto.purpose === OTP_PURPOSE.RESET_PASSWORD && !existingUser) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const otp = await this.otpService.createOtp(dto.email, dto.purpose);

    await this.emailService.sendOtpEmail({
      to: dto.email,
      name: 'User',
      otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    });
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<void> {
    await this.otpService.verifyOtp(dto);
  }

  async resetPasswordWithOtp(dto: ResetPasswordOtpDto): Promise<void> {
    await this.otpService.verifyOtp({
      email: dto.email,
      otp: dto.otp,
      purpose: OTP_PURPOSE.RESET_PASSWORD,
    });

    const verifiedOtp = await this.otpService.isVerified(
      dto.email,
      OTP_PURPOSE.RESET_PASSWORD,
    );
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(AUTH_MESSAGES.USER_NOT_FOUND);
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.emailOtp.update({
        where: { id: verifiedOtp.id },
        data: { consumedAt: new Date() },
      }),
    ]);
  }
}
