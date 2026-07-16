import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { AuthUser } from '../interfaces/auth-user.interface';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import type { AuthResponse } from '../responses/auth.response';
import { RolesGaurd } from '../guards/roles.guard';
import { RoleEnum } from '../enums/role.enum';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { OtpService } from '../services/otp.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly otpService: OtpService,
    ) { }

    @Post('send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    @Post('register')
    register(@Body() dto: RegisterDto): Promise<AuthResponse> {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(
        @CurrentUser() user: AuthUser,
    ) {
        return user;
    }

    @Get('admin')
    @UseGuards(
        JwtAuthGuard,
        RolesGaurd,
    )
    @Roles(RoleEnum.ADMIN)
    getAdminPage() {
        return {
            message: 'Admin access granted',
        }
    };

    @Post('refresh')
    refresh(
        @Body() dto: RefreshTokenDto,
    ): Promise<AuthResponse> {
        return this.authService.refresh(dto.refreshToken,);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(
        @CurrentUser() user: AuthUser,
    ): Promise<void> {
        return this.authService.logout(user.userId,);
    }

    // ==========
    @Get('otp')
    testOtp() {
        return {
            otp: this.otpService.generateOtp(),
        }
    };
}