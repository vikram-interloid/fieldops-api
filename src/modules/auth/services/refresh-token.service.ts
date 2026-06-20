import * as bcrypt from 'bcrypt';
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly prisma: PrismaService,
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
}