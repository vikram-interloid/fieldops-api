import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UsersService } from '../services/users.service';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    @Get('profile')
    getProfile(
        @CurrentUser() user: AuthUser,
    ) {
        return this.usersService.findById(
            user.userId,
        );
    }

    @Patch('profile')
    updateProfile(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(
            user.userId,
            dto,
        );
    }

    @Delete('profile')
    removeProfile(
        @CurrentUser() user: AuthUser,
    ) {
        return this.usersService.delete(
            user.userId,
        );
    }
}
