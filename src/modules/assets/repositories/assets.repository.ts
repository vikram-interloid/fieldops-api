import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';

const selectAsset = {
    id: true,
    name: true,
    serial: true,
    customerId: true,
    health: true,
    warranty: true,
    status: true,
    category: true,
    manufacturer: true,
    model: true,
    location: true,
    purchaseDate: true,
    lastServiceDate: true,
    nextServiceDate: true,
    notes: true,
    photoUrl: true,
    locationId: true,
    deliveryPointId: true,
    createdAt: true,
    updatedAt: true,
    customer: { select: { name: true } },
    site: { select: { name: true } },
    deliveryPoint: { select: { name: true } },
};

@Injectable()
export class AssetsRepository {
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

    /**
     * Read scope: platform staff (FieldOps) see every tenant's assets; a
     * customer/operator tenant only sees its own org's assets.
     */
    private async orgScope(userId: number): Promise<{ organizationId?: number }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                organizationId: true,
                organization: { select: { type: true } },
            },
        });
        if (!user) throw new NotFoundException('User organization not found');
        return user.organization?.type === 'platform'
            ? {}
            : { organizationId: user.organizationId };
    }

    async findAll(userId: number) {
        const scope = await this.orgScope(userId);

        return this.prisma.asset.findMany({
            where: scope,
            select: selectAsset,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(userId: number, id: number) {
        const scope = await this.orgScope(userId);

        return this.prisma.asset.findFirst({
            where: { id, ...scope },
            select: selectAsset,
        });
    }

    async create(userId: number, dto: CreateAssetDto) {
        const organizationId = await this.resolveOrganizationId(userId);

        return this.prisma.asset.create({
            data: { ...dto, organizationId },
            select: selectAsset,
        });
    }

    update(id: number, dto: UpdateAssetDto) {
        return this.prisma.asset.update({
            where: { id },
            data: dto,
            select: selectAsset,
        });
    }

    delete(id: number) {
        return this.prisma.asset.delete({
            where: { id },
        });
    }
}
