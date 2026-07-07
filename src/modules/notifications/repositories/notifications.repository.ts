import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';

const selectNotification = {
    id: true,
    title: true,
    message: true,
    type: true,
    read: true,
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class NotificationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Resolves the organization the user belongs to. Every query is scoped to
     * this organization so tenants never see each other's records.
     */
    private async resolveOrganizationId(userId: number): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });

        if (!user) {
            throw new NotFoundException('User organization not found');
        }

        return user.organizationId;
    }

    async findAll(userId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.notification.findMany({
            where: { organizationId },
            select: selectNotification,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.notification.findFirst({
            where: { id, organizationId },
            select: selectNotification,
        });
    }

    async create(userId: number, dto: CreateNotificationDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.notification.create({
            data: { ...dto, organizationId },
            select: selectNotification,
        });
    }

    markAsRead(id: number) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
            select: selectNotification,
        });
    }

    async markAllAsRead(userId: number) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.notification.updateMany({
            where: { organizationId },
            data: { read: true },
        });
    }

    delete(id: number) {
        return this.prisma.notification.delete({
            where: { id },
        });
    }
}
