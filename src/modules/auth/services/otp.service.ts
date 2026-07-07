import {
    BadRequestException,
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt } from 'crypto';

import { PrismaService } from 'src/core/database/prisma.service';

import { MailService } from './mail.service';

export type OtpPurpose = 'register' | 'reset';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/**
 * Issues and validates short-lived email verification codes (OTP) for both
 * account registration and password reset. Codes are stored hashed and are
 * single-use. In non-production the code is returned so the UI can surface it
 * while there's no live mail transport.
 */
@Injectable()
export class OtpService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
        private readonly config: ConfigService,
    ) {}

    private hash(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    private get isProduction(): boolean {
        return this.config.get<string>('NODE_ENV') === 'production';
    }

    /** Generates + emails a code. Blocks register for taken emails; stays quiet
     *  for reset on unknown emails (avoids account enumeration). */
    async send(
        email: string,
        purpose: OtpPurpose,
    ): Promise<{ devOtp?: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (purpose === 'register' && user) {
            throw new ConflictException(
                'An account with this email already exists.',
            );
        }
        if (purpose === 'reset' && !user) {
            return {};
        }

        const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
        const codeHash = this.hash(code);
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);

        await this.prisma.emailOtp.deleteMany({ where: { email, purpose } });
        await this.prisma.emailOtp.create({
            data: { email, purpose, codeHash, expiresAt },
        });

        await this.mail.sendOtp(email, code, purpose);

        return this.isProduction ? {} : { devOtp: code };
    }

    /** Validates a code without consuming it (for UI step-gating). */
    async verify(
        email: string,
        code: string,
        purpose: OtpPurpose,
    ): Promise<{ valid: true }> {
        await this.check(email, code, purpose, false);
        return { valid: true };
    }

    /** Validates and consumes a code (single-use). Call at the final action. */
    async consume(
        email: string,
        code: string,
        purpose: OtpPurpose,
    ): Promise<void> {
        await this.check(email, code, purpose, true);
    }

    private async check(
        email: string,
        code: string,
        purpose: OtpPurpose,
        consume: boolean,
    ): Promise<void> {
        const record = await this.prisma.emailOtp.findFirst({
            where: { email, purpose, consumedAt: null },
            orderBy: { createdAt: 'desc' },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestException(
                'This code is invalid or has expired. Request a new one.',
            );
        }
        if (record.attempts >= MAX_ATTEMPTS) {
            throw new BadRequestException(
                'Too many attempts. Request a new code.',
            );
        }
        if (record.codeHash !== this.hash(code)) {
            await this.prisma.emailOtp.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            throw new BadRequestException('Incorrect verification code.');
        }
        if (consume) {
            await this.prisma.emailOtp.update({
                where: { id: record.id },
                data: { consumedAt: new Date() },
            });
        }
    }
}
