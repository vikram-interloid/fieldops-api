import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationResponse } from '../responses/notification.response';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NOTIFICATION_MESSAGES } from '../constants/notification.constants';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly notificationsRepository: NotificationsRepository,
    ) {}

    findAll(userId: string) {
        return this.notificationsRepository.findAll(userId);
    }

    async findById(userId: string, id: string): Promise<NotificationResponse> {
        const notification = await this.notificationsRepository.findById(
            userId,
            id,
        );

        if (!notification) {
            throw new NotFoundException(NOTIFICATION_MESSAGES.NOT_FOUND);
        }

        return notification;
    }

    create(userId: string, dto: CreateNotificationDto) {
        return this.notificationsRepository.create(userId, dto);
    }

    async markAsRead(
        userId: string,
        id: string,
    ): Promise<NotificationResponse> {
        await this.findById(userId, id);

        return this.notificationsRepository.markAsRead(id);
    }

    markAllAsRead(userId: string) {
        return this.notificationsRepository.markAllAsRead(userId);
    }

    async delete(userId: string, id: string): Promise<void> {
        await this.findById(userId, id);

        await this.notificationsRepository.delete(id);
    }
}
