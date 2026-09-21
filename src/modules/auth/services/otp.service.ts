import { Injectable, BadRequestException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { OTP_EXPIRY_MINUTES, OTP_LENGTH } from '../constants/otp.constants';
import { PasswordService } from './password.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { OtpPurpose, OTP_PURPOSE } from '../constants/otp-purpose.constants';
import { AUTH_MESSAGES } from '../constants/auth.constants';
import { EmailOtp } from 'generated/prisma/client';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async createOtp(email: string, purpose: OtpPurpose): Promise<string> {
    const otp = this.generateOtp();

    const codeHash = await this.passwordService.hash(otp);

    const expiresAt = this.getExpiryDate();

    await this.prisma.emailOtp.upsert({
      where: {
        email_purpose: {
          email,
          purpose,
        },
      },
      create: {
        email,
        purpose,
        codeHash,
        expiresAt,
        verifiedAt: null,
        consumedAt: null,
        attempts: 0,
      },
      update: {
        codeHash,
        expiresAt,
        verifiedAt: null,
        consumedAt: null,
        attempts: 0,
      },
    });

    return otp;
  }

  async validateOtp(email: string, purpose: OtpPurpose): Promise<EmailOtp> {
    const record = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OTP);
    }

    if (record.consumedAt) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_ALREADY_USED);
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_EXPIRED);
    }

    return record;
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<void> {
    const record = await this.validateOtp(dto.email, dto.purpose);

    const valid = await this.passwordService.compare(dto.otp, record.codeHash);

    if (!valid) {
      await this.prisma.emailOtp.update({
        where: {
          id: record.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException(AUTH_MESSAGES.INVALID_OTP);
    }

    await this.prisma.emailOtp.update({
      where: {
        id: record.id,
      },
      data: {
        verifiedAt: new Date(),
      },
    });
  }

  async isVerified(email: string, purpose: OtpPurpose): Promise<EmailOtp> {
    const record = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
      },
    });

    if (!record) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OTP);
    }

    if (!record.verifiedAt) {
      throw new BadRequestException(AUTH_MESSAGES.EMAIL_NOT_VERIFIED);
    }

    if (record.consumedAt) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_ALREADY_USED);
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_EXPIRED);
    }

    return record;
  }

  async deleteOtp(email: string, purpose: OtpPurpose): Promise<void> {
    await this.prisma.emailOtp.deleteMany({
      where: {
        email,
        purpose,
      },
    });
  }

  generateOtp(): string {
    const min = Math.pow(10, OTP_LENGTH - 1);

    const max = Math.pow(10, OTP_LENGTH);

    return randomInt(min, max).toString();
  }

  getExpiryDate() {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  }
}
