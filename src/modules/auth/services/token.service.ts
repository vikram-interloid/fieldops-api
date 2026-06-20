import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { StringValue } from "ms";

import type { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    generateAccessToken(
        payload: JwtPayload,
    ): string {
        return this.jwtService.sign(
            payload,
            {
                expiresIn: this.configService.getOrThrow<StringValue>(
                    'JWT_EXPIRATION',
                ),
            },
        );
    }

    generateRefreshToken(
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
            }
        )
    }

    verifyRefreshToken(
        refreshToken: string,
    ): { sub: number } {
        return this.jwtService.verify(
            refreshToken,
            {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
            },
        );
    }
}
