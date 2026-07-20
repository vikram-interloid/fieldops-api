import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';

const selectLocation = {
    id: true,
    organizationId: true,
    customerId: true,
    type: true,
    name: true,
    address: true,
    city: true,
    state: true,
    postalCode: true,
    country: true,
    lat: true,
    lng: true,
    createdAt: true,
    updatedAt: true,
    customer: { select: { name: true } },
};

@Injectable()
export class LocationsRepository {
    constructor(private readonly prisma: PrismaService) {}

    /** Resolves the org the user belongs to so every query stays tenant-scoped. */
    private async resolveOrganizationId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { organizationId: true },
        });

        if (!user) {
            throw new NotFoundException('User organization not found');
        }

        return user.organizationId;
    }

    async findAll(userId: string) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.location.findMany({
            where: { organizationId },
            select: selectLocation,
            orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
        });
    }
}
