import { Module } from '@nestjs/common';

import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';

@Module({
    controllers: [NotificationsController],
    providers: [NotificationsRepository, NotificationsService],
})
export class NotificationModule {}
