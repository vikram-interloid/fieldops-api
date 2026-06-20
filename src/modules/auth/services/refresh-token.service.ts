import * as bcrypt from 'bcrypt';
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { PasswordService } from './password.service';

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
    ) { }

    async save(
        userId: number,
        refreshToken: string,
    ): Promise<void> {
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }

    async validate(
        userId: number,
        refreshToken: string,
    ): Promise<boolean> {
        const refreshTokens = await this.prisma.refreshToken.findMany({
            where: {
                userId,
            },
        });
        for (const token of refreshTokens) {
            const isValid = await this.passwordService.compare(refreshToken, token.tokenHash,);
            
            if (isValid) {
                return true;
            }
        }
        return false;
    }

    async deleteByUserId(
        userId: number,
    ): Promise<void> {
        await this.prisma.refreshToken.deleteMany({
            where: {
                userId: userId
            },
        });
    }
}