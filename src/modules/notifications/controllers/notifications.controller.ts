import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    findAll(@CurrentUser() user: AuthUser) {
        return this.notificationsService.findAll(user.userId);
    }

    @Post()
    create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateNotificationDto,
    ) {
        return this.notificationsService.create(user.userId, dto);
    }

    @Patch('read-all')
    markAllAsRead(@CurrentUser() user: AuthUser) {
        return this.notificationsService.markAllAsRead(user.userId);
    }

    @Patch(':id/read')
    markAsRead(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.notificationsService.markAsRead(user.userId, id);
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.notificationsService.delete(user.userId, id);
    }
}
